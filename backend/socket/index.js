const notificationService = require('../services/notificationService');

/**
 * Socket.IO setup for real-time communication
 */
module.exports = (io) => {
  console.log('Setting up Socket.IO connections...');

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      // Verify JWT token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.profileId = decoded.profileId;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} (${socket.userRole}) connected via socket ${socket.id}`);

    // Join user-specific room
    socket.join(`user_${socket.userId}`);

    // Join role-specific room
    socket.join(`role_${socket.userRole}`);

    // Join profile-specific room (for hospitals, blood banks, etc.)
    if (socket.profileId) {
      socket.join(`profile_${socket.profileId}`);
    }

    // Handle user status updates
    socket.on('user_online', async (data) => {
      try {
        // Update user online status in database if needed
        socket.broadcast.to(`role_${socket.userRole}`).emit('user_status_changed', {
          userId: socket.userId,
          status: 'online',
          role: socket.userRole
        });
      } catch (error) {
        console.error('User online status update error:', error);
      }
    });

    // Handle blood request updates
    socket.on('subscribe_request', (requestId) => {
      socket.join(`request_${requestId}`);
      console.log(`User ${socket.userId} subscribed to request ${requestId}`);
    });

    socket.on('unsubscribe_request', (requestId) => {
      socket.leave(`request_${requestId}`);
      console.log(`User ${socket.userId} unsubscribed from request ${requestId}`);
    });

    // Handle emergency broadcasts
    socket.on('emergency_broadcast', async (data) => {
      try {
        // Only allow hospitals and admins to broadcast emergencies
        if (!['Hospital', 'Admin'].includes(socket.userRole)) {
          socket.emit('error', { message: 'Unauthorized to broadcast emergencies' });
          return;
        }

        // Broadcast to all users of the same role or all users
        const targetRoom = data.targetRole ? `role_${data.targetRole}` : 'emergency_all';

        io.to(targetRoom).emit('emergency_alert', {
          ...data,
          broadcasterId: socket.userId,
          timestamp: new Date()
        });

        console.log(`Emergency broadcast sent by ${socket.userId} to ${targetRoom}`);
      } catch (error) {
        console.error('Emergency broadcast error:', error);
        socket.emit('error', { message: 'Failed to broadcast emergency' });
      }
    });

    // Handle location updates (for tracking ambulances, etc.)
    socket.on('location_update', async (data) => {
      try {
        const { latitude, longitude, entityType, entityId } = data;

        // Broadcast location update to relevant users
        socket.to(`entity_${entityType}_${entityId}`).emit('location_updated', {
          entityType,
          entityId,
          latitude,
          longitude,
          timestamp: new Date(),
          userId: socket.userId
        });
      } catch (error) {
        console.error('Location update error:', error);
      }
    });

    // Handle typing indicators for chat/messaging
    socket.on('typing_start', (data) => {
      socket.to(data.room).emit('user_typing', {
        userId: socket.userId,
        username: data.username,
        room: data.room
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.room).emit('user_stopped_typing', {
        userId: socket.userId,
        room: data.room
      });
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`User ${socket.userId} (${socket.userRole}) disconnected: ${reason}`);

      // Update user offline status
      socket.broadcast.to(`role_${socket.userRole}`).emit('user_status_changed', {
        userId: socket.userId,
        status: 'offline',
        role: socket.userRole,
        lastSeen: new Date()
      });
    });

    // Handle custom events for blood request fulfillment
    socket.on('request_status_update', async (data) => {
      try {
        const { requestId, status, message } = data;

        // Broadcast status update to all subscribers of this request
        io.to(`request_${requestId}`).emit('request_updated', {
          requestId,
          status,
          message,
          updatedBy: socket.userId,
          timestamp: new Date()
        });

        // Also send notification if it's a significant status change
        if (['fulfilled', 'cancelled', 'expired'].includes(status)) {
          await notificationService.createNotification({
            recipientId: socket.userId,
            recipientModel: 'User',
            recipientRole: socket.userRole,
            type: 'request_status_changed',
            title: `Blood Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: message || `Blood request status changed to ${status}`,
            relatedEntityId: requestId,
            relatedEntityType: 'BloodRequest',
            priority: status === 'fulfilled' ? 'high' : 'medium',
          });
        }
      } catch (error) {
        console.error('Request status update error:', error);
        socket.emit('error', { message: 'Failed to update request status' });
      }
    });

    // Handle real-time chat for coordination
    socket.on('send_message', async (data) => {
      try {
        const { room, message, messageType = 'text' } = data;

        const messageData = {
          id: require('crypto').randomUUID(),
          senderId: socket.userId,
          senderRole: socket.userRole,
          message,
          messageType,
          timestamp: new Date(),
          room
        };

        // Broadcast message to room
        io.to(room).emit('new_message', messageData);

        // Store message in database if needed
        // await messageService.saveMessage(messageData);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Emergency response coordination
    socket.on('respond_to_emergency', async (data) => {
      try {
        const { emergencyId, response, notes } = data;

        // Record the response
        io.to(`emergency_${emergencyId}`).emit('emergency_response', {
          emergencyId,
          responderId: socket.userId,
          responderRole: socket.userRole,
          response, // 'accept', 'decline', 'need_more_info'
          notes,
          timestamp: new Date()
        });

        // If accepted, create appropriate follow-up
        if (response === 'accept') {
          await notificationService.createNotification({
            recipientId: socket.userId,
            recipientModel: 'User',
            recipientRole: socket.userRole,
            type: 'emergency_accepted',
            title: 'Emergency Response Accepted',
            message: `You have accepted to respond to emergency ${emergencyId}`,
            relatedEntityId: emergencyId,
            relatedEntityType: 'Emergency',
            priority: 'urgent',
          });
        }
      } catch (error) {
        console.error('Emergency response error:', error);
        socket.emit('error', { message: 'Failed to submit emergency response' });
      }
    });

    // Blood bank availability broadcasts
    socket.on('blood_bank_availability', async (data) => {
      try {
        const { bloodGroup, component, units, location } = data;

        // Broadcast availability to nearby hospitals
        socket.broadcast.to('role_Hospital').emit('blood_bank_available', {
          bloodBankId: socket.profileId,
          bloodGroup,
          component,
          units,
          location,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Blood bank availability broadcast error:', error);
      }
    });

    // Donor availability updates
    socket.on('donor_availability', async (data) => {
      try {
        const { available, location, bloodGroups } = data;

        // Update donor availability in database
        const Donor = require('../models/Donor');
        await Donor.findOneAndUpdate(
          { userId: socket.userId },
          {
            availability: available ? 'available' : 'unavailable',
            lastAvailabilityUpdate: new Date(),
            coordinates: available ? {
              latitude: location.latitude,
              longitude: location.longitude
            } : undefined
          }
        );

        // Broadcast availability change
        socket.broadcast.to('role_Hospital').emit('donor_availability_changed', {
          donorId: socket.profileId,
          available,
          bloodGroups,
          location: available ? location : null,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Donor availability update error:', error);
      }
    });

  });

  // Global error handling
  io.on('connection_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  console.log('Socket.IO setup complete');
};
