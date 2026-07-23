import { appMetadataDefaults } from '@constants/metadata';
import { GetAdsMetadataResponseType } from '@type/metadata';
import { InBrowser } from '@utils/browser';
import { IsMetadataOverridesEnabled } from '@utils/env';

type BooleanMetadataKeys = {
  [Key in keyof GetAdsMetadataResponseType as NonNullable<
    GetAdsMetadataResponseType[Key]
  > extends boolean
    ? Key
    : never]: true;
};

export type MetadataBooleanFlagKey = keyof BooleanMetadataKeys;

type MetadataBooleanOverrides = Partial<Record<MetadataBooleanFlagKey, boolean>>;

const METADATA_BOOLEAN_OVERRIDES_STORAGE_KEY = 'adsManagerMetadataBooleanOverrides';

export const metadataBooleanFlagKeys = Object.entries(appMetadataDefaults)
  .filter(([, value]) => typeof value === 'boolean')
  .map(([key]) => key as MetadataBooleanFlagKey)
  .sort((a, b) => a.localeCompare(b));

const isMetadataBooleanFlagKey = (key: string): key is MetadataBooleanFlagKey =>
  metadataBooleanFlagKeys.includes(key as MetadataBooleanFlagKey);

const areMetadataOverridesAllowed = (): boolean => InBrowser() && IsMetadataOverridesEnabled();

const sanitizeOverrides = (
  raw: Record<string, unknown> | null | undefined,
): MetadataBooleanOverrides => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const sanitized: MetadataBooleanOverrides = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (isMetadataBooleanFlagKey(key) && typeof value === 'boolean') {
      sanitized[key] = value;
    }
  });

  return sanitized;
};

const readOverridesFromStorage = (): MetadataBooleanOverrides => {
  if (!areMetadataOverridesAllowed()) {
    return {};
  }

  const rawSettings = window.localStorage.getItem(METADATA_BOOLEAN_OVERRIDES_STORAGE_KEY);
  if (!rawSettings) {
    return {};
  }

  try {
    return sanitizeOverrides(JSON.parse(rawSettings) as Record<string, unknown>);
  } catch {
    return {};
  }
};

const writeOverridesToStorage = (overrides: MetadataBooleanOverrides): void => {
  if (!areMetadataOverridesAllowed()) {
    return;
  }

  if (Object.keys(overrides).length === 0) {
    window.localStorage.removeItem(METADATA_BOOLEAN_OVERRIDES_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(METADATA_BOOLEAN_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
};

export const getMetadataBooleanOverrides = (): MetadataBooleanOverrides =>
  readOverridesFromStorage();

export const setMetadataBooleanOverride = (
  key: MetadataBooleanFlagKey,
  value: boolean | null,
): MetadataBooleanOverrides => {
  if (!areMetadataOverridesAllowed()) {
    return {};
  }

  const nextOverrides = { ...readOverridesFromStorage() };

  if (value === null) {
    delete nextOverrides[key];
  } else {
    nextOverrides[key] = value;
  }

  writeOverridesToStorage(nextOverrides);
  return nextOverrides;
};

export const clearAllMetadataBooleanOverrides = (): void => {
  if (!areMetadataOverridesAllowed()) {
    return;
  }

  writeOverridesToStorage({});
};

export const applyMetadataBooleanOverrides = (
  metadata: GetAdsMetadataResponseType,
): GetAdsMetadataResponseType => {
  if (!areMetadataOverridesAllowed()) {
    return metadata;
  }

  const overrides = readOverridesFromStorage();

  if (Object.keys(overrides).length === 0) {
    return metadata;
  }

  return {
    ...metadata,
    ...overrides,
  };
};

export const mergeMetadataDefaultsWithResponse = (
  metaDataResponse: GetAdsMetadataResponseType,
): GetAdsMetadataResponseType => ({ ...appMetadataDefaults, ...metaDataResponse });
