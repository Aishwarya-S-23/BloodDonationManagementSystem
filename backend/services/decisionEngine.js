const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const inventoryService = require('./inventoryService');
const transportationService = require('./transportationService');
const antiWastageService = require('./antiWastageService');
const mapplsService = require('./mapplsService');
const { findNearby, estimateTravelTime } = require('../utils/geolocation');
const donorMobilizationService = require('./donorMobilizationService');
const escalationService = require('./escalationService');

/**
 * Traffic-Aware Decision Engine - Core logic for blood request fulfillment
 * Uses Mappls Distance Matrix ETA API for real-time traffic calculations
 */
const processBloodRequest = async (bloodRequest) => {
  const hospital = await Hospital.findById(bloodRequest.hospitalId);
  if (!hospital) {
    throw new Error('Hospital not found');
  }

  console.log(`Processing blood request ${bloodRequest._id} with traffic-aware decision engine`);

  // Start with dynamic radius expansion
  const fulfillmentResult = await executeDynamicRadiusExpansion(bloodRequest, hospital);

  if (fulfillmentResult.fulfilled) {
    return {
      chosenOption: fulfillmentResult.chosenOption,
      strategy: 'blood_bank_fulfillment',
      radiusUsed: fulfillmentResult.radiusUsed,
      eta: fulfillmentResult.eta
    };
  }

  // If blood banks cannot fulfill, start donor mobilization
  console.log(`Blood banks cannot fulfill request ${bloodRequest._id}, starting donor mobilization`);
  const donorResult = await executeDonorMobilization(bloodRequest, hospital);

  if (donorResult.fulfilled) {
    return {
      chosenOption: donorResult.chosenOption,
      strategy: 'donor_mobilization',
      donorsNotified: donorResult.donorsNotified
    };
  }

  // If donors cannot fulfill, escalate to colleges
  console.log(`Donors cannot fulfill request ${bloodRequest._id}, escalating to colleges`);
  const collegeResult = await executeCollegeEscalation(bloodRequest, hospital);

  return {
    chosenOption: collegeResult.chosenOption || null,
    strategy: 'college_escalation',
    collegesNotified: collegeResult.collegesNotified || 0,
    finalStatus: 'escalated_to_colleges'
  };
};

/**
 * Dynamic Radius Expansion with Traffic-Aware ETA Calculation
 */
const executeDynamicRadiusExpansion = async (bloodRequest, hospital) => {
  const radii = [5, 10, 25, 50]; // km - progressively larger search radii
  const requestLocation = {
    latitude: bloodRequest.location.coordinates[1],
    longitude: bloodRequest.location.coordinates[0]
  };

  for (const radius of radii) {
    console.log(`Searching for blood banks within ${radius}km radius for request ${bloodRequest._id}`);

    try {
      // Use Mappls Nearby API to find blood banks
      const nearbyResult = await mapplsService.findNearby(
        requestLocation.latitude,
        requestLocation.longitude,
        'blood bank',
        radius * 1000 // Convert to meters
      );

      if (!nearbyResult.success || nearbyResult.results.length === 0) {
        console.log(`No blood banks found within ${radius}km radius`);
        continue;
      }

      // Filter and validate blood banks
      const validBloodBanks = await validateBloodBanks(nearbyResult.results, bloodRequest);

      if (validBloodBanks.length === 0) {
        console.log(`No valid blood banks with required blood type within ${radius}km radius`);
        continue;
      }

      // Calculate traffic-aware ETA for all valid blood banks
      const etaResult = await calculateTrafficETA(requestLocation, validBloodBanks);

      if (!etaResult.success) {
        console.log(`ETA calculation failed for ${radius}km radius`);
        continue;
      }

      // Select best blood bank based on ETA and availability
      const bestOption = await selectBestBloodBank(etaResult.matrix, validBloodBanks, bloodRequest);

      if (bestOption && bestOption.canFulfill) {
        console.log(`Found suitable blood bank within ${radius}km: ${bestOption.name}, ETA: ${bestOption.eta} minutes`);

        // Execute the fulfillment
        await executeBloodBankFulfillment(bestOption, bloodRequest);

        return {
          fulfilled: true,
          chosenOption: bestOption,
          radiusUsed: radius,
          eta: bestOption.eta
        };
      }

    } catch (error) {
      console.error(`Error in radius ${radius}km search:`, error);
      continue;
    }
  }

  return { fulfilled: false, reason: 'no_suitable_blood_banks_found' };
};

