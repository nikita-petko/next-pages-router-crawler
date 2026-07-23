import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';

import { EventName, logNativeApiVitalsEvent } from '@clients/unifiedLogger';
import { CaptureException } from '@utils/error';

// Flag to track if interceptors have been set up already.
let interceptorsSetup = false;

declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

/**
 * Logs API vitals for both successful and failed requests.
 *
 * @param config - The axios request config containing metadata and URL
 * @param statusCode - The HTTP status code
 */
const logApiVitals = (config: AxiosRequestConfig | undefined, statusCode: number): void => {
  const endTime = Date.now();
  const startTime = config?.metadata?.startTime;
  const duration = startTime ? endTime - startTime : undefined;

  logNativeApiVitalsEvent(EventName.ApiEvent, {
    apiUrl: config?.url || 'unknown',
    elapsedTime: duration?.toString(),
    httpMethod: config?.method?.toUpperCase() || 'unknown',
    statusCode: String(statusCode),
  });
};

/**
 * Sets up global axios interceptors for API vitals logging.
 * Logs both successful responses and errors with endpoint and status code.
 * Should be called once during application initialization.
 */
export const setupAxiosInterceptors = (): void => {
  if (interceptorsSetup) {
    return;
  }

  axios.interceptors.request.use(
    (config) => {
      // eslint-disable-next-line no-param-reassign
      config.metadata = { startTime: Date.now() };
      return config;
    },
    (error) => Promise.reject(error),
  );

  axios.interceptors.response.use(
    (response) => {
      logApiVitals(response.config, response.status);
      return response;
    },
    (error) => {
      const statusCode = error.response?.status || error.status || 0;
      logApiVitals(error.config, statusCode);
      return Promise.reject(error);
    },
  );

  interceptorsSetup = true;
};

/**
 * Determines whether an error should be captured.
 *
 * @param error - The error to check
 * @returns True if the error should be captured, false otherwise
 */
const shouldCaptureError = (error: unknown): boolean => {
  if (!isAxiosError(error)) {
    return true;
  }

  const isNetworkError =
    error.code === AxiosError.ERR_NETWORK || error.code === AxiosError.ECONNABORTED;
  const hasAmaError = error.response?.data?.error;

  return !isNetworkError && !hasAmaError;
};

/**
 * Executes an HTTP request with standardized error handling.
 *
 * @param method - Function that returns a Promise of the HTTP request
 * @returns Promise that resolves to the HTTP response
 * @throws Re-throws caught errors after processing
 */
export const executeApiCall = async <T>(
  method: () => Promise<AxiosResponse<T>>,
): Promise<AxiosResponse<T>> => {
  try {
    const response = await method();
    return response;
  } catch (error: unknown) {
    if (shouldCaptureError(error)) {
      CaptureException(error);
    }
    throw error;
  }
};
