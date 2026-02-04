const BloodRequest = require('../models/BloodRequest');
const Appointment = require('../models/Appointment');
const donorMobilizationService = require('./donorMobilizationService');
const escalationService = require('./escalationService');
const notificationService = require('./notificationService');
const decisionEngine = require('./decisionEngine');

/**
 * Fulfillment Monitoring Service
 * Monitors ongoing blood requests and handles time-based escalations
 */
class FulfillmentMonitoringService {

  constructor() {
    this.monitoringInterval = 2 * 60 * 1000; // Check every 2 minutes
    this.isRunning = false;
    this.intervalId = null;

    // Escalation thresholds (in minutes)
    this.ESCALATION_THRESHOLDS = {
      DONOR_FAILURE_TIMEOUT: 45,      // 45 minutes for donor response
      COLLEGE_ESCALATION_DELAY: 90,   // 90 minutes total for college escalation
      FINAL_TIMEOUT: 180,             // 3 hours maximum
    };
  }

  /**
   * Start the monitoring service
   */
  start() {
    if (this.isRunning) return;

    console.log('Starting Fulfillment Monitoring Service...');
    this.isRunning = true;

    // Run initial check
    this.runMonitoringCycle();

    // Set up periodic monitoring
    this.intervalId = setInterval(() => {
      this.runMonitoringCycle();
    }, this.monitoringInterval);
  }