/**
 * Validate blood banks have required blood type and are operational
 */
const validateBloodBanks = async (nearbyResults, bloodRequest) => {
  const validBanks = [];

  for (const result of nearbyResults) {
    try {
      // Find corresponding blood bank in our database
      const bloodBank = await BloodBank.findOne({
        $or: [
          { 'location.coordinates': { $nearSphere: { $geometry: { type: 'Point', coordinates: [result.longitude, result.latitude] }, $maxDistance: 100 } } },
          { name: { $regex: result.name, $options: 'i' } }
        ],
        status: 'active',
        testingCapability: true
      });

      if (!bloodBank) continue;

      // Check inventory availability
      const available = await inventoryService.getAvailableInventory(
        bloodBank._id,
        bloodRequest.bloodGroup,
        bloodRequest.component
      );

      const totalAvailable = available.reduce((sum, item) => sum + item.units, 0);

      if (totalAvailable > 0) {
        validBanks.push({
          ...result,
          databaseId: bloodBank._id,
          availableUnits: totalAvailable,
          inventory: available
        });
      }

    } catch (error) {
      console.error(`Error validating blood bank ${result.name}:`, error);
    }
  }

  return validBanks;
};

/**
 * Calculate traffic-aware ETA using Mappls Distance Matrix API
 */
const calculateTrafficETA = async (origin, destinations) => {
  const origins = [origin];
  const destinationCoords = destinations.map(dest => ({
    latitude: dest.latitude,
    longitude: dest.longitude
  }));

  return await mapplsService.getDistanceMatrix(origins, destinationCoords, false, 'driving', true);
};

/**
 * Select best blood bank based on ETA and availability
 */
const selectBestBloodBank = async (etaMatrix, bloodBanks, bloodRequest) => {
  if (!etaMatrix.success || !etaMatrix.matrix || etaMatrix.matrix.length === 0) {
    return null;
  }

  const originResults = etaMatrix.matrix[0];
  const destinationResults = originResults.destinations;

  // Create options with ETA and availability
  const options = [];

  for (let i = 0; i < destinationResults.length; i++) {
    const eta = destinationResults[i];
    const bloodBank = bloodBanks[i];

    if (eta.status === 'OK' && eta.duration && bloodBank) {
      const etaMinutes = Math.ceil(eta.duration / 60); // Convert seconds to minutes

      // Calculate feasibility based on urgency and ETA
      const urgencyThresholds = {
        critical: 30, // 30 minutes
        high: 60,     // 1 hour
        medium: 120,  // 2 hours
        low: 240      // 4 hours
      };

      const maxAcceptableETA = urgencyThresholds[bloodRequest.urgency] || 120;
      const isFeasible = etaMinutes <= maxAcceptableETA;

      options.push({
        id: bloodBank.databaseId,
        name: bloodBank.name,
        address: bloodBank.address,
        coordinates: { latitude: bloodBank.latitude, longitude: bloodBank.longitude },
        eta: etaMinutes,
        distance: eta.distance / 1000, // Convert to km
        availableUnits: bloodBank.availableUnits,
        canFulfill: bloodBank.availableUnits >= bloodRequest.units && isFeasible,
        feasible: isFeasible,
        inventory: bloodBank.inventory
      });
    }
  }

  // Sort by ETA (fastest first), then by availability
  options.sort((a, b) => {
    if (a.feasible !== b.feasible) return b.feasible - a.feasible; // Feasible first
    if (a.eta !== b.eta) return a.eta - b.eta; // Faster ETA first
    return b.availableUnits - a.availableUnits; // More units first
  });

  return options.length > 0 ? options[0] : null;
};

/**
 * Execute blood bank fulfillment
 */
