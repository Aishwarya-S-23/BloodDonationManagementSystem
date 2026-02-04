const BloodBank = require('../models/BloodBank');
const Hospital = require('../models/Hospital');
const College = require('../models/College');
const { calculateDistance } = require('../utils/geolocation');

/**
 * Find nearby entities using manual distance calculation
 * (since models use {latitude, longitude} instead of GeoJSON)
 */
const findNearbyFacilities = async (model, latitude, longitude, radiusKm = 50, query = {}) => {
  const allEntities = await model.find(query);
  
  return allEntities
    .map((entity) => {
      if (!entity.coordinates || !entity.coordinates.latitude || !entity.coordinates.longitude) {
        return null;
      }
      const distance = calculateDistance(
        latitude,
        longitude,
        entity.coordinates.latitude,
        entity.coordinates.longitude
      );
      if (distance <= radiusKm) {
        return {
          ...entity.toObject(),
          distance: parseFloat(distance.toFixed(2)),
        };
      }
      return null;
    })
    .filter((entity) => entity !== null)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Get all facilities (blood banks, hospitals, colleges/donation camps)
 * Supports filtering by type and location
 */
const getFacilities = async (req, res, next) => {
  try {
    const { type, lat, lng, radius = 50, limit = 100 } = req.query;
    const types = type ? type.split(',') : ['bloodBank', 'hospital', 'donationCamp'];

    let allFacilities = [];

    // Fetch blood banks
    if (types.includes('bloodBank')) {
      let bloodBanks = [];
      if (lat && lng) {
        bloodBanks = await findNearbyFacilities(
          BloodBank,
          parseFloat(lat),
          parseFloat(lng),
          parseFloat(radius),
          { status: 'active' }
        );
      } else {
        bloodBanks = await BloodBank.find({ status: 'active' }).limit(parseInt(limit));
        // Calculate distances if lat/lng provided
        if (lat && lng) {
          bloodBanks = bloodBanks
            .filter((bank) => bank.coordinates && bank.coordinates.latitude && bank.coordinates.longitude)
            .map((bank) => {
              const distance = calculateDistance(
                parseFloat(lat),
                parseFloat(lng),
                bank.coordinates.latitude,
                bank.coordinates.longitude
              );
              return { ...bank.toObject(), distance: parseFloat(distance.toFixed(2)) };
            });
        }
      }

      allFacilities.push(
        ...bloodBanks.map((bank) => ({
          _id: bank._id,
          type: 'bloodBank',
          name: bank.name,
          coordinates: bank.coordinates,
          address: bank.address,
          contact: bank.contact,
          status: bank.status === 'active' ? 'Open' : 'Closed',
          operatingHours: bank.operatingHours,
          testingCapability: bank.testingCapability,
          distance: bank.distance,
        }))
      );
    }

    // Fetch hospitals
    if (types.includes('hospital')) {
      let hospitals = [];
      if (lat && lng) {
        hospitals = await findNearbyFacilities(
          Hospital,
          parseFloat(lat),
          parseFloat(lng),
          parseFloat(radius),
          { isActive: true }
        );
      } else {
        hospitals = await Hospital.find({ isActive: true }).limit(parseInt(limit));
        if (lat && lng) {
          hospitals = hospitals
            .filter((hospital) => hospital.coordinates && hospital.coordinates.latitude && hospital.coordinates.longitude)
            .map((hospital) => {
              const distance = calculateDistance(
                parseFloat(lat),
                parseFloat(lng),
                hospital.coordinates.latitude,
                hospital.coordinates.longitude
              );
              return { ...hospital.toObject(), distance: parseFloat(distance.toFixed(2)) };
            });
        }
      }

      allFacilities.push(
        ...hospitals.map((hospital) => ({
          _id: hospital._id,
          type: 'hospital',
          name: hospital.name,
          coordinates: hospital.coordinates,
          address: hospital.address,
          contact: hospital.contact,
          status: hospital.isActive ? 'Open' : 'Closed',
          hasInHouseBloodBank: hospital.hasInHouseBloodBank,
          distance: hospital.distance,
        }))
      );
    }

    // Fetch colleges (as donation camps)
    if (types.includes('donationCamp') || types.includes('college')) {
      let colleges = [];
      if (lat && lng) {
        colleges = await findNearbyFacilities(
          College,
          parseFloat(lat),
          parseFloat(lng),
          parseFloat(radius),
          { isActive: true }
        );
      } else {
        colleges = await College.find({ isActive: true }).limit(parseInt(limit));
        if (lat && lng) {
          colleges = colleges
            .filter((college) => college.coordinates && college.coordinates.latitude && college.coordinates.longitude)
            .map((college) => {
              const distance = calculateDistance(
                parseFloat(lat),
                parseFloat(lng),
                college.coordinates.latitude,
                college.coordinates.longitude
              );
              return { ...college.toObject(), distance: parseFloat(distance.toFixed(2)) };
            });
        }
      }

      allFacilities.push(
        ...colleges.map((college) => ({
          _id: college._id,
          type: 'donationCamp',
          name: college.name,
          coordinates: college.coordinates,
          address: college.address,
          contact: {
            phone: college.coordinatorContact.phone,
            email: college.coordinatorContact.email,
          },
          coordinatorName: college.coordinatorName,
          status: college.isActive ? 'Open' : 'Closed',
          studentCount: college.studentCount,
          distance: college.distance,
        }))
      );
    }

    // Sort by distance if lat/lng provided
    if (lat && lng) {
      allFacilities.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // Limit results
    const limitedFacilities = allFacilities.slice(0, parseInt(limit));

    res.json({
      success: true,
      facilities: limitedFacilities,
      totalCount: limitedFacilities.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nearby facilities by coordinates
 */
const getNearbyFacilities = async (req, res, next) => {
  try {
    const { lat, lng, radius = 50, type, limit = 100 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const types = type ? type.split(',') : ['bloodBank', 'hospital', 'donationCamp'];
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    let allFacilities = [];

    // Fetch nearby blood banks
    if (types.includes('bloodBank')) {
      const bloodBanks = await findNearbyFacilities(
        BloodBank,
        latitude,
        longitude,
        radiusKm,
        { status: 'active' }
      );
      allFacilities.push(
        ...bloodBanks.map((bank) => ({
          _id: bank._id,
          type: 'bloodBank',
          name: bank.name,
          coordinates: bank.coordinates,
          address: bank.address,
          contact: bank.contact,
          status: bank.status === 'active' ? 'Open' : 'Closed',
          operatingHours: bank.operatingHours,
          testingCapability: bank.testingCapability,
          distance: bank.distance,
        }))
      );
    }

    // Fetch nearby hospitals
    if (types.includes('hospital')) {
      const hospitals = await findNearbyFacilities(
        Hospital,
        latitude,
        longitude,
        radiusKm,
        { isActive: true }
      );
      allFacilities.push(
        ...hospitals.map((hospital) => ({
          _id: hospital._id,
          type: 'hospital',
          name: hospital.name,
          coordinates: hospital.coordinates,
          address: hospital.address,
          contact: hospital.contact,
          status: hospital.isActive ? 'Open' : 'Closed',
          hasInHouseBloodBank: hospital.hasInHouseBloodBank,
          distance: hospital.distance,
        }))
      );
    }

    // Fetch nearby colleges (as donation camps)
    if (types.includes('donationCamp') || types.includes('college')) {
      const colleges = await findNearbyFacilities(
        College,
        latitude,
        longitude,
        radiusKm,
        { isActive: true }
      );
      allFacilities.push(
        ...colleges.map((college) => ({
          _id: college._id,
          type: 'donationCamp',
          name: college.name,
          coordinates: college.coordinates,
          address: college.address,
          contact: {
            phone: college.coordinatorContact.phone,
            email: college.coordinatorContact.email,
          },
          coordinatorName: college.coordinatorName,
          status: college.isActive ? 'Open' : 'Closed',
          studentCount: college.studentCount,
          distance: college.distance,
        }))
      );
    }

    // Sort by distance
    allFacilities.sort((a, b) => a.distance - b.distance);

    // Limit results
    const limitedFacilities = allFacilities.slice(0, parseInt(limit));

    res.json({
      success: true,
      facilities: limitedFacilities,
      totalCount: limitedFacilities.length,
      center: { lat: latitude, lng: longitude },
      radius: radiusKm,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get facility details by ID
 */
const getFacilityDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    let facility = null;

    if (type === 'bloodBank' || !type) {
      facility = await BloodBank.findById(id);
      if (facility) {
        return res.json({
          success: true,
          facility: {
            _id: facility._id,
            type: 'bloodBank',
            name: facility.name,
            coordinates: facility.coordinates,
            address: facility.address,
            contact: facility.contact,
            status: facility.status === 'active' ? 'Open' : 'Closed',
            operatingHours: facility.operatingHours,
            testingCapability: facility.testingCapability,
            licenseNumber: facility.licenseNumber,
          },
        });
      }
    }

    if (type === 'hospital' || !type) {
      facility = await Hospital.findById(id);
      if (facility) {
        return res.json({
          success: true,
          facility: {
            _id: facility._id,
            type: 'hospital',
            name: facility.name,
            coordinates: facility.coordinates,
            address: facility.address,
            contact: facility.contact,
            status: facility.isActive ? 'Open' : 'Closed',
            hasInHouseBloodBank: facility.hasInHouseBloodBank,
            licenseNumber: facility.licenseNumber,
          },
        });
      }
    }

    if (type === 'donationCamp' || type === 'college' || !type) {
      facility = await College.findById(id);
      if (facility) {
        return res.json({
          success: true,
          facility: {
            _id: facility._id,
            type: 'donationCamp',
            name: facility.name,
            coordinates: facility.coordinates,
            address: facility.address,
            contact: {
              phone: facility.coordinatorContact.phone,
              email: facility.coordinatorContact.email,
            },
            coordinatorName: facility.coordinatorName,
            status: facility.isActive ? 'Open' : 'Closed',
            studentCount: facility.studentCount,
          },
        });
      }
    }

    res.status(404).json({
      success: false,
      error: 'Facility not found',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get emergency zones data
 * Mock data for demonstration - in real app, this would come from database
 */
const getEmergencyZones = async (req, res, next) => {
  try {
    const { lat, lng, radius = 100 } = req.query;

    // Mock emergency zones data
    const mockEmergencyZones = [
      {
        id: 1,
        center: [19.0760, 72.8777], // Mumbai
        radius: 5000, // 5km
        intensity: 0.8, // High emergency frequency
        emergencyCount: 24,
        lastEmergency: '2 hours ago',
        bloodTypes: ['O+', 'A+', 'B+']
      },
      {
        id: 2,
        center: [28.6139, 77.2090], // Delhi
        radius: 3000,
        intensity: 0.6,
        emergencyCount: 18,
        lastEmergency: '4 hours ago',
        bloodTypes: ['A-', 'O-', 'AB+']
      },
      {
        id: 3,
        center: [13.0827, 80.2707], // Chennai
        radius: 4000,
        intensity: 0.4,
        emergencyCount: 12,
        lastEmergency: '6 hours ago',
        bloodTypes: ['B+', 'O+', 'A+']
      },
      {
        id: 4,
        center: [22.5726, 88.3639], // Kolkata
        radius: 3500,
        intensity: 0.5,
        emergencyCount: 15,
        lastEmergency: '3 hours ago',
        bloodTypes: ['AB+', 'A+', 'B-']
      },
      {
        id: 5,
        center: [12.9716, 77.5946], // Bangalore
        radius: 4500,
        intensity: 0.7,
        emergencyCount: 20,
        lastEmergency: '1 hour ago',
        bloodTypes: ['O+', 'A+', 'AB-']
      }
    ];

    let filteredZones = mockEmergencyZones;

    // Filter by location if lat/lng provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      filteredZones = mockEmergencyZones.filter(zone => {
        const distance = calculateDistance(
          userLat,
          userLng,
          zone.center[0],
          zone.center[1]
        );
        return distance <= radiusKm;
      });
    }

    res.json({
      success: true,
      emergencyZones: filteredZones,
      totalCount: filteredZones.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get emergency requests data
 * Mock data for demonstration - in real app, this would come from database
 */
const getEmergencyRequests = async (req, res, next) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    // Mock emergency requests data
    const mockEmergencyRequests = [
      {
        id: 1,
        hospitalName: 'City General Hospital',
        location: [19.0760, 72.8777], // Exact location (blurred for privacy)
        blurredLocation: [19.0760 + (Math.random() - 0.5) * 0.01, 72.8777 + (Math.random() - 0.5) * 0.01], // Slightly offset
        bloodTypes: ['O+', 'A+'],
        urgency: 'critical',
        unitsNeeded: 4,
        timePosted: '15 minutes ago',
        status: 'active',
        patientInfo: 'Emergency surgery - Accident victim'
      },
      {
        id: 2,
        hospitalName: 'Metro Medical Center',
        location: [28.6139, 77.2090],
        blurredLocation: [28.6139 + (Math.random() - 0.5) * 0.01, 77.2090 + (Math.random() - 0.5) * 0.01],
        bloodTypes: ['B-', 'O-'],
        urgency: 'high',
        unitsNeeded: 2,
        timePosted: '32 minutes ago',
        status: 'active',
        patientInfo: 'Cancer treatment - Chemotherapy'
      },
      {
        id: 3,
        hospitalName: 'Regional Blood Bank',
        location: [13.0827, 80.2707],
        blurredLocation: [13.0827 + (Math.random() - 0.5) * 0.01, 80.2707 + (Math.random() - 0.5) * 0.01],
        bloodTypes: ['AB+'],
        urgency: 'medium',
        unitsNeeded: 1,
        timePosted: '1 hour ago',
        status: 'active',
        patientInfo: 'Routine surgery preparation'
      }
    ];

    let filteredRequests = mockEmergencyRequests;

    // Filter by location if lat/lng provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      filteredRequests = mockEmergencyRequests.filter(request => {
        const distance = calculateDistance(
          userLat,
          userLng,
          request.location[0],
          request.location[1]
        );
        return distance <= radiusKm;
      });
    }

    res.json({
      success: true,
      emergencyRequests: filteredRequests,
      totalCount: filteredRequests.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFacilities,
  getNearbyFacilities,
  getFacilityDetails,
  getEmergencyZones,
  getEmergencyRequests,
};
