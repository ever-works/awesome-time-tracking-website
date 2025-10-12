/**
 * Server-side API client for making HTTP requests
 * Provides a centralized way to handle API calls with proper error handling
 * Optimized for performance and reduced latency
 */

// Optimized logger utility with conditional logging
const isDev = process.env.NODE_ENV === 'development';
const logger = {
  info: isDev ? (message: string, context?: Record<string, any>) =>
    console.log(`[ServerClient] ${message}`, context || '') : () => {},
  warn: (message: string, context?: Record<string, any>) =>
    console.warn(`[ServerClient] ${message}`, context || ''),
  error: (message: string, context?: Record<string, any>) =>
    console.error(`[ServerClient] ${message}`, context || ''),
  debug: isDev ? (message: string, context?: Record<string, any>) =>
    console.log(`[ServerClient] ${message}`, context || '') : () => {}
};


// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Optimized default configuration with pre-allocated objects
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'EverWorks-Server/1.0',
} as const;

const DEFAULT_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000, 
  headers: DEFAULT_HEADERS,
} as const;

// Simple cache for GET requests (in-memory, basic LRU)
const CACHE_SIZE = 100;
const requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * Optimized fetch with timeout, retries, and error handling
 * Simplified AbortSignal logic for better performance
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_CONFIG.timeout,
    retries = DEFAULT_CONFIG.retries,
    retryDelay = DEFAULT_CONFIG.retryDelay,
    ...fetchOptions
  } = options;

  const attemptFetch = async (attempt: number): Promise<Response> => {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

    // Simplified signal handling - use existing signal if provided, otherwise use timeout signal
    const signal = fetchOptions.signal || timeoutController.signal;

    try {
      // Pre-merge headers for better performance
      const headers = fetchOptions.headers 
        ? { ...DEFAULT_HEADERS, ...fetchOptions.headers }
        : DEFAULT_HEADERS;

      const response = await fetch(url, {
        ...fetchOptions,
        signal,
        headers,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle AbortError specifically
      if (error instanceof Error && (error.name === 'AbortError' || (error as any).code === 'ETIMEDOUT')) {
        const err = new Error(`Request timeout after ${timeout}ms`, { cause: error as any });
        (err as any).name = 'TimeoutError';
        (err as any).code = 'ETIMEDOUT';
        throw err;
      }

      // Only retry on network errors, not HTTP errors
      const shouldRetry = attempt < retries && 
        error instanceof Error && 
        (error.name === 'TypeError' || error.message.includes('fetch'));

      if (shouldRetry) {
        logger.warn(`Fetch attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`, { 
          url, 
          attempt: attempt + 1, 
          retries, 
          error: error.message
        });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return attemptFetch(attempt + 1);
      }

      throw error;
    }
  };

  return attemptFetch(0);
}

/**
 * Cache utility functions
 */
const cacheUtils = {
  get(key: string): any | null {
    const cached = requestCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      requestCache.delete(key);
      return null;
    }
    
    return cached.data;
  },
  
  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    // Simple LRU eviction
    if (requestCache.size >= CACHE_SIZE) {
      const firstKey = requestCache.keys().next().value;
      if (firstKey) {
        requestCache.delete(firstKey);
      }
    }
    
    requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  },
  
  clear(): void {
    requestCache.clear();
  }
};

/**
 * Optimized server client class with caching
 */
export class ServerClient {
  private baseUrl: string;
  private defaultOptions: FetchOptions;
  private cacheEnabled: boolean;

  constructor(baseUrl: string = '', options: FetchOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = { ...DEFAULT_CONFIG, ...options };
    this.cacheEnabled = true;
  }

  /**
   * Enable or disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
  }

  /**
   * Clear the request cache
   */
  clearCache(): void {
    cacheUtils.clear();
  }

  /**
   * Optimized generic request method with caching
   */
  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint;
    const isGetRequest = (options.method || 'GET') === 'GET';
    const cacheKey = `${url}${options.body ? `_${JSON.stringify(options.body)}` : ''}`;

    // Check cache for GET requests
    if (this.cacheEnabled && isGetRequest && !options.signal) {
      const cached = cacheUtils.get(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for ${url}`);
        return {
          success: true,
          data: cached,
        };
      }
    }

    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      const response = await fetchWithTimeout(url, mergedOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      // Cache successful GET requests
      if (this.cacheEnabled && isGetRequest && !options.signal) {
        cacheUtils.set(cacheKey, data);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      logger.error(`API request failed for ${url}`, { 
        url, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Optimized upload file with form data
   */
  async upload<T>(
    endpoint: string,
    file: File | FormData,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    // Optimized header filtering
    const filteredHeaders = options.headers 
      ? Object.fromEntries(
          Object.entries(options.headers).filter(
            ([key]) => key.toLowerCase() !== 'content-type'
          )
        )
      : {};

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: filteredHeaders,
    });
  }

  /**
   * Optimized form data (URL encoded) with pre-allocated headers
   */
  async postForm<T>(
    endpoint: string,
    data: Record<string, string>,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const formData = new URLSearchParams(data);

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData.toString(),
      headers: {
        ...options.headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }
}

// Default instance for immediate use
export const serverClient = new ServerClient();

// Specialized clients for different services
export const createApiClient = (baseUrl: string, options?: FetchOptions) => {
  return new ServerClient(baseUrl, options);
};

// ReCAPTCHA specific client
export const recaptchaClient = {
  async verify(token: string): Promise<ApiResponse<any>> {
    return serverClient.post('/api/verify-recaptcha', { token });
  },
};

// External API client (for third-party services)
export const externalClient = new ServerClient('', {
  timeout: 15000, // Longer timeout for external APIs
  retries: 2,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optimized utility functions
export const apiUtils = {
  /**
   * Check if response is successful
   */
  isSuccess: <T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } => {
    return response.success && response.data !== undefined;
  },

  /**
   * Extract error message from response
   */
  getErrorMessage: (response: ApiResponse<any>): string => {
    return response.error || response.message || 'Unknown error occurred';
  },

  /**
   * Optimized query string creation with early returns
   */
  createQueryString: (params: Record<string, any>): string => {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }
    
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    return searchParams.toString();
  },

  /**
   * Optimized URL building with query parameters
   */
  buildUrl: (baseUrl: string, params?: Record<string, any>): string => {
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }
    
    const queryString = apiUtils.createQueryString(params);
    if (!queryString) {
      return baseUrl;
    }
    
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}`;
  },

  /**
   * Clear all caches
   */
  clearCache: (): void => {
    cacheUtils.clear();
  },
};