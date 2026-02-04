import publicApi from './publicApiService';

// Cache for facilities data
let facilitiesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for nearby facilities (separate from general facilities cache)
let nearbyFacilitiesCache = {};
const NEARBY_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export const mapService = {
  // Fetch public facilities data for map display
  getPublicFacilities: async (params = {}) => {
    try {
      const response = await publicApi.get('/public/facilities', { params });
      
      // Update cache
      facilitiesCache = response.data;
      cacheTimestamp = Date.now();
      
      return response.data;
    } catch (error) {
      console.error('Error fetching public facilities:', error);
      
      // Return cached data if available and not too old
      if (facilitiesCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
        return facilitiesCache;
      }
      
      // Return empty result instead of mock data
      return {
        success: false,
        facilities: [],
        totalCount: 0,
        lastUpdated: new Date().toISOString(),
        error: 'Unable to fetch facilities. Please try again later.',
      };
    }
  },

  // Get nearby facilities by coordinates
  getNearbyFacilities: async (lat, lng, radius = 50, types = ['bloodBank', 'hospital', 'donationCamp']) => {
    try {
      // Filter out 'all' and ensure valid types
      const validTypes = types.filter(t => t !== 'all' && ['bloodBank', 'hospital', 'donationCamp', 'college'].includes(t));
      const typeParam = validTypes.length > 0 ? validTypes.join(',') : undefined;

      // Create cache key
      const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${radius},${typeParam || 'all'}`;

      // Check cache
      const cached = nearbyFacilitiesCache[cacheKey];
      if (cached && (Date.now() - cached.timestamp) < NEARBY_CACHE_DURATION) {
        return cached.data;
      }

      const response = await publicApi.get('/public/facilities/nearby', {
        params: {
          lat,
          lng,
          radius,
          ...(typeParam && { type: typeParam }),
          limit: 100,
        },
      });

      // Cache the response
      nearbyFacilitiesCache[cacheKey] = {
        data: response.data,
        timestamp: Date.now(),
      };

      // Clean old cache entries (keep only last 10)
      const cacheKeys = Object.keys(nearbyFacilitiesCache);
      if (cacheKeys.length > 10) {
        const oldestKey = cacheKeys.reduce((oldest, key) =>
          nearbyFacilitiesCache[key].timestamp < nearbyFacilitiesCache[oldest].timestamp ? key : oldest
        );
        delete nearbyFacilitiesCache[oldestKey];
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching nearby facilities:', error);
      return {
        success: false,
        facilities: [],
        totalCount: 0,
        error: error.response?.data?.error || 'Unable to fetch nearby facilities. Please try again later.',
      };
    }
  },

  // Get facility details by ID
  getFacilityDetails: async (facilityId, type = null) => {
    try {
      const params = type ? { type } : {};
      const response = await publicApi.get(`/public/facilities/${facilityId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching facility details:', error);
      throw error;
    }
  },

  // Search facilities by criteria (uses nearby endpoint with filters)
  searchFacilities: async (searchParams = {}) => {
    try {
      const { lat, lng, radius = 50, type = 'all', ...otherParams } = searchParams;
      
      if (lat && lng) {
        return await mapService.getNearbyFacilities(lat, lng, radius, [type]);
      }
      
      // Fallback to general facilities endpoint
      return await mapService.getPublicFacilities({ type, ...otherParams });
    } catch (error) {
      console.error('Error searching facilities:', error);
      throw error;
    }
  },
};

export default mapService;
