/**
 * Error handling utility for extracting user-friendly error messages
 * Especially handles 429 (rate limit) errors with retry information
 */

/**
 * Extract user-friendly error message from API error
 * @param {Error} error - Error object from API call
 * @returns {Object} Object with message and metadata
 */
export const getErrorMessage = (error) => {
  // Handle 429 (Rate Limit) errors specifically
  if (error.response?.status === 429) {
    // Get retryAfter from response data (already in seconds) or headers (in seconds)
    let retryAfterSeconds = error.response?.data?.retryAfter;
    
    if (!retryAfterSeconds) {
      const retryAfterHeader = error.response?.headers?.['retry-after'] || 
                              error.response?.headers?.['Retry-After'];
      if (retryAfterHeader) {
        retryAfterSeconds = parseInt(retryAfterHeader, 10);
        if (isNaN(retryAfterSeconds)) {
          retryAfterSeconds = null;
        }
      }
    }
    
    // retryAfterSeconds is in seconds, convert to milliseconds for calculations
    const retryAfterMs = retryAfterSeconds ? retryAfterSeconds * 1000 : null;
    
    const retryAfterFormatted = error.response?.data?.retryAfterFormatted || 
                               (retryAfterSeconds ? `${Math.ceil(retryAfterSeconds / 60)} minutes` : 'a few minutes');
    
    const baseMessage = error.response?.data?.message || 
                       error.response?.data?.error || 
                       error.userMessage ||
                       'Too many requests';
    
    return {
      message: retryAfterSeconds 
        ? `${baseMessage}. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minutes.`
        : `${baseMessage}. Please try again in ${retryAfterFormatted}.`,
      isRateLimit: true,
      retryAfter: retryAfterMs,
      retryAfterSeconds: retryAfterSeconds,
      retryAfterFormatted: retryAfterFormatted,
      autoClose: retryAfterMs ? Math.min(retryAfterMs, 10000) : 5000, // Show longer for rate limits
    };
  }
  
  // Handle network errors
  if (!error.response && error.request) {
    return {
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      isNetworkError: true,
      autoClose: 5000,
    };
  }
  
  // Handle other API errors
  if (error.response?.data) {
    const data = error.response.data;
    
    // Handle validation errors
    if (data.details && Array.isArray(data.details)) {
      return {
        message: data.details.join(', '),
        isValidationError: true,
        autoClose: 5000,
      };
    }
    
    // Handle standard error messages
    if (data.message) {
      return {
        message: data.message,
        autoClose: 3000,
      };
    }
    
    if (data.error) {
      return {
        message: data.error,
        autoClose: 3000,
      };
    }
  }
  
  // Handle error message string
  if (typeof error === 'string') {
    return {
      message: error,
      autoClose: 3000,
    };
  }
  
  // Handle error object with message
  if (error.message) {
    return {
      message: error.message,
      autoClose: 3000,
    };
  }
  
  // Default fallback
  return {
    message: 'An unexpected error occurred. Please try again.',
    autoClose: 3000,
  };
};

/**
 * Show error toast with proper handling
 * @param {Error} error - Error object
 * @param {Object} toast - Toast function from react-toastify
 * @param {Object} options - Additional options
 */
export const showErrorToast = (error, toast, options = {}) => {
  const errorInfo = getErrorMessage(error);
  
  toast.error(errorInfo.message, {
    autoClose: options.autoClose || errorInfo.autoClose,
    ...options,
  });
  
  return errorInfo;
};

/**
 * Check if error is a rate limit error
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export const isRateLimitError = (error) => {
  return error.response?.status === 429 || error.statusCode === 429;
};

export default {
  getErrorMessage,
  showErrorToast,
  isRateLimitError,
};

