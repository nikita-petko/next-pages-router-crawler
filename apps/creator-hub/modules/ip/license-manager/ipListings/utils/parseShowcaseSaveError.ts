import {
  ApiErrorResponseFromJSON,
  type ApiErrorResponse,
} from '@rbx/client-content-licensing-api/v1';
import { getResponseFromError } from '@modules/clients/utils';

export type ParsedShowcaseSaveError = {
  status: number | undefined;
  body: ApiErrorResponse | undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === 'object';

export const parseShowcaseSaveError = async (error: Error): Promise<ParsedShowcaseSaveError> => {
  const response = getResponseFromError(error);
  if (!response) {
    return { status: undefined, body: undefined };
  }

  try {
    const responseToParse = typeof response.clone === 'function' ? response.clone() : response;
    const payload: unknown = await responseToParse.json();
    return {
      status: response.status,
      body: isRecord(payload) ? ApiErrorResponseFromJSON(payload) : undefined,
    };
  } catch {
    return { status: response.status, body: undefined };
  }
};

export const isExpectedShowcaseSaveError = ({ status, body }: ParsedShowcaseSaveError): boolean => {
  switch (status) {
    case 400:
      return body?.errorCategory === 'content_not_eligible';
    case 409:
      return true;
    case 429:
      return body?.failureReason === 'TooManyRequests';
    case 503:
      return body?.errorCategory === 'eligibility_dependency_unavailable';
    case 504:
      return body?.failureReason === 'InternalError';
    case undefined:
    default:
      return false;
  }
};
