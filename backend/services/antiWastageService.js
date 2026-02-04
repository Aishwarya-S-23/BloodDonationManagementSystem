const Inventory = require('../models/Inventory');
const BloodRequest = require('../models/BloodRequest');
const Transportation = require('../models/Transportation');
const notificationService = require('./notificationService');
const AuditLog = require('../models/AuditLog');

/**
 * Anti-Wastage Service
 * Automatically manages inventory to prevent waste and ensure safety
 */

/**
 * Release expired reservations
 */
const releaseExpiredReservations = async () => {
  try {
    const now = new Date();
    const expiredReservations = await Inventory.find({
      status: 'reserved',
      'reservedFor.expiresAt': { $lt: now },
    }).populate({
      path: 'reservedFor.requestId',
      populate: {
        path: 'hospitalId',
        select: 'userId'
      }
    });

    console.log(`Found ${expiredReservations.length} expired reservations to release`);

    for (const inventory of expiredReservations) {
      await releaseReservation(inventory._id);

      // Notify relevant parties
      const request = inventory.reservedFor.requestId;
      if (request && request.hospitalId) {
        await notificationService.createNotification({
          recipientId: request.hospitalId.userId,
          recipientModel: 'User',
          recipientRole: 'Hospital',
          type: 'reservation_expired',
          title: 'Blood Reservation Expired',
          message: `Reservation for ${inventory.bloodGroup} ${inventory.component} (${inventory.units} units) has expired and been released back to inventory.`,
          relatedEntityId: request._id,
          relatedEntityType: 'BloodRequest',
          priority: 'medium',
        });
      }

      // Audit log
      await AuditLog.create({
        userId: null, // System action
        userRole: 'System',
        action: 'release_expired_reservation',
        entityType: 'Inventory',
        entityId: inventory._id,
        details: {
          bloodGroup: inventory.bloodGroup,
          component: inventory.component,
          units: inventory.units,
          expiredAt: inventory.reservedFor.expiresAt,
        },
      });
    }

    return { released: expiredReservations.length };
  } catch (error) {
    console.error('Error releasing expired reservations:', error);
    throw error;
  }
};

/**
 * Release a specific reservation
 */
const releaseReservation = async (inventoryId) => {
  try {
    const inventory = await Inventory.findById(inventoryId);

    if (!inventory || inventory.status !== 'reserved') {
      return { success: false, message: 'Inventory not found or not reserved' };
    }

    // Clear reservation data
    inventory.status = 'available';
    inventory.reservedFor = undefined;
    await inventory.save();

    return { success: true, inventory };
  } catch (error) {
    console.error('Error releasing reservation:', error);
    throw error;
  }
};

/**
 * Check and discard expired blood units
 */
const discardExpiredUnits = async () => {
  try {
    const now = new Date();
    const expiredUnits = await Inventory.find({
      status: { $in: ['available', 'reserved'] },
      expiryDate: { $lt: now },
    });

    console.log(`Found ${expiredUnits.length} expired blood units to discard`);

    for (const unit of expiredUnits) {
      // Change status to expired
      unit.status = 'expired';
      await unit.save();

      // If reserved, release the reservation
      if (unit.status === 'reserved') {
        await releaseReservation(unit._id);
      }

      // Notify blood bank
      const BloodBank = require('../models/BloodBank');
      const bloodBank = await BloodBank.findById(unit.bloodBankId);

      if (bloodBank) {
        await notificationService.createNotification({
          recipientId: bloodBank.userId,
          recipientModel: 'User',
          recipientRole: 'BloodBank',
          type: 'blood_expired',
          title: 'Blood Unit Expired',
          message: `${unit.bloodGroup} ${unit.component} (${unit.units} units) has expired and been marked for disposal.`,
          relatedEntityId: unit._id,
          relatedEntityType: 'Inventory',
          priority: 'high',
        });
      }

      // Audit log
      await AuditLog.create({
        userId: null,
        userRole: 'System',
        action: 'discard_expired_blood',
        entityType: 'Inventory',
        entityId: unit._id,
        details: {
          bloodGroup: unit.bloodGroup,
          component: unit.component,
          units: unit.units,
          expiryDate: unit.expiryDate,
          batchNumber: unit.batchNumber,
        },
      });
    }

    return { discarded: expiredUnits.length };
  } catch (error) {
    console.error('Error discarding expired units:', error);
    throw error;
  }
};

/**
 * Optimize inventory distribution (prevent overstocking)
 */
const optimizeInventoryDistribution = async () => {
  try {
    // Find blood banks with excess inventory
    const bloodBanks = await require('../models/BloodBank').find({ status: 'active' });

    for (const bloodBank of bloodBanks) {
      // Check for blood groups with high stock levels
      const inventorySummary = await Inventory.aggregate([
        { $match: { bloodBankId: bloodBank._id, status: 'available' } },
        {
          $group: {
            _id: { bloodGroup: '$bloodGroup', component: '$component' },
            totalUnits: { $sum: '$units' },
            count: { $sum: 1 },
          },
        },
        { $match: { totalUnits: { $gt: 50 } } }, // More than 50 units of same type
      ]);

      for (const summary of inventorySummary) {
        // Suggest redistribution to blood banks with low stock
        const lowStockBanks = await findBloodBanksWithLowStock(
          summary._id.bloodGroup,
          summary._id.component,
          bloodBank._id
        );

        if (lowStockBanks.length > 0) {
          // Create redistribution suggestion notification
          await notificationService.createNotification({
            recipientId: bloodBank.userId,
            recipientModel: 'User',
            recipientRole: 'BloodBank',
            type: 'inventory_redistribution',
            title: 'Inventory Redistribution Suggested',
            message: `You have excess ${summary._id.bloodGroup} ${summary._id.component} (${summary.totalUnits} units). Consider redistributing to nearby blood banks with shortages.`,
            priority: 'low',
          });
        }
      }
    }

    return { optimized: true };
  } catch (error) {
    console.error('Error optimizing inventory distribution:', error);
    throw error;
  }
};

