import type {
  CategoryGroupResponse,
  CategoryResponse,
  PresetChatStateResponse,
  PresetResponse,
} from '@modules/preset-chat/types';
import { getBEDEV2ServiceBasePath } from './utils';

const BASE_PATH = getBEDEV2ServiceBasePath('preset-chat');

function hasKeys<K extends string>(value: object, keys: K[]): value is Record<K, unknown> {
  return keys.every((k) => k in value);
}

function isPresetResponse(value: unknown): value is PresetResponse {
  if (value == null || typeof value !== 'object') {
    return false;
  }
  if (!hasKeys(value, ['id', 'value', 'state'])) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.value === 'string' &&
    typeof value.state === 'string'
  );
}

function isCategoryResponse(value: unknown): value is CategoryResponse {
  if (value == null || typeof value !== 'object') {
    return false;
  }
  if (!hasKeys(value, ['id', 'name', 'state', 'presets'])) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.state === 'string' &&
    Array.isArray(value.presets) &&
    value.presets.every(isPresetResponse)
  );
}

function isCategoryGroupResponse(value: unknown): value is CategoryGroupResponse {
  if (value == null || typeof value !== 'object') {
    return false;
  }
  if (!hasKeys(value, ['name', 'categories'])) {
    return false;
  }
  return (
    typeof value.name === 'string' &&
    Array.isArray(value.categories) &&
    value.categories.every(isCategoryResponse)
  );
}

function isPresetChatStateResponse(value: unknown): value is PresetChatStateResponse {
  if (value == null || typeof value !== 'object') {
    return false;
  }
  if (!hasKeys(value, ['overallStatus', 'categoryGroups'])) {
    return false;
  }
  return (
    typeof value.overallStatus === 'string' &&
    Array.isArray(value.categoryGroups) &&
    value.categoryGroups.every(isCategoryGroupResponse)
  );
}

export class PresetChatApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'PresetChatApiError';
    this.status = status;
  }
}

export async function getUniversePresetState(
  universeId: number,
  options?: { signal?: AbortSignal },
): Promise<PresetChatStateResponse> {
  const response = await fetch(`${BASE_PATH}/v2/creator/universe/${universeId}/preset-chat`, {
    method: 'GET',
    credentials: 'include',
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new PresetChatApiError(
      `Failed to fetch preset chat state: ${response.status}`,
      response.status,
    );
  }

  const json: unknown = await response.json();
  if (!isPresetChatStateResponse(json)) {
    throw new PresetChatApiError('Invalid preset chat state response', 500);
  }
  return json;
}
