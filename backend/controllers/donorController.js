const Donor = require('../models/Donor');
const Appointment = require('../models/Appointment');
const BloodRequest = require('../models/BloodRequest');
const Notification = require('../models/Notification');
const Donation = require('../models/Donation');
const { canDonateAfterCooldown, sendSuccess, sendError } = require('../utils/helpers');

/**
 * Get donor profile
 */
const getProfile = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.userId })
      .populate('userId', 'email');

    if (!donor) {
      return sendError(res, 404, 'Donor profile not found');
    }

    return sendSuccess(res, 200, 'Donor profile retrieved successfully', { donor });
  } catch (error) {
    next(error);
  }
};

/**
 * Update donor profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.userId });
    if (!donor) {
      return sendError(res, 404, 'Donor profile not found');
    }

    Object.assign(donor, req.body);
    await donor.save();

    return sendSuccess(res, 200, 'Profile updated successfully', { donor });
  } catch (error) {
    next(error);
  }
};

/**
 * Get donor appointments
 */
const getAppointments = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.userId });
    if (!donor) {
      return sendError(res, 404, 'Donor profile not found');
    }

    const { status, limit = 50, skip = 0 } = req.query;

    const query = { donorId: donor._id };
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('bloodBankId', 'name address coordinates')
      .populate('requestId', 'bloodGroup units urgency')
      .sort({ scheduledDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Appointment.countDocuments(query);

    return sendSuccess(res, 200, 'Appointments retrieved successfully', {
      appointments,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm appointment
 */
const confirmAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donor = await Donor.findOne({ userId: req.userId });
    if (!donor) {
      return sendError(res, 404, 'Donor profile not found');
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return sendError(res, 404, 'Appointment not found');
    }

    if (appointment.donorId.toString() !== donor._id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    appointment.status = 'confirmed';
    await appointment.save();

    return sendSuccess(res, 200, 'Appointment confirmed', { appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * Check donation eligibility
 */
const checkEligibility = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.userId });
    if (!donor) {
      return sendError(res, 404, 'Donor profile not found');
    }

    const canDonate = canDonateAfterCooldown(
      donor.lastDonationDate,
      donor.cooldownDays
    );

    const eligibility = {
      eligible: donor.eligibilityStatus === 'eligible' && canDonate && donor.availability === 'available',
      reasons: [],
    };

    if (donor.eligibilityStatus !== 'eligible') {
      eligibility.reasons.push(`Eligibility status: ${donor.eligibilityStatus}`);
    }

    if (!canDonate && donor.lastDonationDate) {
      const cooldownEnd = new Date(donor.lastDonationDate);
      cooldownEnd.setDate(cooldownEnd.getDate() + donor.cooldownDays);
      eligibility.reasons.push(`Cooldown period ends: ${cooldownEnd.toLocaleDateString()}`);
    }

    if (donor.availability !== 'available') {
      eligibility.reasons.push(`Availability: ${donor.availability}`);
    }

    return sendSuccess(res, 200, 'Eligibility checked successfully', {
      donor: {
        bloodGroup: donor.bloodGroup,
        eligibilityStatus: donor.eligibilityStatus,
        lastDonationDate: donor.lastDonationDate,
        cooldownDays: donor.cooldownDays,
        availability: donor.availability,
      },
      eligibility,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get donation requests for donor
 */
const getDonationRequests = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.userId });
    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    const { status, limit = 20, skip = 0 } = req.query;

    // Find blood requests that match donor's blood group and are in mobilization phase
    const query = {
      bloodGroup: donor.bloodGroup,
      status: { $in: ['processing', 'mobilizing'] },
      'donorResponses.donorId': { $ne: donor._id }, // Don't show requests already responded to
    };

    if (status) query.status = status;

    const requests = await BloodRequest.find(query)
      .populate('hospitalId', 'name address city')
      // bloodBankId removed - not in BloodRequest schema
      .sort({ urgency: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await BloodRequest.countDocuments(query);

    return sendSuccess(res, 200, 'Donation requests retrieved successfully', {
      requests,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Respond to donation request
 */
const respondToRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { response, reason } = req.body;

    const donor = await Donor.findOne({ userId: req.userId });
    if (!donor) {
      return sendError(res, 404, 'Donor profile not found');
    }

    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return sendError(res, 404, 'Blood request not found');
    }

    // Check if donor already responded
    const existingResponse = bloodRequest.donorResponses.find(
      r => r.donorId.toString() === donor._id.toString()
    );

    if (existingResponse) {
      return sendError(res, 400, 'Already responded to this request');
    }

    // Add donor response
    bloodRequest.donorResponses.push({
      donorId: donor._id,
      response,
      reason,
      respondedAt: new Date(),
    });

    await bloodRequest.save();

    // Create notification for the donor about their response
    await Notification.create({
      recipientId: req.userId,
      recipientModel: 'User',
      recipientRole: 'Donor',
      type: 'donation_response',
      title: response === 'accept' ? 'Donation Request Accepted' : 'Donation Request Declined',
      message: `You have ${response === 'accept' ? 'accepted' : 'declined'} the donation request for ${bloodRequest.bloodGroup} blood.`,
      relatedEntityId: bloodRequest._id,
      relatedEntityType: 'BloodRequest',
      priority: 'medium',
    });

    return sendSuccess(res, 200, `Request ${response === 'accept' ? 'accepted' : 'declined'} successfully`, {
      response: {
        donorId: donor._id,
        response,
        reason,
        respondedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get donor notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const { limit = 50, skip = 0, read } = req.query;

    const query = {
      recipientId: req.userId,
      recipientModel: 'User',
      recipientRole: 'Donor',
    };

    if (read !== undefined) {
      query.read = read === 'true';
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Notification.countDocuments(query);

    return sendSuccess(res, 200, 'Notifications retrieved successfully', {
      notifications,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
const markNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return sendError(res, 404, 'Notification not found');
    }

    if (notification.recipientId.toString() !== req.userId) {
      return sendError(res, 403, 'Access denied');
    }

    notification.read = true;
    await notification.save();

    return sendSuccess(res, 200, 'Notification marked as read', { notification });
  } catch (error) {
    next(error);
  }
};

/**
 * Get donation history
 */
const getDonationHistory = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.userId });
    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    const { limit = 20, skip = 0 } = req.query;

    const donations = await Donation.find({ donorId: donor._id })
      .populate('bloodBankId', 'name')
      .sort({ donationDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Donation.countDocuments({ donorId: donor._id });

    return sendSuccess(res, 200, 'Donation history retrieved successfully', {
      donations,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update donor availability
 */
const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;

    const donor = await Donor.findOne({ userId: req.userId });
    if (!donor) {
      return sendError(res, 404, 'Donor profile not found');
    }

    donor.availability = availability;
    await donor.save();

    return sendSuccess(res, 200, 'Availability updated successfully', {
      donor: {
        availability: donor.availability,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAppointments,
  confirmAppointment,
  checkEligibility,
  getDonationRequests,
  respondToRequest,
  getNotifications,
  markNotificationRead,
  getDonationHistory,
  updateAvailability,
};