const executeBloodBankFulfillment = async (bestOption, bloodRequest) => {
  try {
    // Reserve inventory
    const { reserved } = await inventoryService.reserveInventory(
      bestOption.id,
      bloodRequest.bloodGroup,
      bloodRequest.component,
      bloodRequest.units,
      bloodRequest._id
    );

    // Create transportation
    const inventoryItems = reserved.map(item => ({
      inventoryId: item._id,
      units: Math.min(item.units, bloodRequest.units),
    }));

    const transportation = await transportationService.createTransportation(
      bloodRequest._id,
      bestOption.id,
      bloodRequest.hospitalId,
      inventoryItems,
      new Date(Date.now() + (bestOption.eta * 60 * 1000)) // ETA from now
    );

    // Update request
    bloodRequest.status = 'processing';
    bloodRequest.fulfillmentDetails.fulfillmentMethod = 'external_blood_bank';
    bloodRequest.fulfillmentDetails.assignedBloodBanks.push({
      bloodBankId: bestOption.id,
      units: bloodRequest.units,
      transportationId: transportation._id,
      status: 'assigned',
      assignedAt: new Date(),
      eta: bestOption.eta,
      distance: bestOption.distance
    });

    bloodRequest.reservedUnits = bloodRequest.units;
    await bloodRequest.save();

    // Notify blood bank
    const notificationService = require('./notificationService');
    await notificationService.createNotification({
      recipientId: (await BloodBank.findById(bestOption.id)).userId,
      recipientModel: 'User',
      recipientRole: 'BloodBank',
      type: 'blood_request_assigned',
      title: `Blood Request Assigned - ${bloodRequest.bloodGroup}`,
      message: `${bloodRequest.units} units of ${bloodRequest.bloodGroup} ${bloodRequest.component} needed. ETA: ${bestOption.eta} minutes. Transportation scheduled.`,
      relatedEntityId: bloodRequest._id,
      relatedEntityType: 'BloodRequest',
      priority: bloodRequest.urgency === 'critical' ? 'urgent' : 'high',
    });

    console.log(`Blood bank ${bestOption.name} assigned to request ${bloodRequest._id}`);

  } catch (error) {
    console.error('Error executing blood bank fulfillment:', error);
    throw error;
  }
};

/**
 * Execute donor mobilization with traffic awareness
 */
const executeDonorMobilization = async (bloodRequest, hospital) => {
  try {
    // Find eligible donors within reasonable distance
    const eligibleDonors = await donorMobilizationService.findEligibleDonors(bloodRequest, 100);

    if (eligibleDonors.length === 0) {
      return { fulfilled: false, reason: 'no_eligible_donors' };
    }

    // Calculate ETA to donors
    const requestLocation = {
      latitude: bloodRequest.location.coordinates[1],
      longitude: bloodRequest.location.coordinates[0]
    };

    const donorCoords = eligibleDonors.slice(0, 20).map(donor => ({
      latitude: donor.coordinates.latitude,
      longitude: donor.coordinates.longitude
    }));

    const etaResult = await mapplsService.getDistanceMatrix([requestLocation], donorCoords);

    // Filter donors by acceptable ETA
    const acceptableDonors = [];
    if (etaResult.success && etaResult.matrix && etaResult.matrix[0]) {
      const destinations = etaResult.matrix[0].destinations;
      for (let i = 0; i < Math.min(destinations.length, eligibleDonors.length); i++) {
        const eta = destinations[i];
        const donor = eligibleDonors[i];

        if (eta.status === 'OK') {
          const etaMinutes = Math.ceil(eta.duration / 60);
          const maxAcceptableETA = bloodRequest.urgency === 'critical' ? 45 : 90;

          if (etaMinutes <= maxAcceptableETA) {
            acceptableDonors.push({
              ...donor,
              eta: etaMinutes,
              distance: eta.distance / 1000
            });
          }
        }
      }
    }

    if (acceptableDonors.length === 0) {
      return { fulfilled: false, reason: 'no_donors_within_acceptable_eta' };
    }

    // Mobilize donors
    const mobilizationResult = await donorMobilizationService.mobilizeDonors(
      bloodRequest,
      Math.min(acceptableDonors.length, 30)
    );

    // Update request status
    bloodRequest.fulfillmentDetails.donorMobilization.initiated = true;
    bloodRequest.fulfillmentDetails.donorMobilization.donorsNotified = mobilizationResult.notified;
    await bloodRequest.save();

    return {
      fulfilled: false, // Donor mobilization is async - fulfillment happens later
      donorsNotified: mobilizationResult.notified,
      chosenOption: {
        type: 'donor_mobilization',
        donorsNotified: mobilizationResult.notified,
        strategy: 'waiting_for_donor_response'
      }
    };

  } catch (error) {
    console.error('Error in donor mobilization:', error);
    return { fulfilled: false, reason: 'donor_mobilization_error' };
  }
};

/**
 * Execute college escalation as final contingency
 */
const executeCollegeEscalation = async (bloodRequest, hospital) => {
  try {
    const escalationResult = await escalationService.escalateToColleges(bloodRequest, 10);

    return {
      fulfilled: false,
      collegesNotified: escalationResult.collegesNotified || 0,
      chosenOption: {
        type: 'college_escalation',
        collegesNotified: escalationResult.collegesNotified || 0,
        strategy: 'final_contingency_activated'
      }
    };

  } catch (error) {
    console.error('Error in college escalation:', error);
    return { fulfilled: false, reason: 'college_escalation_error' };
  }
};

