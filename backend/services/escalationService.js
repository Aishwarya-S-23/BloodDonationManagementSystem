const College = require('../models/College');
const BloodRequest = require('../models/BloodRequest');
const Hospital = require('../models/Hospital');
const { isRareBloodGroup } = require('../utils/helpers');
const { sortByDistance } = require('../utils/geolocation');
const notificationService = require('./notificationService');
const donorMobilizationService = require('./donorMobilizationService');

/**
 * Check if request should be escalated to colleges
 */
const shouldEscalate = (bloodRequest) => {
  const issued = bloodRequest.issuedUnits || 0;
  const reserved = bloodRequest.reservedUnits || 0;
  const remaining = Math.max(0, bloodRequest.units - (issued + reserved));

  if (remaining <= 0) return false; // nothing to escalate

  const banksAttempted = (bloodRequest.fulfillmentDetails?.assignedBloodBanks || []).length > 0;
  const donorsAttempted = bloodRequest.fulfillmentDetails?.donorMobilization?.initiated;

  // Escalate only as last resort: deficit remains AND we already tried banks or donors
  const lastResortTriggered = banksAttempted || donorsAttempted;

  return lastResortTriggered && (
    isRareBloodGroup(bloodRequest.bloodGroup) ||
    bloodRequest.urgency === 'critical' ||
    bloodRequest.urgency === 'high'
  );
};

/**
 * Escalate request to nearby colleges
 */
const escalateToColleges = async (bloodRequest, maxColleges = 5) => {
  if (!shouldEscalate(bloodRequest)) {
    return { escalated: false, reason: 'Request does not meet escalation criteria' };
  }

  // Get hospital location
  const hospital = await Hospital.findById(bloodRequest.hospitalId);
  if (!hospital || !hospital.coordinates) {
    throw new Error('Hospital location not found');
  }

  // Find nearby colleges
  const colleges = await College.find({
    isActive: true,
    coordinates: { $exists: true },
  });

  const sortedColleges = sortByDistance(
    colleges,
    hospital.coordinates.latitude,
    hospital.coordinates.longitude
  ).slice(0, maxColleges);

  if (sortedColleges.length === 0) {
    return { escalated: false, reason: 'No active colleges found nearby' };
  }

  // Notify college coordinators
  const notifications = [];
  for (const college of sortedColleges) {
    const notification = await notificationService.createNotification({
      recipientId: college.userId,
      recipientModel: 'User',
      recipientRole: 'College',
      type: 'escalation',
      title: `Urgent Blood Request - ${bloodRequest.bloodGroup}`,
      message: `Critical blood request: ${bloodRequest.units} units of ${bloodRequest.bloodGroup} ${bloodRequest.component} needed by ${bloodRequest.deadline.toLocaleString()}. Please mobilize college donors.`,
      relatedEntityId: bloodRequest._id,
      relatedEntityType: 'BloodRequest',
      priority: 'urgent',
      actionUrl: `/colleges/requests/${bloodRequest._id}`,
    });
    notifications.push(notification);
  }

  // Update request
  bloodRequest.fulfillmentDetails.collegeEscalation.initiated = true;
  bloodRequest.fulfillmentDetails.collegeEscalation.collegesNotified = sortedColleges.map((c) => ({
    collegeId: c._id,
    notifiedAt: new Date(),
  }));
  await bloodRequest.save();

  return {
    escalated: true,
    collegesNotified: sortedColleges.length,
    colleges: sortedColleges.map((c) => ({
      id: c._id,
      name: c.name,
      distance: c.distance,
    })),
  };
};

/**
 * Mobilize college donors (called by college coordinator)
 */
const mobilizeCollegeDonors = async (collegeId, requestId) => {
  const bloodRequest = await BloodRequest.findById(requestId);
  if (!bloodRequest) {
    throw new Error('Blood request not found');
  }

  const College = require('../models/College');
  const college = await College.findById(collegeId);
  if (!college) {
    throw new Error('College not found');
  }

  // Find donors associated with this college (you might need to add collegeId to Donor model)
  // For now, we'll use a proximity-based approach
  const Donor = require('../models/Donor');
  const { getCompatibleBloodGroups } = require('../utils/helpers');
  const compatibleGroups = getCompatibleBloodGroups(bloodRequest.bloodGroup);

  const nearbyDonors = await Donor.find({
    bloodGroup: { $in: compatibleGroups },
    eligibilityStatus: 'eligible',
    availability: 'available',
    coordinates: { $exists: true },
  });

  // Filter by distance from college
  const collegeDonors = sortByDistance(
    nearbyDonors,
    college.coordinates.latitude,
    college.coordinates.longitude
  ).filter((d) => d.distance <= 10); // Within 10km of college

  if (collegeDonors.length === 0) {
    return { mobilized: 0, message: 'No eligible donors found near college' };
  }

  // Notify college donors
  const notifications = collegeDonors.map((donor) => ({
    recipientId: donor.userId,
    recipientModel: 'User',
    recipientRole: 'Donor',
    type: 'donor_needed',
    title: `College Blood Drive - ${bloodRequest.bloodGroup}`,
    message: `Your college is organizing a blood donation drive. ${bloodRequest.units} units of ${bloodRequest.bloodGroup} needed urgently.`,
    relatedEntityId: requestId,
    relatedEntityType: 'BloodRequest',
    priority: 'high',
  }));

  await notificationService.sendBulkNotifications(collegeDonors, notifications[0]);

  return {
    mobilized: collegeDonors.length,
    donors: collegeDonors.map((d) => ({
      id: d._id,
      distance: d.distance,
    })),
  };
};

module.exports = {
  shouldEscalate,
  escalateToColleges,
  mobilizeCollegeDonors,
};

