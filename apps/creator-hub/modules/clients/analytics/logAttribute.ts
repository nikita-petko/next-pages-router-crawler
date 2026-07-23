import {
  LogAttributeServiceApi,
  RegexOperation,
  RegexStatus,
  type UniverseRegexHttpResponse,
  type UniverseRegexMutationHttpResponse,
} from '@rbx/client-log-attribute-http-service/v1';
import { createClientConfiguration } from '../utils/createClientConfiguration';

export { RegexOperation, RegexStatus };

export type UniverseRegex = {
  id: number;
  universeId: number;
  regexStatus: RegexStatus;
  pattern: string;
  output: string;
  order: number;
  regexOperation: RegexOperation;
  createdTime: string;
  updatedTime: string;
  matchedCount: number | null;
  sampleMessage: string | null;
};

export type FindUniverseRegexesRequest = {
  universeId: number;
  status: RegexStatus;
};

export type CreateUniverseRegexRequest = {
  universeId: number;
  pattern: string;
  output: string;
  regexOperation: RegexOperation;
};

export type UpdateUniverseRegexRequest = {
  id: number;
  pattern: string;
  output: string;
  regexOperation: RegexOperation;
};

export type DeleteUniverseRegexRequest = {
  id: number;
};

export type IgnoreUniverseRegexRequest = {
  id: number;
};

export type ReorderUniverseRegexRequest = {
  id: number;
  // 1-based target position within the (universe, status) bucket.
  order: number;
};

export type UniverseRegexMutationResponse = {
  order: number;
};

export class LogAttributeApiError extends Error {
  public readonly status: number;

  public readonly body: string;

  constructor(status: number, body: string) {
    super(`log-attribute-http-service request failed with status ${status}: ${body}`);
    this.name = 'LogAttributeApiError';
    this.status = status;
    this.body = body;
    // Ensure instanceof works reliably across TS targets.
    Object.setPrototypeOf(this, LogAttributeApiError.prototype);
  }
}

type ResponseErrorLike = {
  response: Pick<Response, 'status' | 'text'>;
};

type UniverseRegexSuggestionFields = {
  matchedCount?: unknown;
  sampleMessage?: unknown;
};

const isResponseErrorLike = (error: unknown): error is ResponseErrorLike => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    typeof error.response.status === 'number' &&
    'text' in error.response &&
    typeof error.response.text === 'function'
  );
};

const getSuggestionFields = (value: UniverseRegexHttpResponse): UniverseRegexSuggestionFields => ({
  matchedCount: 'matchedCount' in value ? value.matchedCount : undefined,
  sampleMessage: 'sampleMessage' in value ? value.sampleMessage : undefined,
});

const logAttributeServiceApi = new LogAttributeServiceApi(
  createClientConfiguration('log-attribute-http-service', 'bedev2'),
);

const unwrapLogAttributeError = async <Response>(request: Promise<Response>): Promise<Response> => {
  try {
    return await request;
  } catch (error) {
    if (isResponseErrorLike(error)) {
      const body = await error.response.text().catch(() => '');
      throw new LogAttributeApiError(error.response.status, body);
    }
    throw error;
  }
};

const normalizeTime = (value: Date | string | undefined): string | null => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' ? value : null;
};

const normalizeUniverseRegex = (value: UniverseRegexHttpResponse | null): UniverseRegex | null => {
  if (value === null) {
    return null;
  }

  const normalizedCreatedTime = normalizeTime(value.createdTime);
  const normalizedUpdatedTime = normalizeTime(value.updatedTime);
  const { matchedCount, sampleMessage } = getSuggestionFields(value);

  if (
    value.id === undefined ||
    value.universeId === undefined ||
    value.regexStatus === undefined ||
    typeof value.pattern !== 'string' ||
    typeof value.output !== 'string' ||
    value.order === undefined ||
    value.regexOperation === undefined ||
    typeof normalizedCreatedTime !== 'string' ||
    typeof normalizedUpdatedTime !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    universeId: value.universeId,
    regexStatus: value.regexStatus,
    pattern: value.pattern,
    output: value.output,
    order: value.order,
    regexOperation: value.regexOperation,
    createdTime: normalizedCreatedTime,
    updatedTime: normalizedUpdatedTime,
    matchedCount: typeof matchedCount === 'number' ? matchedCount : null,
    sampleMessage: typeof sampleMessage === 'string' ? sampleMessage : null,
  };
};

const parseMutationResponse = ({
  order,
}: UniverseRegexMutationHttpResponse): UniverseRegexMutationResponse => {
  return { order: typeof order === 'number' ? order : 0 };
};

export const findUniverseRegexes = async ({
  universeId,
  status,
}: FindUniverseRegexesRequest): Promise<UniverseRegex[]> => {
  const response = await unwrapLogAttributeError(
    logAttributeServiceApi.logAttributeServiceFind({
      universeId,
      status,
    }),
  );
  return (response.universeRegexes ?? [])
    .map(normalizeUniverseRegex)
    .filter((regex): regex is UniverseRegex => regex !== null);
};

export const createUniverseRegex = async (
  request: CreateUniverseRegexRequest,
): Promise<UniverseRegexMutationResponse> => {
  const response = await unwrapLogAttributeError(
    logAttributeServiceApi.logAttributeServiceCreate({
      logAttributeServiceCreateRequest: request,
    }),
  );
  return parseMutationResponse(response);
};

export const updateUniverseRegex = async ({
  id,
  ...request
}: UpdateUniverseRegexRequest): Promise<UniverseRegexMutationResponse> => {
  const response = await unwrapLogAttributeError(
    logAttributeServiceApi.logAttributeServiceUpdate({
      id,
      logAttributeServiceUpdateRequest: request,
    }),
  );
  return parseMutationResponse(response);
};

export const deleteUniverseRegex = async ({ id }: DeleteUniverseRegexRequest): Promise<void> => {
  await unwrapLogAttributeError(logAttributeServiceApi.logAttributeServiceDelete({ id }));
};

export const ignoreUniverseRegex = async ({ id }: IgnoreUniverseRegexRequest): Promise<void> => {
  await unwrapLogAttributeError(logAttributeServiceApi.logAttributeServiceIgnore({ id }));
};

export const reorderUniverseRegex = async ({
  id,
  order,
}: ReorderUniverseRegexRequest): Promise<UniverseRegexMutationResponse> => {
  const response = await unwrapLogAttributeError(
    logAttributeServiceApi.logAttributeServiceReorder({
      id,
      logAttributeServiceReorderRequest: { order },
    }),
  );
  return parseMutationResponse(response);
};

const logAttributeClientExports = {
  findUniverseRegexes,
  createUniverseRegex,
  updateUniverseRegex,
  deleteUniverseRegex,
  ignoreUniverseRegex,
  reorderUniverseRegex,
};

export default logAttributeClientExports;
