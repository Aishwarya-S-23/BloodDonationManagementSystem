/**
 * Retry handler utility for handling 429 (Too Many Requests) errors
 * Implements exponential backoff with jitter
 */

/**
 * Calculate delay with exponential backoff and jitter
 * @param {number} attempt - Current retry attempt (0-indexed)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000ms)
 * @param {number} maxDelay - Maximum delay in milliseconds (default: 30000ms)
 * @returns {number} Delay in milliseconds
 */
const calculateDelay = (attempt, baseDelay = 1000, maxDelay = 30000) => {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Add jitter (random 0-30% of delay) to prevent thundering herd
  const jitter = Math.random() * 0.3 * exponentialDelay;
  
  // Cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Extract retry-after value from response headers or error
 * @param {Object} error - Axios error object
 * @returns {number|null} Retry-after value in milliseconds, or null
 */
export const getRetryAfter = (error) => {
  // Check response data first (backend sends retryAfter in response body)
  if (error.response?.data?.retryAfter) {
    const retryAfter = error.response.data.retryAfter;
    // If it's already in milliseconds, return as is; otherwise assume seconds
    return typeof retryAfter === 'number' && retryAfter > 1000 ? retryAfter : retryAfter * 1000;
  }
  
  // Check headers (axios normalizes headers to lowercase)
  const headers = error.response?.headers || {};
  const retryAfterHeader = headers['retry-after'] || headers['Retry-After'];
  
  if (retryAfterHeader) {
    // Retry-After can be either seconds (number) or HTTP date string
    const retryAfter = parseInt(retryAfterHeader, 10);
    if (!isNaN(retryAfter)) {
      return retryAfter * 1000; // Convert to milliseconds
    }
    // If it's a date string, calculate difference
    const retryDate = new Date(retryAfterHeader);
    if (!isNaN(retryDate.getTime())) {
      return Math.max(0, retryDate.getTime() - Date.now());
    }
  }
  
  return null;
};

/**
 * Retry a failed request with exponential backoff
 * @param {Function} requestFn - Function that returns a promise (the request)
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 30000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise} Promise that resolves with the response or rejects after max retries
 */
export const retryRequest = async (requestFn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = (error) => {
      // Default: retry on 429 or network errors
      return error.response?.status === 429 || !error.response;
    },
    onRetry = (attempt, delay) => {
      console.log(`Retrying request... Attempt ${attempt + 1}, waiting ${delay}ms`);
    },
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we've exhausted retries or error shouldn't be retried
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Get retry-after from headers if available (for 429 errors)
      let delay = getRetryAfter(error);
      
      // If no retry-after header, use exponential backoff
      if (delay === null) {
        delay = calculateDelay(attempt, baseDelay, maxDelay);
      }
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, delay, error);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Create a retry-enabled axios interceptor
 * @param {Object} options - Retry options (same as retryRequest)
 * @returns {Function} Axios response interceptor function
 */
export const createRetryInterceptor = (options = {}) => {
  return async (error) => {
    const config = error.config;
    
    // Don't retry if retry is disabled or already retried
    if (config?.__retryDisabled || config?.__retryCount >= (options.maxRetries || 3)) {
      return Promise.reject(error);
    }
    
    // Initialize retry count
    config.__retryCount = config.__retryCount || 0;
    
    // Check if we should retry this error
    const shouldRetry = options.shouldRetry || ((error) => {
      return error.response?.status === 429 || !error.response;
    });
    
    if (!shouldRetry(error)) {
      return Promise.reject(error);
    }
    
    // Increment retry count
    config.__retryCount += 1;
    
    // Get retry-after from headers if available
    let delay = getRetryAfter(error);
    
    // If no retry-after header, use exponential backoff
    if (delay === null) {
      delay = calculateDelay(config.__retryCount - 1, options.baseDelay || 1000, options.maxDelay || 30000);
    }
    
    // Call onRetry callback if provided
    if (options.onRetry) {
      options.onRetry(config.__retryCount, delay, error);
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry the request
    return error.config.axiosInstance(error.config);
  };
};

export default {
  retryRequest,
  createRetryInterceptor,
  calculateDelay,
  getRetryAfter,
};

