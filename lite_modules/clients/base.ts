import { StatusCodes } from '@rbx/core';
import axios, { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';

import { getCsrfToken, setCsrfToken } from '@clients/csrfTokenStore';

const readCsrfFromResponseHeaders = (headers: AxiosResponse['headers']): string | undefined => {
  const value = AxiosHeaders.from(headers as unknown as AxiosHeaders).get('x-csrf-token');
  return typeof value === 'string' && value ? value : undefined;
};

interface HeaderType {
  [key: string]: string;
}

type BodyType =
  | {
      [key: string]: unknown;
    }
  | object;

export interface GetOptions {
  /** Optional AbortSignal for request cancellation */
  abortSignal?: AbortSignal;
  headers?: HeaderType;
  retries?: number;
  url: string;
}

export interface PostOptions {
  body: BodyType;
  headers?: HeaderType;
  // Be careful with the retries when api calls are not idempotent
  // Retries won't count CSRF retries
  retries?: number;
  url: string;
}

export interface PatchOptions {
  body: BodyType;
  headers?: HeaderType;
  // Be careful with the retries when api calls are not idempotent
  // Retries won't count CSRF retries
  retries?: number;
  url: string;
}

export interface DeleteOptions {
  headers?: HeaderType;
  // Be careful with the retries when api calls are not idempotent
  // Retries won't count CSRF retries
  retries?: number;
  url: string;
}
class BaseClient {
  protected baseURL: string = '';

  getBaseURL() {
    return this.baseURL;
  }

  // eslint-disable-next-line class-methods-use-this
  protected getSendCredentials(): boolean {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  buildHeaders(headers: HeaderType) {
    const csrfToken = getCsrfToken();
    return {
      'Content-Type': 'application/json; charset=utf-8',
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      ...headers,
    };
  }

  async get<T>(options: GetOptions): Promise<AxiosResponse<T>> {
    const { abortSignal, headers = {}, retries = 0, url } = options;
    const configs = {
      baseURL: this.baseURL,
      headers: this.buildHeaders(headers),
      signal: abortSignal,
      withCredentials: this.getSendCredentials(),
    };

    return axios.get<T>(url, configs).catch(async (error: AxiosError<T>) => {
      if (retries && retries > 0) {
        return this.get<T>({ ...options, retries: retries - 1 });
      }
      throw error;
    });
  }

  /**
   * Single-source CSRF retry interceptor for all mutating methods.
   *
   * Runs `send`, and if it rejects with a 403 carrying an `x-csrf-token`
   * refresh header, writes the new token to the shared store and re-invokes
   * `send` up to `csrfRetries` times. Any other failure (or a 403 without a
   * refresh header — i.e. a genuine auth/permissions denial) propagates
   * immediately so we don't burn retries on calls that won't succeed.
   */
  private async executeWithCsrfRetry<T>(
    send: () => Promise<AxiosResponse<T>>,
    csrfRetries: number = 1,
  ): Promise<AxiosResponse<T>> {
    try {
      return await send();
    } catch (error) {
      const axiosError = error as AxiosError<T>;
      if (axiosError?.response?.status === StatusCodes.FORBIDDEN && csrfRetries > 0) {
        const refreshedToken = readCsrfFromResponseHeaders(axiosError.response.headers);
        if (refreshedToken) {
          setCsrfToken(refreshedToken);
          return this.executeWithCsrfRetry(send, csrfRetries - 1);
        }
      }
      throw error;
    }
  }

  async post<T>(options: PostOptions): Promise<AxiosResponse<T>> {
    const { body, headers = {}, retries = 0, url } = options;
    const send = () =>
      axios.post<T>(url, body, {
        baseURL: this.baseURL,
        headers: this.buildHeaders(headers),
        withCredentials: this.getSendCredentials(),
      });

    return this.executeWithCsrfRetry<T>(send).catch((error: AxiosError<T>) => {
      if (retries && retries > 0) {
        return this.post<T>({ ...options, retries: retries - 1 });
      }
      throw error;
    });
  }

  async patch<T>(options: PatchOptions): Promise<AxiosResponse<T>> {
    const { body, headers = {}, retries = 0, url } = options;
    const send = () =>
      axios.patch<T>(url, body, {
        baseURL: this.baseURL,
        headers: this.buildHeaders(headers),
        withCredentials: this.getSendCredentials(),
      });

    return this.executeWithCsrfRetry<T>(send).catch((error: AxiosError<T>) => {
      if (retries && retries > 0) {
        return this.patch<T>({ ...options, retries: retries - 1 });
      }
      throw error;
    });
  }

  async delete<T>(options: DeleteOptions): Promise<AxiosResponse<T>> {
    const { headers = {}, retries = 0, url } = options;
    const send = () =>
      axios.delete<T>(url, {
        baseURL: this.baseURL,
        headers: this.buildHeaders(headers),
        withCredentials: this.getSendCredentials(),
      });

    return this.executeWithCsrfRetry<T>(send).catch((error: AxiosError<T>) => {
      if (retries && retries > 0) {
        return this.delete<T>({ ...options, retries: retries - 1 });
      }
      throw error;
    });
  }
}

export default BaseClient;
