/**
 * Request queue utility to throttle API requests and prevent overwhelming the server
 * Implements a token bucket algorithm for rate limiting
 */

class RequestQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 5; // Max concurrent requests
    this.minDelay = options.minDelay || 100; // Minimum delay between requests (ms)
    this.queue = [];
    this.activeRequests = 0;
    this.lastRequestTime = 0;
  }

  /**
   * Add a request to the queue
   * @param {Function} requestFn - Function that returns a promise (optional, for throttling only)
   * @param {number} priority - Priority (higher = more important, default: 0)
   * @returns {Promise} Promise that resolves when it's the request's turn
   */
  async enqueue(requestFn = null, priority = 0) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFn: requestFn || (() => Promise.resolve()),
        priority,
        resolve,
        reject,
        timestamp: Date.now(),
      });
      
      // Sort queue by priority (higher first), then by timestamp
      this.queue.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });
      
      this.processQueue();
    });
  }

  /**
   * Process the queue
   */
  async processQueue() {
    // Don't process if at max concurrent requests
    if (this.activeRequests >= this.maxConcurrent) {
      return;
    }
    
    // Don't process if queue is empty
    if (this.queue.length === 0) {
      return;
    }
    
    // Check minimum delay between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      setTimeout(() => this.processQueue(), this.minDelay - timeSinceLastRequest);
      return;
    }
    
    // Get next request from queue
    const item = this.queue.shift();
    if (!item) {
      return;
    }
    
    this.activeRequests++;
    this.lastRequestTime = Date.now();
    
    try {
      const result = await item.requestFn();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.activeRequests--;
      // Process next item in queue
      setTimeout(() => this.processQueue(), this.minDelay);
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue.forEach(item => {
      item.reject(new Error('Request queue cleared'));
    });
    this.queue = [];
  }
}

// Create singleton instance
const requestQueue = new RequestQueue({
  maxConcurrent: 5,
  minDelay: 100,
});

export default requestQueue;
export { RequestQueue };

