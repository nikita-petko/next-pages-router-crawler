import type { ErrorType } from '../types';
import getResponseFromError from './getResponseFromError';

export type ResponseError = {
  code: number;
  message: string;
  status: number;
};

export default async function tryParseResponseError(err: unknown): Promise<ResponseError | null> {
  try {
    const response = getResponseFromError(err);
    if (response) {
      const responseBody = (await response.json()) as ErrorType;
      if (responseBody.errors.length > 0) {
        const error = responseBody.errors[0];
        if (error) {
          return { status: response.status, code: error.code, message: error.message };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}
