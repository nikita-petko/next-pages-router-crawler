import { ResponseError } from '@rbx/clients-core';

export default function isResponseError(error: unknown): error is ResponseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'ResponseError' &&
    'response' in error &&
    error.response !== undefined
  );
}
