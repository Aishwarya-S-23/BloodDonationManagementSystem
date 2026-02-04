/**
 * Mappls Map Service - Replaces Leaflet with Mappls Web SDK
 * Provides map rendering, markers, and location services
 */

class MapplsMapService {
  constructor() {
    this.map = null;
    this.markers = [];
    this.apiKey = process.env.REACT_APP_MAPPLS_API_KEY || '0d0a98cacebb8518543bc0541898000c';
    this.mapplsLoaded = false;
    this.initPromise = null;
  }

  /**
   * Initialize Mappls SDK
   */
  async initializeMapplsSDK() {
    if (this.mapplsLoaded) {
      console.log('Mappls SDK already loaded');
      return Promise.resolve();
    }

    if (this.initPromise) return this.initPromise;

    console.log('Starting Mappls SDK initialization...');

    this.initPromise = new Promise((resolve, reject) => {
      // Check if Mappls SDK is already loaded
      if (window.mappls && window.mappls.Map) {
        this.mapplsLoaded = true;
        console.log('Mappls SDK already available');
        resolve();
        return;
      }

      // Load Mappls Web SDK
      console.log('Loading Mappls SDK script...');
      const script = document.createElement('script');
      script.src = `https://apis.mappls.com/advancedmaps/api/${this.apiKey}/map_sdk?layer=vector&v=3.0`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('Mappls script loaded, waiting for SDK...');
        // Wait for SDK to be fully initialized
        const checkSdkReady = () => {
          if (window.mappls && window.mappls.Map) {
            this.mapplsLoaded = true;
            console.log('Mappls SDK fully loaded and ready!');
            console.log('Available Mappls APIs:', Object.keys(window.mappls));
            resolve();
          } else {
            console.log('Waiting for Mappls SDK...');
            setTimeout(checkSdkReady, 100);
          }
        };
        checkSdkReady();
      };

      script.onerror = (error) => {
        console.error('Failed to load Mappls SDK script:', error);
        reject(new Error('Failed to load Mappls SDK'));
      };

      document.head.appendChild(script);

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!this.mapplsLoaded) {
          console.error('Mappls SDK loading timeout after 15 seconds');
          reject(new Error('Mappls SDK loading timeout'));
        }
      }, 15000);
    });

    return this.initPromise;
  }

  /**
   * Initialize map in a container
   */
  async initializeMap(containerElement, options = {}) {
    await this.initializeMapplsSDK();

    const defaultOptions = {
      center: [28.6139, 77.2090], // Default to Delhi
      zoom: 12,
      ...options
    };

    try {
      // Create map instance using Mappls Web SDK - simplified approach
      console.log('Creating Mappls map with options:', defaultOptions);

      this.map = new window.mappls.Map(containerElement, {
        center: defaultOptions.center,
        zoom: defaultOptions.zoom
      });

      // Basic wait for map to be ready
      await new Promise((resolve) => {
        setTimeout(() => {
          console.log('Mappls map initialized (basic)');
          resolve();
        }, 1000);
      });

      console.log('Mappls map initialized successfully');
      return this.map;

    } catch (error) {
      console.error('Failed to initialize Mappls map:', error);
      throw error;
    }
  }

  /**
   * Add marker to map
   */
  addMarker(position, options = {}) {
    if (!this.map) {
      console.error('Map not initialized');
      return null;
    }

    const defaultOptions = {
      color: '#FF0000',
      popup: null,
      draggable: false,
      ...options
    };

    try {
      // Create marker using Mappls Web SDK - simplified
      console.log('Adding marker at position:', position);

      const marker = new window.mappls.Marker({
        position: position,
        map: this.map
      });

      console.log('Marker created:', marker);

      // Add event listeners
      if (defaultOptions.onClick) {
        marker.addListener('click', defaultOptions.onClick);
      }

      this.markers.push(marker);
      return marker;

    } catch (error) {
      console.error('Failed to add marker:', error);
      return null;
    }
  }

  /**
   * Add circle/heat zone to map
   */
  addCircle(center, radius, options = {}) {
    if (!this.map) {
      console.error('Map not initialized');
      return null;
    }

    const defaultOptions = {
      color: '#FF0000',
      fillColor: '#FF0000',
      fillOpacity: 0.2,
      weight: 2,
      ...options
    };

    try {
      // Create circle using Mappls Web SDK
      const circleOptions = {
        center: center,
        radius: radius,
        map: this.map,
        strokeColor: defaultOptions.color,
        strokeWeight: defaultOptions.weight,
        fillColor: defaultOptions.fillColor,
        fillOpacity: defaultOptions.fillOpacity
      };

      const circle = new window.mappls.Circle(circleOptions);
      return circle;

    } catch (error) {
      console.error('Failed to add circle:', error);
      return null;
    }
  }

  /**
   * Add multiple markers from facility data
   */
  addFacilityMarkers(facilities, options = {}) {
    if (!facilities || !Array.isArray(facilities)) return [];

    const defaultOptions = {
      getPosition: (facility) => [facility.latitude, facility.longitude],
      getPopup: (facility) => `
        <div class="map-popup" style="padding: 8px; max-width: 250px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${facility.name}</h4>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${facility.address || 'Address not available'}</p>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">Type: ${facility.type}</p>
          ${facility.distance ? `<p style="margin: 0; font-size: 12px; color: #666;">Distance: ${facility.distance.toFixed(1)}km</p>` : ''}
        </div>
      `,
      getColor: (facility) => {
        if (facility.type === 'bloodBank') return '#dc2626'; // Red
        if (facility.type === 'hospital') return '#2563eb';  // Blue
        if (facility.type === 'college') return '#16a34a';   // Green
        return '#dc2626'; // Default red
      },
      onMarkerClick: null,
      ...options
    };

    const markers = [];

    facilities.forEach(facility => {
      try {
        const position = defaultOptions.getPosition(facility);
        const popup = defaultOptions.getPopup(facility);
        const color = defaultOptions.getColor(facility);

        const marker = this.addMarker(position, {
          color,
          popup,
          onClick: defaultOptions.onMarkerClick ?
            () => defaultOptions.onMarkerClick(facility) : null
        });

        if (marker) {
          markers.push(marker);
        }

      } catch (error) {
        console.error('Failed to add facility marker:', error, facility);
      }
    });

    return markers;
  }

  /**
   * Fit map bounds to show all markers
   */
  fitBounds(positions, padding = 50) {
    if (!this.map || !positions || positions.length === 0) return;

    try {
      // Calculate bounds
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;

      positions.forEach(pos => {
        minLat = Math.min(minLat, pos[0]);
        maxLat = Math.max(maxLat, pos[0]);
        minLng = Math.min(minLng, pos[1]);
        maxLng = Math.max(maxLng, pos[1]);
      });

      const bounds = [
        [minLat, minLng],
        [maxLat, maxLng]
      ];

      this.map.fitBounds(bounds, { padding });

    } catch (error) {
      console.error('Failed to fit bounds:', error);
    }
  }

  /**
   * Set map center
   */
  setCenter(position, zoom = null) {
    if (!this.map) return;

    try {
      this.map.setCenter(position);
      if (zoom !== null) {
        this.map.setZoom(zoom);
      }
    } catch (error) {
      console.error('Failed to set center:', error);
    }
  }

  /**
   * Set map zoom level
   */
  setZoom(zoom) {
    if (!this.map) return;

    try {
      this.map.setZoom(zoom);
    } catch (error) {
      console.error('Failed to set zoom:', error);
    }
  }

  /**
   * Clear all markers
   */
  clearMarkers() {
    this.markers.forEach(marker => {
      try {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      } catch (error) {
        console.error('Failed to remove marker:', error);
      }
    });
    this.markers = [];
  }

  /**
   * Get current map center
   */
  getCenter() {
    return this.map ? this.map.getCenter() : null;
  }

  /**
   * Get current zoom level
   */
  getZoom() {
    return this.map ? this.map.getZoom() : null;
  }

  /**
   * Destroy map instance
   */
  destroy() {
    if (this.map) {
      try {
        this.map.remove();
        this.map = null;
      } catch (error) {
        console.error('Failed to destroy map:', error);
      }
    }

    this.clearMarkers();
  }

  /**
   * Get user's current location
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Search for places using Mappls
   */
  async searchPlaces(query, location = null, radius = 5000) {
    try {
      // This would integrate with Mappls Places API
      // For now, return empty array as this is handled by backend
      console.log('Mappls place search:', query, location, radius);
      return [];
    } catch (error) {
      console.error('Place search failed:', error);
      return [];
    }
  }

  /**
   * Add traffic layer to map
   */
  addTrafficLayer() {
    if (!this.map) return;

    try {
      const trafficLayer = new window.mappls.TrafficLayer();
      trafficLayer.setMap(this.map);
      return trafficLayer;
    } catch (error) {
      console.error('Failed to add traffic layer:', error);
      return null;
    }
  }

  /**
   * Get map instance
   */
  getMap() {
    return this.map;
  }

  /**
   * Check if Mappls SDK is loaded
   */
  isLoaded() {
    return this.mapplsLoaded;
  }
}

// Create singleton instance
const mapplsMapService = new MapplsMapService();

export default mapplsMapService;
