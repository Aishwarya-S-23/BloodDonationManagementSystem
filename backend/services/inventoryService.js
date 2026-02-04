const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const BloodRequest = require('../models/BloodRequest');

/**
 * Get available inventory for a blood bank
 */
const getAvailableInventory = async (bloodBankId, bloodGroup, component = 'whole') => {
  const now = new Date();
  
  return await Inventory.find({
    bloodBankId,
    bloodGroup,
    component,
    status: 'available',
    expiryDate: { $gt: now },
  }).sort({ expiryDate: 1 }); // Sort by earliest expiry first (FIFO)
};

/**
 * Reserve inventory for a request with transaction support
 */
const reserveInventory = async (
  bloodBankId,
  bloodGroup,
  component,
  units,
  requestId,
  reservationExpiryMinutes = 30,
  session = null,
  lockId = null
) => {
  const available = await getAvailableInventory(bloodBankId, bloodGroup, component);
  
  const totalAvailable = available.reduce((sum, item) => sum + item.units, 0);
  
  if (totalAvailable < units) {
    throw new Error(`Insufficient inventory. Available: ${totalAvailable}, Required: ${units}`);
  }

  const reserved = [];
  let remainingUnits = units;
  const expiryDate = new Date(Date.now() + reservationExpiryMinutes * 60 * 1000);
  const effectiveLockId = lockId || `${requestId}-${Date.now()}`;

  for (const item of available) {
    if (remainingUnits <= 0) break;

    const unitsToReserve = Math.min(item.units, remainingUnits);

    item.status = 'reserved';
    item.reservedQuantity = unitsToReserve;
    item.reservedFor = {
      requestId,
      reservedAt: new Date(),
      expiresAt: expiryDate,
      lockId: effectiveLockId,
    };

    if (unitsToReserve < item.units) {
      // Split inventory item for remaining available units
      const remainingUnitsInItem = item.units - unitsToReserve;
      item.units = unitsToReserve;

      const newItem = new Inventory({
        ...item.toObject(),
        _id: undefined,
        units: remainingUnitsInItem,
        reservedQuantity: 0,
        issuedQuantity: 0,
        status: 'available',
        reservedFor: undefined,
      });

      if (session) {
        await newItem.save({ session });
      } else {
        await newItem.save();
      }
    }

    if (session) {
      await item.save({ session });
    } else {
      await item.save();
    }

    reserved.push(item);
    remainingUnits -= unitsToReserve;
  }

  return { reserved, lockId: effectiveLockId };
};

/**
 * Release reserved inventory (if request cancelled)
 */
const releaseReservation = async (requestId) => {
  const reserved = await Inventory.find({
    'reservedFor.requestId': requestId,
    status: 'reserved',
  });

  for (const item of reserved) {
    item.status = 'available';
    item.reservedQuantity = 0;
    item.reservedFor = undefined;
    await item.save();
  }

  return reserved.length;
};

/**
 * Issue inventory (mark as issued)
 */
const issueInventory = async (inventoryIds, requestId) => {
  const items = await Inventory.find({
    _id: { $in: inventoryIds },
    'reservedFor.requestId': requestId,
    status: 'reserved',
  });

  if (items.length !== inventoryIds.length) {
    throw new Error('Some inventory items not found or not reserved');
  }

  for (const item of items) {
    item.status = 'issued';
    item.issuedQuantity = item.reservedQuantity || item.units;
    item.reservedQuantity = 0;
    item.reservedFor = undefined;
    await item.save();
  }

  return items;
};

/**
 * Check for expiring inventory
 */
const getExpiringInventory = async (bloodBankId, thresholdDays = 7) => {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + thresholdDays);

  return await Inventory.find({
    bloodBankId,
    status: 'available',
    expiryDate: {
      $lte: thresholdDate,
      $gt: new Date(),
    },
  }).sort({ expiryDate: 1 });
};

/**
 * Mark expired inventory
 */
const markExpiredInventory = async () => {
  const now = new Date();
  const result = await Inventory.updateMany(
    {
      expiryDate: { $lt: now },
      status: { $in: ['available', 'reserved'] },
    },
    {
      $set: { status: 'expired' },
    }
  );

  return result.modifiedCount;
};

/**
 * Get inventory summary for a blood bank
 */
const getInventorySummary = async (bloodBankId) => {
  const summary = await Inventory.aggregate([
    {
      $match: { bloodBankId: new mongoose.Types.ObjectId(bloodBankId) },
    },
    {
      $group: {
        _id: {
          bloodGroup: '$bloodGroup',
          component: '$component',
          status: '$status',
        },
        totalUnits: { $sum: '$units' },
      },
    },
  ]);

  return summary;
};

/**
 * Lock inventory during issuance (prevent concurrent modifications)
 */
const lockInventoryForIssuance = async (inventoryIds) => {
  // In a production system, you might use MongoDB transactions or locks
  // For now, we'll use a simple check
  const items = await Inventory.find({
    _id: { $in: inventoryIds },
    status: { $in: ['available', 'reserved'] },
  });

  if (items.length !== inventoryIds.length) {
    throw new Error('Some inventory items are not available');
  }

  return items;
};

module.exports = {
  getAvailableInventory,
  reserveInventory,
  releaseReservation,
  issueInventory,
  getExpiringInventory,
  markExpiredInventory,
  getInventorySummary,
  lockInventoryForIssuance,
};