/**
 * Evaluate in-house blood bank option
 */
const evaluateInHouseOption = async (bloodBankId, bloodRequest, hospital) => {
  const available = await inventoryService.getAvailableInventory(
    bloodBankId,
    bloodRequest.bloodGroup,
    bloodRequest.component
  );

  const totalAvailable = available.reduce((sum, item) => sum + item.units, 0);

  if (totalAvailable === 0) {
    return null;
  }

  const canFulfill = totalAvailable >= bloodRequest.units;
  const unitsToFulfill = Math.min(totalAvailable, bloodRequest.units);

  // Time estimate: immediate (0 minutes) for in-house
  return {
    type: 'in_house',
    bloodBankId,
    estimatedTimeMinutes: 0,
    canFulfill,
    unitsAvailable: totalAvailable,
    unitsToFulfill,
    priority: 1, // Highest priority
  };
};

/**
 * Evaluate external blood banks - Enhanced to support multiple assignments
 */
const evaluateExternalBloodBanks = async (bloodRequest, hospital) => {
  const options = [];

  // Find nearby blood banks
  const nearbyBanks = await findNearby(
    BloodBank,
    hospital.coordinates.latitude,
    hospital.coordinates.longitude,
    100, // 100km radius
    { status: 'active', testingCapability: true }
  );

  // Sort by distance for optimal assignment
  nearbyBanks.sort((a, b) => a.distance - b.distance);

  let remainingUnits = bloodRequest.units;
  let assignedUnits = 0;

  for (const bank of nearbyBanks.slice(0, 10)) { // Check top 10 nearest
    if (remainingUnits <= 0) break; // Request fully fulfilled

    const available = await inventoryService.getAvailableInventory(
      bank._id,
      bloodRequest.bloodGroup,
      bloodRequest.component
    );

    const totalAvailable = available.reduce((sum, item) => sum + item.units, 0);
    if (totalAvailable === 0) continue;

    const unitsToFulfill = Math.min(totalAvailable, remainingUnits);
    const canFulfillCompletely = totalAvailable >= remainingUnits;

    // Time estimate: travel time + processing (30 min)
    const travelTime = estimateTravelTime(bank.distance, 'driving');
    const processingTime = 30; // Standard processing time
    const estimatedTime = travelTime + processingTime;

    options.push({
      type: 'external_blood_bank',
      bloodBankId: bank._id,
      bloodBankName: bank.name,
      distance: bank.distance,
      estimatedTimeMinutes: estimatedTime,
      canFulfill: canFulfillCompletely,
      unitsAvailable: totalAvailable,
      unitsToFulfill,
      unitsAssigned: unitsToFulfill,
      priority: 2,
    });

    remainingUnits -= unitsToFulfill;
    assignedUnits += unitsToFulfill;
  }

  // If we have partial fulfillment, create a combined option
  if (assignedUnits > 0 && assignedUnits < bloodRequest.units) {
    options.unshift({
      type: 'multiple_blood_banks',
      bloodBanks: options.slice(0, 3), // Use top 3 banks for combined option
      totalAssignedUnits: assignedUnits,
      estimatedTimeMinutes: Math.max(...options.slice(0, 3).map(opt => opt.estimatedTimeMinutes)),
      canFulfill: false,
      priority: 2,
    });
  }

  return options;
};

/**
 * Evaluate donor mobilization option
 */
const evaluateDonorMobilization = async (bloodRequest, hospital) => {
  const eligibleDonors = await donorMobilizationService.findEligibleDonors(
    bloodRequest,
    30
  );

  if (eligibleDonors.length === 0) {
    return null;
  }

  // Estimate time: notification (5 min) + donor response (30 min) + travel (avg) + donation (30 min) + testing (2-4 hours)
  const avgDistance = eligibleDonors.reduce((sum, d) => sum + d.distance, 0) / eligibleDonors.length;
  const avgTravelTime = estimateTravelTime(avgDistance, 'driving');
  const testingTime = 180; // 3 hours for testing
  const estimatedTime = 5 + 30 + avgTravelTime + 30 + testingTime;

  return {
    type: 'donor_mobilization',
    estimatedTimeMinutes: estimatedTime,
    canFulfill: eligibleDonors.length >= bloodRequest.units,
    availableDonors: eligibleDonors.length,
    unitsToFulfill: Math.min(eligibleDonors.length, bloodRequest.units),
    priority: 3, // Lower priority (takes longer)
  };
};

