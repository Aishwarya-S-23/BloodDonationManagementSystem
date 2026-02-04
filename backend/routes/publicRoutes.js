const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public routes - no authentication required

// Get all facilities with optional filters
router.get('/facilities', publicController.getFacilities);

// Get nearby facilities by coordinates
router.get('/facilities/nearby', publicController.getNearbyFacilities);

// Get facility details by ID
router.get('/facilities/:id', publicController.getFacilityDetails);

// Get emergency zones data
router.get('/emergency-zones', publicController.getEmergencyZones);

// Get emergency requests data
router.get('/emergency-requests', publicController.getEmergencyRequests);

module.exports = router;
