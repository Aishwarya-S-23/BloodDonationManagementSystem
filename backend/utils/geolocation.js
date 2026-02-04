/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Find nearby entities within a radius
 * @param {Object} model - Mongoose model
 * @param {number} latitude - Center latitude
 * @param {number} longitude - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @param {Object} query - Additional query filters
 * @returns {Array} Array of entities with distance
 */
const findNearby = async (model, latitude, longitude, radiusKm = 50, query = {}) => {
  // MongoDB geospatial query
  const results = await model.find({
    ...query,
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude], // MongoDB uses [longitude, latitude]
        },
        $maxDistance: radiusKm * 1000, // Convert km to meters
      },
    },
  }).limit(100);

  // Calculate exact distances and add to results
  return results.map((entity) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      entity.coordinates.latitude,
      entity.coordinates.longitude
    );
    return {
      ...entity.toObject(),
      distance: parseFloat(distance.toFixed(2)),
    };
  });
};

/**
 * Sort entities by distance from a point
 * @param {Array} entities - Array of entities with coordinates
 * @param {number} latitude - Center latitude
 * @param {number} longitude - Center longitude
 * @returns {Array} Sorted array with distance property
 */
const sortByDistance = (entities, latitude, longitude) => {
  return entities
    .map((entity) => {
      if (!entity.coordinates || !entity.coordinates.latitude || !entity.coordinates.longitude) {
        return { ...entity, distance: Infinity };
      }
      const distance = calculateDistance(
        latitude,
        longitude,
        entity.coordinates.latitude,
        entity.coordinates.longitude
      );
      return {
        ...entity.toObject ? entity.toObject() : entity,
        distance: parseFloat(distance.toFixed(2)),
      };
    })
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Estimate travel time in minutes (rough estimate)
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} mode - 'driving' (default) or 'walking'
 * @returns {number} Estimated time in minutes
 */
const estimateTravelTime = (distanceKm, mode = 'driving') => {
  const averageSpeed = mode === 'driving' ? 40 : 5; // km/h
  const timeHours = distanceKm / averageSpeed;
  return Math.ceil(timeHours * 60); // Convert to minutes
};

module.exports = {
  calculateDistance,
  findNearby,
  sortByDistance,
  estimateTravelTime,
};