/**
 * Immediately assign blood banks upon request creation for quick response
 */
const immediateBloodBankAssignment = async (bloodRequest) => {
  const hospital = await Hospital.findById(bloodRequest.hospitalId);
  if (!hospital) {
    throw new Error('Hospital not found');
  }

  // Skip if in-house blood bank can fulfill
  if (hospital.hasInHouseBloodBank && hospital.bloodBankId) {
    const inHouseAvailable = await inventoryService.getAvailableInventory(
      hospital.bloodBankId,
      bloodRequest.bloodGroup,
      bloodRequest.component
    );
    const inHouseTotal = inHouseAvailable.reduce((sum, item) => sum + item.units, 0);
    if (inHouseTotal >= bloodRequest.units) {
      return; // Let in-house option handle it
    }
  }

  // Find nearby blood banks
  const nearbyBanks = await findNearby(
    BloodBank,
    hospital.coordinates.latitude,
    hospital.coordinates.longitude,
    50, // 50km radius for immediate assignment
    { status: 'active', testingCapability: true }
  );

  let assignedUnits = 0;
  const assignments = [];

  // Assign blood banks until request is fulfilled
  for (const bank of nearbyBanks.slice(0, 5)) { // Top 5 nearest
    if (assignedUnits >= bloodRequest.units) break;

    try {
      const available = await inventoryService.getAvailableInventory(
        bank._id,
        bloodRequest.bloodGroup,
        bloodRequest.component
      );

      const totalAvailable = available.reduce((sum, item) => sum + item.units, 0);
      if (totalAvailable === 0) continue;

      const unitsToAssign = Math.min(totalAvailable, bloodRequest.units - assignedUnits);

      // Reserve inventory immediately
      const { reserved } = await inventoryService.reserveInventory(
        bank._id,
        bloodRequest.bloodGroup,
        bloodRequest.component,
        unitsToAssign,
        bloodRequest._id
      );

      // Create transportation immediately
      const inventoryItems = reserved.map(item => ({
        inventoryId: item._id,
        units: Math.min(item.units, unitsToAssign),
      }));

      const transportation = await transportationService.createTransportation(
        bloodRequest._id,
        bank._id,
        bloodRequest.hospitalId,
        inventoryItems,
        new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
      );

      assignments.push({
        bloodBankId: bank._id,
        bloodBankName: bank.name,
        units: unitsToAssign,
        transportationId: transportation._id,
        distance: bank.distance,
        status: 'assigned',
        assignedAt: new Date(),
      });

      assignedUnits += unitsToAssign;

      // Update request status
      bloodRequest.status = 'processing';
      bloodRequest.fulfillmentDetails.fulfillmentMethod = 'external_blood_bank';
      bloodRequest.fulfillmentDetails.assignedBloodBanks.push({
        bloodBankId: bank._id,
        units: unitsToAssign,
        transportationId: transportation._id,
        status: 'assigned',
        assignedAt: new Date(),
      });
      bloodRequest.reservedUnits = (bloodRequest.reservedUnits || 0) + unitsToAssign;

    } catch (error) {
      console.error(`Failed to assign blood bank ${bank._id}:`, error);
      // Continue with next blood bank
    }
  }

  // Update request status if partially or fully fulfilled
  if (assignedUnits > 0) {
    bloodRequest.status = 'processing';
    // Trigger donor mobilization for remaining units
    const remainingUnits = Math.max(0, bloodRequest.units - bloodRequest.reservedUnits - (bloodRequest.issuedUnits || 0));
    if (remainingUnits > 0) {
      await donorMobilizationService.mobilizeDonors(bloodRequest, Math.min(remainingUnits * 2, 20));
    }
  }

  await bloodRequest.save();

  // Notify hospital about assignments
  if (assignments.length > 0) {
    const notificationService = require('./notificationService');
    await notificationService.createNotification({
      recipientId: hospital.userId,
      recipientModel: 'User',
      recipientRole: 'Hospital',
      type: 'blood_request_assigned',
      title: 'Blood Request Assigned',
      message: `${assignedUnits} units assigned from ${assignments.length} blood bank(s). Transportation scheduled.`,
      relatedEntityId: bloodRequest._id,
      relatedEntityType: 'BloodRequest',
      priority: 'high',
    });

  }

  return {
    assignedUnits,
    assignments,
    remainingUnits: Math.max(0, bloodRequest.units - assignedUnits),
  };
};

