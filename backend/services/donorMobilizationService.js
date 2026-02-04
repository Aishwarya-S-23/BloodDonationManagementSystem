const Donor = require('../models/Donor');
const Appointment = require('../models/Appointment');
const BloodRequest = require('../models/BloodRequest');
const { getCompatibleBloodGroups, canDonateAfterCooldown } = require('../utils/helpers');
const { sortByDistance, estimateTravelTime } = require('../utils/geolocation');
const notificationService = require('./notificationService');

/**
 * Find eligible donors for a blood request
 */
const findEligibleDonors = async (bloodRequest, maxDonors = 50) => {
  const { bloodGroup, component, units, hospitalId } = bloodRequest;
  
  // Get compatible blood groups
  const compatibleGroups = getCompatibleBloodGroups(bloodGroup);
  
  // Get hospital location
  const Hospital = require('../models/Hospital');
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital || !hospital.coordinates) {
    throw new Error('Hospital location not found');
  }

  // Find eligible donors
  const donors = await Donor.find({
    bloodGroup: { $in: compatibleGroups },
    eligibilityStatus: 'eligible',
    availability: 'available',
    coordinates: { $exists: true },
  }).populate('userId', 'email');

  // Filter by cooldown and calculate distances
  const eligibleDonors = [];
  for (const donor of donors) {
    if (canDonateAfterCooldown(donor.lastDonationDate, donor.cooldownDays)) {
      const distance = sortByDistance(
        [donor],
        hospital.coordinates.latitude,
        hospital.coordinates.longitude
      )[0].distance;
      
      eligibleDonors.push({
        ...donor.toObject(),
        distance,
      });
    }
  }

  // Sort by distance
  const sortedDonors = sortByDistance(
    eligibleDonors,
    hospital.coordinates.latitude,
    hospital.coordinates.longitude
  );

  return sortedDonors.slice(0, maxDonors);
};

/**
 * Mobilize donors for a blood request
 */
const mobilizeDonors = async (bloodRequest, maxNotifications = 30) => {
  const issued = bloodRequest.issuedUnits || 0;
  const reserved = bloodRequest.reservedUnits || 0;
  const remainingDeficit = Math.max(0, bloodRequest.units - (issued + reserved));

  // Nothing to mobilize
  if (remainingDeficit <= 0) {
    return { notified: 0, appointments: 0 };
  }

  // Cap notifications to remaining deficit (plus small buffer)
  const targetNotifications = Math.min(maxNotifications, remainingDeficit * 2);

  const eligibleDonors = await findEligibleDonors(bloodRequest, targetNotifications);

  if (eligibleDonors.length === 0) {
    return { notified: 0, appointments: 0 };
  }

  // Create notifications
  const notifications = eligibleDonors.map((donor) => ({
    recipientId: donor.userId._id || donor.userId,
    recipientModel: 'User',
    recipientRole: 'Donor',
    type: 'donor_needed',
    title: `Blood Donation Request - ${bloodRequest.bloodGroup}`,
    message: `Urgent blood donation needed: ${bloodRequest.units} units of ${bloodRequest.bloodGroup} ${bloodRequest.component}. Please confirm your availability.`,
    relatedEntityId: bloodRequest._id,
    relatedEntityType: 'BloodRequest',
    priority: bloodRequest.urgency === 'critical' ? 'urgent' : 'high',
    actionUrl: `/donors/appointments?requestId=${bloodRequest._id}`,
  }));

  await notificationService.sendBulkNotifications(eligibleDonors, notifications[0]);

  // Update request
  bloodRequest.fulfillmentDetails.donorMobilization.initiated = true;
  bloodRequest.fulfillmentDetails.donorMobilization.donorsNotified = eligibleDonors.length;
  await bloodRequest.save();

  return {
    notified: eligibleDonors.length,
    appointments: 0, // Appointments created separately when donor confirms
  };
};

/**
 * Create appointment for donor
 */
const createDonorAppointment = async (donorId, bloodBankId, requestId, scheduledDate) => {
  const appointment = new Appointment({
    donorId,
    bloodBankId,
    requestId,
    scheduledDate,
    status: 'pending',
  });

  await appointment.save();

  // Notify donor
  const Donor = require('../models/Donor');
  const donor = await Donor.findById(donorId).populate('userId');
  
  await notificationService.createNotification({
    recipientId: donor.userId._id,
    recipientModel: 'User',
    recipientRole: 'Donor',
    type: 'appointment_reminder',
    title: 'Blood Donation Appointment Scheduled',
    message: `Your appointment is scheduled for ${scheduledDate.toLocaleString()}`,
    relatedEntityId: appointment._id,
    relatedEntityType: 'Appointment',
    priority: 'medium',
  });

  // Update request
  const bloodRequest = await BloodRequest.findById(requestId);
  if (bloodRequest) {
    bloodRequest.fulfillmentDetails.donorMobilization.appointmentsCreated += 1;
    await bloodRequest.save();
  }

  return appointment;
};

/**
 * Stop donor mobilization (when request is fulfilled)
 */
const stopMobilization = async (requestId) => {
  const bloodRequest = await BloodRequest.findById(requestId);
  if (!bloodRequest) return;

  // Cancel pending appointments
  await Appointment.updateMany(
    {
      requestId,
      status: { $in: ['pending', 'confirmed'] },
    },
    {
      status: 'cancelled',
    }
  );

  // Notify donors that request is fulfilled
  const appointments = await Appointment.find({ requestId });
  const donorIds = [...new Set(appointments.map((a) => a.donorId))];

  for (const donorId of donorIds) {
    const Donor = require('../models/Donor');
    const donor = await Donor.findById(donorId).populate('userId');
    if (donor && donor.userId) {
      await notificationService.createNotification({
        recipientId: donor.userId._id,
        recipientModel: 'User',
        recipientRole: 'Donor',
        type: 'request_fulfilled',
        title: 'Blood Request Fulfilled',
        message: 'The blood request you were notified about has been fulfilled. Thank you for your willingness to help!',
        relatedEntityId: requestId,
        relatedEntityType: 'BloodRequest',
        priority: 'low',
      });
    }
  }
};

module.exports = {
  findEligibleDonors,
  mobilizeDonors,
  createDonorAppointment,
  stopMobilization,
};

