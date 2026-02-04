const axios = require('axios');

/**
 * Mappls (MapmyIndia) Service
 * Centralizes all Mappls API calls with retry logic, rate limiting, and fallback support
 */
class MapplsService {
  constructor() {
    this.apiKey = process.env.MAPPLS_API_KEY;
    this.baseUrl = 'https://apis.mappls.com/advancedmaps/v1';

    if (!this.apiKey) {
      console.warn('MAPPLS_API_KEY not found. Mappls services will use fallback.');
    }

    // Rate limiting
    this.requestQueue = [];
    this.activeRequests = 0;
    this.maxConcurrent = 5;
    this.minDelay = 200; // 200ms between requests
    this.lastRequestTime = 0;

    // Retry configuration
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second base delay

    // Initialize axios instance
    this.client = axios.create({
      timeout: 10000, // 10 second timeout
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const config = error.config;

        if (!config || !config._retry) {
          return Promise.reject(error);
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 60;
          await this.delay(retryAfter * 1000);
          return this.client.request(config);
        }

        // Handle other errors with retry
        if (config._retryCount < this.maxRetries) {
          config._retryCount += 1;
          const delay = this.retryDelay * Math.pow(2, config._retryCount - 1);
          await this.delay(delay);
          return this.client.request(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Queue management for rate limiting
   */
  async enqueueRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.activeRequests >= this.maxConcurrent || this.requestQueue.length === 0) {
      return;
    }

    // Check minimum delay between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      setTimeout(() => this.processQueue(), this.minDelay - timeSinceLastRequest);
      return;
    }

    const { requestFn, resolve, reject } = this.requestQueue.shift();
    this.activeRequests++;
    this.lastRequestTime = Date.now();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.activeRequests--;
      // Process next request after minimum delay
      setTimeout(() => this.processQueue(), this.minDelay);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Geocode API: Convert address to coordinates
   */
  async geocodeAddress(address, region = 'ind') {
    if (!this.apiKey) {
      return this.fallbackGeocode(address);
    }

    try {
      const response = await this.enqueueRequest(() =>
        this.client.get(`${this.baseUrl}/${this.apiKey}/geocode`, {
          params: { address, region }
        })
      );

      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          success: true,
          latitude: result.lat,
          longitude: result.lng,
          address: result.formatted_address,
          placeId: result.place_id,
          raw: result
        };
      }

      return { success: false, error: 'No results found' };
    } catch (error) {
      console.error('Mappls Geocode API error:', error.message);
      return this.fallbackGeocode(address);
    }
  }

  /**
   * Reverse Geocode API: Convert coordinates to address
   */
  async reverseGeocode(latitude, longitude) {
    if (!this.apiKey) {
      return this.fallbackReverseGeocode(latitude, longitude);
    }

    try {
      const response = await this.enqueueRequest(() =>
        this.client.get(`${this.baseUrl}/${this.apiKey}/rev_geocode`, {
          params: { lat: latitude, lng: longitude }
        })
      );

      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          success: true,
          address: result.formatted_address,
          placeId: result.place_id,
          raw: result
        };
      }

      return { success: false, error: 'No results found' };
    } catch (error) {
      console.error('Mappls Reverse Geocode API error:', error.message);
      return this.fallbackReverseGeocode(latitude, longitude);
    }
  }

  /**
   * Nearby API: Find places near a location
   */
  async findNearby(latitude, longitude, keywords, radius = 5000, bounds = null, page = 1) {
    if (!this.apiKey) {
      return this.fallbackNearbySearch(latitude, longitude, keywords, radius);
    }

    try {
      const params = {
        keywords,
        refLocation: `${latitude},${longitude}`,
        searchRadius: radius,
        page
      };

      if (bounds) {
        params.bounds = bounds;
      }

      const response = await this.enqueueRequest(() =>
        this.client.get(`${this.baseUrl}/${this.apiKey}/nearby_search`, { params })
      );

      if (response.data && response.data.results) {
        return {
          success: true,
          results: response.data.results.map(result => ({
            placeId: result.place_id,
            name: result.poi,
            address: result.address,
            latitude: result.lat,
            longitude: result.lng,
            distance: result.distance || 0,
            category: result.category,
            phone: result.phone,
            raw: result
          })),
          totalResults: response.data.totalResults || response.data.results.length,
          hasMore: response.data.pageInfo?.hasNext || false
        };
      }

      return { success: false, error: 'No results found', results: [] };
    } catch (error) {
      console.error('Mappls Nearby API error:', error.message);
      return this.fallbackNearbySearch(latitude, longitude, keywords, radius);
    }
  }

  /**
   * Distance Matrix ETA API: Calculate travel time with traffic
   */
  async getDistanceMatrix(origins, destinations, alternatives = false, mode = 'driving', traffic = true) {
    if (!this.apiKey) {
      return this.fallbackDistanceMatrix(origins, destinations);
    }

    try {
      const originsStr = origins.map(coord => `${coord.latitude},${coord.longitude}`).join('|');
      const destinationsStr = destinations.map(coord => `${coord.latitude},${coord.longitude}`).join('|');

      const response = await this.enqueueRequest(() =>
        this.client.get(`${this.baseUrl}/${this.apiKey}/distance_matrix_eta`, {
          params: {
            origins: originsStr,
            destinations: destinationsStr,
            alternatives,
            mode,
            traffic: traffic ? 'true' : 'false'
          }
        })
      );

      if (response.data && response.data.results) {
        return {
          success: true,
          matrix: response.data.results.map(row => ({
            origin: row.origin,
            destinations: row.destinations.map(dest => ({
              destination: dest.destination,
              distance: dest.distance,
              duration: dest.duration, // Duration with traffic
              durationWithoutTraffic: dest.duration_without_traffic,
              status: dest.status
            }))
          })),
          raw: response.data
        };
      }

      return { success: false, error: 'Failed to calculate distances' };
    } catch (error) {
      console.error('Mappls Distance Matrix API error:', error.message);
      return this.fallbackDistanceMatrix(origins, destinations);
    }
  }

  /**
   * Place Detail API: Get detailed information about a place
   */
  async getPlaceDetails(placeId) {
    if (!this.apiKey) {
      return { success: false, error: 'Mappls API not configured' };
    }

    try {
      const response = await this.enqueueRequest(() =>
        this.client.get(`${this.baseUrl}/${this.apiKey}/place_detail`, {
          params: { place_id: placeId }
        })
      );

      if (response.data && response.data.result) {
        const result = response.data.result;
        return {
          success: true,
          placeId: result.place_id,
          name: result.name || result.poi,
          address: result.formatted_address,
          phone: result.international_phone_number || result.phone,
          website: result.website,
          rating: result.rating,
          reviews: result.reviews,
          openingHours: result.opening_hours,
          photos: result.photos,
          coordinates: {
            latitude: result.geometry?.location?.lat,
            longitude: result.geometry?.location?.lng
          },
          types: result.types,
          raw: result
        };
      }

      return { success: false, error: 'Place details not found' };
    } catch (error) {
      console.error('Mappls Place Detail API error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fallback geocoding using OpenStreetMap Nominatim
   */
  async fallbackGeocode(address) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          countrycodes: 'IN' // Focus on India
        },
        headers: {
          'User-Agent': 'BloodConnect/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          success: true,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: result.display_name,
          fallback: true,
          source: 'OpenStreetMap'
        };
      }

      return { success: false, error: 'Address not found', fallback: true };
    } catch (error) {
      console.error('OpenStreetMap geocoding fallback failed:', error.message);
      return { success: false, error: 'Geocoding service unavailable', fallback: true };
    }
  }

  /**
   * Fallback reverse geocoding using OpenStreetMap Nominatim
   */
  async fallbackReverseGeocode(latitude, longitude) {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json'
        },
        headers: {
          'User-Agent': 'BloodConnect/1.0'
        }
      });

      if (response.data) {
        return {
          success: true,
          address: response.data.display_name,
          fallback: true,
          source: 'OpenStreetMap'
        };
      }

      return { success: false, error: 'Location not found', fallback: true };
    } catch (error) {
      console.error('OpenStreetMap reverse geocoding fallback failed:', error.message);
      return { success: false, error: 'Reverse geocoding service unavailable', fallback: true };
    }
  }

  /**
   * Fallback nearby search using Overpass API
   */
  async fallbackNearbySearch(latitude, longitude, keywords, radius) {
    try {
      // Convert keywords to Overpass query
      const query = this.keywordsToOverpassQuery(keywords);

      const overpassQuery = `
        [out:json][timeout:25];
        (
          ${query}
          (around:${radius},${latitude},${longitude});
        );
        out meta;
      `;

      const response = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': 'BloodConnect/1.0'
        }
      });

      if (response.data && response.data.elements) {
        const results = response.data.elements.slice(0, 20).map(element => ({
          placeId: element.id.toString(),
          name: element.tags?.name || 'Unnamed',
          address: this.formatOverpassAddress(element.tags),
          latitude: element.lat || element.center?.lat,
          longitude: element.lon || element.center?.lon,
          category: element.tags?.amenity || element.tags?.healthcare,
          fallback: true,
          source: 'OpenStreetMap'
        })).filter(result => result.latitude && result.longitude);

        return {
          success: true,
          results,
          totalResults: results.length,
          fallback: true,
          source: 'OpenStreetMap'
        };
      }

      return { success: false, error: 'No nearby places found', results: [], fallback: true };
    } catch (error) {
      console.error('OpenStreetMap Overpass fallback failed:', error.message);
      return { success: false, error: 'Nearby search service unavailable', results: [], fallback: true };
    }
  }

  /**
   * Convert keywords to Overpass API query
   */
  keywordsToOverpassQuery(keywords) {
    const lowerKeywords = keywords.toLowerCase();

    if (lowerKeywords.includes('blood bank') || lowerKeywords.includes('bloodbank')) {
      return 'node["amenity"="hospital"]["healthcare"="blood_bank"];way["amenity"="hospital"]["healthcare"="blood_bank"];';
    }

    if (lowerKeywords.includes('hospital')) {
      return 'node["amenity"="hospital"];way["amenity"="hospital"];';
    }

    if (lowerKeywords.includes('college') || lowerKeywords.includes('university')) {
      return 'node["amenity"="college"];node["amenity"="university"];way["amenity"="college"];way["amenity"="university"];';
    }

    if (lowerKeywords.includes('school')) {
      return 'node["amenity"="school"];way["amenity"="school"];';
    }

    // Default to general search
    return 'node["name"];way["name"];';
  }

  /**
   * Format Overpass address from tags
   */
  formatOverpassAddress(tags) {
    if (!tags) return 'Address not available';

    const parts = [];
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    if (tags['addr:state']) parts.push(tags['addr:state']);
    if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
    if (tags['addr:country']) parts.push(tags['addr:country']);

    return parts.length > 0 ? parts.join(', ') : (tags.name || 'Unnamed location');
  }

  /**
   * Fallback distance matrix using simple distance calculation
   */
  async fallbackDistanceMatrix(origins, destinations) {
    try {
      const results = [];

      for (const origin of origins) {
        const destinationsResult = [];

        for (const destination of destinations) {
          const distance = this.calculateDistance(
            origin.latitude, origin.longitude,
            destination.latitude, destination.longitude
          );

          // Estimate time (rough calculation: 30 km/h average speed)
          const duration = Math.round((distance / 30) * 60); // in minutes

          destinationsResult.push({
            destination: `${destination.latitude},${destination.longitude}`,
            distance: Math.round(distance * 1000), // Convert to meters
            duration: duration * 60, // Convert to seconds
            durationWithoutTraffic: duration * 60,
            status: 'OK'
          });
        }

        results.push({
          origin: `${origin.latitude},${origin.longitude}`,
          destinations: destinationsResult
        });
      }

      return {
        success: true,
        matrix: results,
        fallback: true,
        source: 'Distance Calculation'
      };
    } catch (error) {
      console.error('Distance matrix fallback failed:', error.message);
      return { success: false, error: 'Distance calculation failed', fallback: true };
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      mapplsConfigured: !!this.apiKey,
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length,
      lastRequestTime: this.lastRequestTime,
      fallbackAvailable: true // OpenStreetMap fallback
    };
  }
}

module.exports = new MapplsService();