/**
 * Execute the chosen fulfillment option - Enhanced for multiple blood bank assignments
 */
const executeOption = async (option, bloodRequest) => {
  bloodRequest.status = 'processing';

  if (option.type === 'in_house' || option.type === 'external_blood_bank') {
    // Handle single blood bank assignment
    await assignBloodBank(option, bloodRequest);
  } else if (option.type === 'multiple_blood_banks') {
    // Handle multiple blood bank assignments
    let totalAssigned = 0;
    for (const bankOption of option.bloodBanks) {
      if (totalAssigned >= bloodRequest.units) break;
      const unitsToAssign = Math.min(bankOption.unitsToFulfill, bloodRequest.units - totalAssigned);
      const bankOptionCopy = { ...bankOption, unitsToFulfill: unitsToAssign };
      await assignBloodBank(bankOptionCopy, bloodRequest);
      totalAssigned += unitsToAssign;
    }
  } else if (option.type === 'donor_mobilization') {
    // Mobilize donors
    await donorMobilizationService.mobilizeDonors(bloodRequest, 30);

    // Check if escalation needed
    if (escalationService.shouldEscalate(bloodRequest)) {
      await escalationService.escalateToColleges(bloodRequest, 5);
    }

    bloodRequest.fulfillmentDetails.fulfillmentMethod = 'donor_mobilization';
  }

  await bloodRequest.save();
};

/**
 * Assign a single blood bank and create transportation
 */
const assignBloodBank = async (option, bloodRequest) => {
  try {
    // Reserve inventory
    const { reserved } = await inventoryService.reserveInventory(
      option.bloodBankId,
      bloodRequest.bloodGroup,
      bloodRequest.component,
      option.unitsToFulfill,
      bloodRequest._id
    );

    // Create transportation request for external blood banks
    if (option.type === 'external_blood_bank') {
      try {
        // Prepare inventory items for transportation
        const inventoryItems = reserved.map(item => ({
          inventoryId: item._id,
          units: Math.min(item.units, option.unitsToFulfill),
        }));

        // Create transportation (scheduled for immediate pickup)
        await transportationService.createTransportation(
          bloodRequest._id,
          option.bloodBankId,
          bloodRequest.hospitalId,
          inventoryItems,
          new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
        );
      } catch (transportError) {
        console.error('Transportation creation error:', transportError);
        // Continue with request processing even if transportation fails
      }
    }

    // Update request fulfillment details
    if (!bloodRequest.fulfillmentDetails.fulfillmentMethod) {
      bloodRequest.fulfillmentDetails.fulfillmentMethod = option.type === 'in_house' ? 'in_house' : 'external_blood_bank';
    }

    bloodRequest.fulfillmentDetails.assignedBloodBanks.push({
      bloodBankId: option.bloodBankId,
      units: option.unitsToFulfill,
      status: 'assigned',
      assignedAt: new Date(),
    });

    bloodRequest.reservedUnits = (bloodRequest.reservedUnits || 0) + option.unitsToFulfill;

    // Check if request is now fully fulfilled
    const issued = bloodRequest.issuedUnits || 0;
    const pendingUnits = Math.max(0, bloodRequest.units - issued);

    if (pendingUnits === 0) {
      bloodRequest.status = 'fulfilled';
      await antiWastageService.cancelUnnecessaryAppointments(bloodRequest._id);
    } else {
      const remainingUnits = pendingUnits - (bloodRequest.reservedUnits || 0);
      if (remainingUnits > 0) {
        await donorMobilizationService.mobilizeDonors(bloodRequest, Math.min(remainingUnits * 3, 30));
      }
    }

  } catch (error) {
    console.error('Blood bank assignment error:', error);
    // Fallback to donor mobilization for this portion
    await donorMobilizationService.mobilizeDonors(bloodRequest, option.unitsToFulfill * 3);
  }
};

/**
 * Prevent parallel over-escalation
 */
const isRequestBeingProcessed = async (requestId) => {
  const request = await BloodRequest.findById(requestId);
  return request && request.status !== 'pending' && request.status !== 'cancelled';
};

module.exports = {
  processBloodRequest,
  immediateBloodBankAssignment,
  evaluateInHouseOption,
  evaluateExternalBloodBanks,
  evaluateDonorMobilization,
  executeOption,
  isRequestBeingProcessed,
};

