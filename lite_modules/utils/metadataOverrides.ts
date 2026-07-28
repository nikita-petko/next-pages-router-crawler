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
  .filter(([key, value]) => key !== 'enableFrontendDevTools' && typeof value === 'boolean')
  .map(([key]) => key as MetadataBooleanFlagKey)
  .sort((a, b) => a.localeCompare(b));

const isMetadataBooleanFlagKey = (key: string): key is MetadataBooleanFlagKey =>
  metadataBooleanFlagKeys.includes(key as MetadataBooleanFlagKey);

const areMetadataOverridesAllowed = (enableFrontendDevTools = false): boolean =>
  InBrowser() && IsMetadataOverridesEnabled(enableFrontendDevTools);

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

const readOverridesFromStorage = (enableFrontendDevTools = false): MetadataBooleanOverrides => {
  if (!areMetadataOverridesAllowed(enableFrontendDevTools)) {
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

const writeOverridesToStorage = (
  overrides: MetadataBooleanOverrides,
  enableFrontendDevTools = false,
): void => {
  if (!areMetadataOverridesAllowed(enableFrontendDevTools)) {
    return;
  }

  if (Object.keys(overrides).length === 0) {
    window.localStorage.removeItem(METADATA_BOOLEAN_OVERRIDES_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(METADATA_BOOLEAN_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
};

export const getMetadataBooleanOverrides = (
  enableFrontendDevTools = false,
): MetadataBooleanOverrides => readOverridesFromStorage(enableFrontendDevTools);

export const setMetadataBooleanOverride = (
  key: MetadataBooleanFlagKey,
  value: boolean | null,
  enableFrontendDevTools = false,
): MetadataBooleanOverrides => {
  if (!areMetadataOverridesAllowed(enableFrontendDevTools)) {
    return {};
  }

  const nextOverrides = { ...readOverridesFromStorage(enableFrontendDevTools) };

  if (value === null) {
    delete nextOverrides[key];
  } else {
    nextOverrides[key] = value;
  }

  writeOverridesToStorage(nextOverrides, enableFrontendDevTools);
  return nextOverrides;
};

export const clearAllMetadataBooleanOverrides = (enableFrontendDevTools = false): void => {
  if (!areMetadataOverridesAllowed(enableFrontendDevTools)) {
    return;
  }

  writeOverridesToStorage({}, enableFrontendDevTools);
};

export const applyMetadataBooleanOverrides = (
  metadata: GetAdsMetadataResponseType,
): GetAdsMetadataResponseType => {
  const enableFrontendDevTools = metadata.enableFrontendDevTools === true;
  if (!areMetadataOverridesAllowed(enableFrontendDevTools)) {
    return metadata;
  }

  const overrides = readOverridesFromStorage(enableFrontendDevTools);

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