  /**
   * Stop the monitoring service
   */
  stop() {
    if (!this.isRunning) return;

    console.log('Stopping Fulfillment Monitoring Service...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Run a complete monitoring cycle
   */
  async runMonitoringCycle() {
    try {
      console.log('Running fulfillment monitoring cycle...');

      const activeRequests = await this.getActiveRequests();
      console.log(`Found ${activeRequests.length} active requests to monitor`);

      for (const request of activeRequests) {
        await this.monitorRequest(request);
      }

      console.log('Fulfillment monitoring cycle completed');

    } catch (error) {
      console.error('Error in fulfillment monitoring cycle:', error);
    }
  }

  /**
   * Get all active requests that need monitoring
   */
  async getActiveRequests() {
    return await BloodRequest.find({
      status: { $in: ['processing', 'partially_fulfilled'] },
      deadline: { $gt: new Date() }, // Not expired
      createdAt: { $gt: new Date(Date.now() - (4 * 60 * 60 * 1000)) } // Created within last 4 hours
    }).populate('hospitalId', 'name coordinates');
  }

  /**
   * Monitor a specific request and handle escalations
   */
  async monitorRequest(bloodRequest) {
    try {
      const timeSinceCreation = Date.now() - new Date(bloodRequest.createdAt).getTime();
      const timeSinceLastUpdate = Date.now() - new Date(bloodRequest.updatedAt).getTime();

      // Check if request has been fulfilled since last check
      const issued = bloodRequest.issuedUnits || 0;
      if (issued >= bloodRequest.units) {
        await this.markAsFulfilled(bloodRequest);
        return;
      }

      // Check for donor failure escalation
      if (bloodRequest.fulfillmentDetails.donorMobilization?.initiated &&
          !bloodRequest.fulfillmentDetails.donorMobilization?.completed) {

        const donorFailureResult = await this.checkDonorFailure(bloodRequest, timeSinceCreation);
        if (donorFailureResult.shouldEscalate) {
          console.log(`Donor failure detected for request ${bloodRequest._id}, escalating to colleges`);
          await this.escalateToColleges(bloodRequest);
          return;
        }
      }

      // Check for college escalation timeout
      if (bloodRequest.fulfillmentDetails.collegeEscalation?.initiated &&
          timeSinceCreation > (this.ESCALATION_THRESHOLDS.FINAL_TIMEOUT * 60 * 1000)) {

        await this.handleFinalTimeout(bloodRequest);
        return;
      }

      // Check for overall timeout
      if (timeSinceCreation > (this.ESCALATION_THRESHOLDS.FINAL_TIMEOUT * 60 * 1000)) {
        await this.handleFinalTimeout(bloodRequest);
        return;
      }

      // Check for expired requests
      if (new Date(bloodRequest.deadline) < new Date()) {
        await this.handleExpiredRequest(bloodRequest);
        return;
      }

    } catch (error) {
      console.error(`Error monitoring request ${bloodRequest._id}:`, error);
    }
  }

  /**
   * Check for donor failure and determine if escalation is needed
   */
  async checkDonorFailure(bloodRequest, timeSinceCreation) {
    const timeSinceMobilization = bloodRequest.fulfillmentDetails.donorMobilization?.initiatedAt
      ? Date.now() - new Date(bloodRequest.fulfillmentDetails.donorMobilization.initiatedAt).getTime()
      : timeSinceCreation;

    // If donor mobilization was initiated more than DONOR_FAILURE_TIMEOUT minutes ago
    if (timeSinceMobilization > (this.ESCALATION_THRESHOLDS.DONOR_FAILURE_TIMEOUT * 60 * 1000)) {

      // Check if any donors accepted but failed to deliver
      const acceptedAppointments = await Appointment.find({
        requestId: bloodRequest._id,
        status: { $in: ['confirmed', 'scheduled'] },
        scheduledDate: { $lt: new Date() } // Past appointment time
      });

      // Check if any confirmed donors didn't show up
      const noShowAppointments = acceptedAppointments.filter(appointment => {
        const timeSinceAppointment = Date.now() - new Date(appointment.scheduledDate).getTime();
        return timeSinceAppointment > (60 * 60 * 1000); // 1 hour past appointment
      });

      if (noShowAppointments.length > 0) {
        // Mark failed donors
        bloodRequest.fulfillmentDetails.donorMobilization.failedDonors =
          (bloodRequest.fulfillmentDetails.donorMobilization.failedDonors || 0) + noShowAppointments.length;

        await bloodRequest.save();

        // Notify hospital about donor failures
        await notificationService.createNotification({
          recipientId: bloodRequest.hospitalId.userId,
          recipientModel: 'User',
          recipientRole: 'Hospital',
          type: 'donor_failure_alert',
          title: 'Donor Failure Alert',
          message: `${noShowAppointments.length} confirmed donor(s) failed to appear. Escalating to college partners.`,
          relatedEntityId: bloodRequest._id,
          relatedEntityType: 'BloodRequest',
          priority: 'urgent',
        });

        return { shouldEscalate: true, reason: 'donor_failure' };
      }
    }

    return { shouldEscalate: false };
  }

  /**
   * Escalate to college partners
   */
  async escalateToColleges(bloodRequest) {
    try {
      if (bloodRequest.fulfillmentDetails.collegeEscalation?.initiated) {
        return; // Already escalated
      }

      const escalationResult = await escalationService.escalateToColleges(bloodRequest, 8);

      bloodRequest.fulfillmentDetails.collegeEscalation.initiated = true;
      bloodRequest.fulfillmentDetails.collegeEscalation.escalationReason = 'donor_failure';
      bloodRequest.fulfillmentDetails.collegeEscalation.escalatedAt = new Date();

      await bloodRequest.save();

      console.log(`Escalated request ${bloodRequest._id} to ${escalationResult.collegesNotified} colleges due to donor failure`);

    } catch (error) {
      console.error(`Failed to escalate request ${bloodRequest._id} to colleges:`, error);
    }
  }

  /**
   * Handle final timeout - mark as unfulfilled
   */
  async handleFinalTimeout(bloodRequest) {
    if (bloodRequest.status === 'unfulfilled') return;

    bloodRequest.status = 'unfulfilled';
    bloodRequest.fulfillmentDetails.finalOutcome = 'timeout';
    bloodRequest.fulfillmentDetails.completedAt = new Date();

    // Release any reserved inventory
    const inventoryService = require('./inventoryService');
    await inventoryService.releaseReservation(bloodRequest._id);

    // Cancel any pending appointments
    await donorMobilizationService.stopMobilization(bloodRequest._id);

    await bloodRequest.save();

    // Notify hospital
    await notificationService.createNotification({
      recipientId: bloodRequest.hospitalId.userId,
      recipientModel: 'User',
      recipientRole: 'Hospital',
      type: 'request_timeout',
      title: 'Blood Request Timeout',
      message: `Blood request for ${bloodRequest.units} units of ${bloodRequest.bloodGroup} could not be fulfilled within the time limit.`,
      relatedEntityId: bloodRequest._id,
      relatedEntityType: 'BloodRequest',
      priority: 'medium',
    });

    console.log(`Request ${bloodRequest._id} marked as unfulfilled due to timeout`);
  }

  /**
   * Handle expired requests
   */
  async handleExpiredRequest(bloodRequest) {
    if (bloodRequest.status === 'expired') return;

    bloodRequest.status = 'expired';

    // Release any reserved inventory
    const inventoryService = require('./inventoryService');
    await inventoryService.releaseReservation(bloodRequest._id);

    // Cancel any pending appointments
    await donorMobilizationService.stopMobilization(bloodRequest._id);

    await bloodRequest.save();

    // Notify hospital
    await notificationService.createNotification({
      recipientId: bloodRequest.hospitalId.userId,
      recipientModel: 'User',
      recipientRole: 'Hospital',
      type: 'request_expired',
      title: 'Blood Request Expired',
      message: `Blood request for ${bloodRequest.units} units of ${bloodRequest.bloodGroup} has expired.`,
      relatedEntityId: bloodRequest._id,
      relatedEntityType: 'BloodRequest',
      priority: 'low',
    });

    console.log(`Request ${bloodRequest._id} marked as expired`);
  }

  /**
   * Mark request as fulfilled
   */
  async markAsFulfilled(bloodRequest) {
    if (bloodRequest.status === 'fulfilled') return;

    bloodRequest.status = 'fulfilled';
    bloodRequest.fulfillmentDetails.finalOutcome = 'fulfilled';
    bloodRequest.fulfilledAt = new Date();

    await bloodRequest.save();

    console.log(`Request ${bloodRequest._id} marked as fulfilled`);
  }

  /**
   * Force check a specific request (for testing/admin purposes)
   */
  async forceCheckRequest(requestId) {
    const bloodRequest = await BloodRequest.findById(requestId).populate('hospitalId', 'name coordinates');

    if (!bloodRequest) {
      throw new Error('Blood request not found');
    }

    await this.monitorRequest(bloodRequest);
    return { checked: true, status: bloodRequest.status };
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats() {
    const stats = await BloodRequest.aggregate([
      {
        $match: {
          status: { $in: ['processing', 'partially_fulfilled'] },
          createdAt: { $gt: new Date(Date.now() - (24 * 60 * 60 * 1000)) } // Last 24 hours
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            hasDonorMobilization: { $gt: ['$fulfillmentDetails.donorMobilization.initiated', false] },
            hasCollegeEscalation: { $gt: ['$fulfillmentDetails.collegeEscalation.initiated', false] }
          },
          count: { $sum: 1 },
          avgTimeSinceCreation: {
            $avg: { $subtract: [new Date(), '$createdAt'] }
          }
        }
      }
    ]);

    return {
      activeRequests: await BloodRequest.countDocuments({
        status: { $in: ['processing', 'partially_fulfilled'] }
      }),
      monitoringStatus: this.isRunning ? 'active' : 'inactive',
      monitoringInterval: this.monitoringInterval,
      escalationThresholds: this.ESCALATION_THRESHOLDS,
      breakdownByStatus: stats
    };
  }
}

module.exports = new FulfillmentMonitoringService();

