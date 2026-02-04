const College = require('../models/College');
const BloodRequest = require('../models/BloodRequest');
const escalationService = require('../services/escalationService');
const donorMobilizationService = require('../services/donorMobilizationService');

/**
 * Get escalated requests for college
 */
const getEscalatedRequests = async (req, res, next) => {
  try {
    const college = await College.findOne({ userId: req.userId });
    if (!college) {
      return res.status(404).json({ error: 'College profile not found' });
    }

    // Find requests where this college was notified
    const requests = await BloodRequest.find({
      'fulfillmentDetails.collegeEscalation.collegesNotified.collegeId': college._id,
      status: { $in: ['pending', 'processing', 'partially_fulfilled'] },
    })
      .populate('hospitalId', 'name address')
      .sort({ urgency: -1, createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

/**
 * Mobilize college donors for a request
 */
const mobilizeDonors = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const college = await College.findOne({ userId: req.userId });
    if (!college) {
      return res.status(404).json({ error: 'College profile not found' });
    }

    const result = await escalationService.mobilizeCollegeDonors(
      college._id,
      requestId
    );

    res.json({
      message: 'College donors mobilized',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEscalatedRequests,
  mobilizeDonors,
};