/**
 * Find blood banks with low stock of specific blood type
 */
const findBloodBanksWithLowStock = async (bloodGroup, component, excludeBloodBankId) => {
  const lowStockThreshold = 10; // Less than 10 units

  const lowStockBanks = await Inventory.aggregate([
    {
      $match: {
        bloodBankId: { $ne: excludeBloodBankId },
        bloodGroup,
        component,
        status: 'available',
      },
    },
    {
      $group: {
        _id: '$bloodBankId',
        totalUnits: { $sum: '$units' },
      },
    },
    { $match: { totalUnits: { $lt: lowStockThreshold } } },
    {
      $lookup: {
        from: 'bloodbanks',
        localField: '_id',
        foreignField: '_id',
        as: 'bloodBank',
      },
    },
    { $unwind: '$bloodBank' },
    { $match: { 'bloodBank.status': 'active' } },
  ]);

  return lowStockBanks;
};

/**
 * Cancel unnecessary donor appointments when blood is sourced elsewhere
 */
const cancelUnnecessaryAppointments = async (requestId) => {
  try {
    const request = await BloodRequest.findById(requestId);
    if (!request) return;

    // If request is fully fulfilled by issued units, cancel donor appointments
    const fulfilledByBloodBanks = (request.issuedUnits || 0) >= request.units;

    if (fulfilledByBloodBanks && request.fulfillmentDetails.donorMobilization.initiated) {
      const Appointment = require('../models/Appointment');

      // Cancel all pending appointments for this request
      const cancelledAppointments = await Appointment.updateMany(
        {
          requestId,
          status: { $in: ['pending', 'confirmed'] },
        },
        {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: 'Blood sourced from blood bank inventory',
        }
      );

      // Notify affected donors
      const appointments = await Appointment.find({ requestId }).populate('donorId');
      for (const appointment of appointments) {
        if (appointment.donorId && appointment.donorId.userId) {
          await notificationService.createNotification({
            recipientId: appointment.donorId.userId,
            recipientModel: 'User',
            recipientRole: 'Donor',
            type: 'appointment_cancelled',
            title: 'Appointment Cancelled',
            message: 'Your donation appointment has been cancelled as sufficient blood was sourced from existing inventory. Thank you for your willingness to help!',
            relatedEntityId: appointment._id,
            relatedEntityType: 'Appointment',
            priority: 'low',
          });
        }
      }

      // Update request
      request.fulfillmentDetails.donorMobilization.appointmentsCreated = 0;
      await request.save();

      return { cancelled: cancelledAppointments.modifiedCount };
    }

    return { cancelled: 0 };
  } catch (error) {
    console.error('Error cancelling unnecessary appointments:', error);
    throw error;
  }
};

/**
 * Monitor and prevent over-donation (donor fatigue)
 */
const preventOverDonation = async (donorId, newAppointmentDate) => {
  try {
    const Donor = require('../models/Donor');
    const donor = await Donor.findById(donorId);

    if (!donor) return { allowed: false, reason: 'Donor not found' };

    // Check cooldown period
    const { canDonateAfterCooldown } = require('../utils/helpers');
    if (!canDonateAfterCooldown(donor.lastDonationDate, donor.cooldownDays)) {
      return {
        allowed: false,
        reason: 'Donor is still in cooldown period',
        nextEligibleDate: new Date(donor.lastDonationDate.getTime() + (donor.cooldownDays * 24 * 60 * 60 * 1000)),
      };
    }

    // Check for too frequent donations (prevent fatigue)
    const recentDonations = await require('../models/Donation').countDocuments({
      donorId,
      donationDate: {
        $gte: new Date(newAppointmentDate.getTime() - (30 * 24 * 60 * 60 * 1000)), // Last 30 days
      },
    });

    if (recentDonations >= 1) {
      return {
        allowed: false,
        reason: 'Donor has donated recently. Please allow adequate recovery time.',
        nextEligibleDate: new Date(newAppointmentDate.getTime() + (30 * 24 * 60 * 60 * 1000)),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking over-donation prevention:', error);
    throw error;
  }
};

/**
 * Run scheduled maintenance tasks
 */
const runMaintenanceTasks = async () => {
  try {
    console.log('Running anti-wastage maintenance tasks...');

    const results = await Promise.allSettled([
      releaseExpiredReservations(),
      discardExpiredUnits(),
      optimizeInventoryDistribution(),
    ]);

    const summary = {
      expiredReservationsReleased: results[0].status === 'fulfilled' ? results[0].value.released : 0,
      expiredUnitsDiscarded: results[1].status === 'fulfilled' ? results[1].value.discarded : 0,
      optimizationCompleted: results[2].status === 'fulfilled',
      timestamp: new Date(),
    };

    console.log('Maintenance tasks completed:', summary);
    return summary;
  } catch (error) {
    console.error('Error running maintenance tasks:', error);
    throw error;
  }
};

module.exports = {
  releaseExpiredReservations,
  releaseReservation,
  discardExpiredUnits,
  optimizeInventoryDistribution,
  cancelUnnecessaryAppointments,
  preventOverDonation,
  runMaintenanceTasks,
};
