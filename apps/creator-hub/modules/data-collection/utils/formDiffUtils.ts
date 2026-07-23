import type { PreferenceConfiguration } from '@rbx/client-resource-settings-api/v1';
import { DataSharingLicenseType, PreferenceType } from '@rbx/client-resource-settings-api/v1';
import DataSharingDefaultSettingsKey from '../enums/DataSharingDefaultSettingsKey';

export enum DataSharingEntityType {
  Experience = 'Experience',
  CreatorStoreAsset = 'CreatorStoreAsset',
  AvatarAsset = 'AvatarAsset',
  AvatarBundle = 'AvatarBundle',
  LuauDataset = 'LuauDataset',
}

export const getFormRowKey = (entityType: DataSharingEntityType, entityId: string | number) =>
  `${entityType}*${entityId}*selected`;

export const splitFormKey = (formKey: string) => formKey.split('*');

export function toDataSharingDefaultSettingsKey(preference: PreferenceType) {
  switch (preference) {
    case PreferenceType.Universes:
      return DataSharingDefaultSettingsKey.Experiences;
    case PreferenceType.AvatarBundles:
      return DataSharingDefaultSettingsKey.AvatarItems;
    case PreferenceType.CreatorStoreAssets:
      return DataSharingDefaultSettingsKey.CreatorStore;
    default:
      throw new Error(`Unknown preference type: ${preference}`);
  }
}

export function toPreferenceType(key: DataSharingDefaultSettingsKey) {
  switch (key) {
    case DataSharingDefaultSettingsKey.Experiences:
      return PreferenceType.Universes;
    case DataSharingDefaultSettingsKey.AvatarItems:
      return PreferenceType.AvatarBundles;
    case DataSharingDefaultSettingsKey.CreatorStore:
      return PreferenceType.CreatorStoreAssets;
    default: {
      const exhaustiveCheck: never = key;
      throw new Error(`Unknown settings key: ${exhaustiveCheck}`);
    }
  }
}

export function getChangedData(
  initialValues: Record<string, boolean>,
  currentValues: Record<string, boolean>,
): Record<string, boolean> {
  const changedDataSharingValues = Object.entries(currentValues).reduce(
    (acc, [key, value]) => {
      if (initialValues[key] !== value) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, boolean>,
  );

  const defaultSettings = Object.values(DataSharingDefaultSettingsKey);
  defaultSettings.forEach((key) => {
    if (key in changedDataSharingValues) {
      delete changedDataSharingValues[key];
    }
  });

  return changedDataSharingValues;
}

export type ChangedDataCount = {
  [key in DataSharingEntityType]: number;
};
export function getSharedAndUnsharedCounts(
  initialValues: Record<string, boolean>,
  currentValues: Record<string, boolean>,
): {
  shared: ChangedDataCount;
  unshared: ChangedDataCount;
} {
  const changedDataSharingValues = getChangedData(initialValues, currentValues);
  const shared: ChangedDataCount = {} as ChangedDataCount;
  const unshared: ChangedDataCount = {} as ChangedDataCount;

  Object.entries(changedDataSharingValues).forEach(([formKey, isSelected]) => {
    const [dataType, , property] = splitFormKey(formKey);
    if (
      property !== 'selected' ||
      !Object.values(DataSharingEntityType).includes(dataType as DataSharingEntityType)
    ) {
      throw new Error(`Invalid form key for entity: ${formKey}`);
    }
    const dataTypeAsKey: DataSharingEntityType = dataType as DataSharingEntityType;
    if (isSelected) {
      shared[dataTypeAsKey] = (shared[dataTypeAsKey] || 0) + 1;
    } else {
      unshared[dataTypeAsKey] = (unshared[dataTypeAsKey] || 0) + 1;
    }
  });

  return {
    shared,
    unshared,
  };
}

export function getDefaultPreferencesFromForm(currentValues: Record<string, boolean>) {
  const defaultSettings = Object.values(DataSharingDefaultSettingsKey);
  return defaultSettings.reduce((acc, key: DataSharingDefaultSettingsKey) => {
    if (currentValues[key] !== undefined) {
      acc.push({
        type: toPreferenceType(key),
        isOptOut: !currentValues[key],
      });
    }
    return acc;
  }, [] as PreferenceConfiguration[]);
}

export function parseFormDataToConfigurations(
  initialValues: Record<string, boolean>,
  formData: Record<string, boolean>,
) {
  const changedDataSharingValues = getChangedData(initialValues, formData);

  const universeConfigurations: Record<string, Set<DataSharingLicenseType>> = {};
  const avatarAssetConfigurations: Record<string, Set<DataSharingLicenseType>> = {};
  const avatarBundleConfigurations: Record<string, Set<DataSharingLicenseType>> = {};
  const assetConfigurations: Record<string, Set<DataSharingLicenseType>> = {};

  Object.entries(changedDataSharingValues).forEach(([formKey, isSelected]) => {
    const [entityType, entityId, property] = splitFormKey(formKey);
    if (property !== 'selected') {
      return;
    }

    if (
      !universeConfigurations[entityId] &&
      (entityType === DataSharingEntityType.Experience ||
        entityType === DataSharingEntityType.LuauDataset)
    ) {
      universeConfigurations[entityId] = new Set();
      const initialExperienceKey = getFormRowKey(DataSharingEntityType.Experience, entityId);
      const initialLuauDatasetKey = getFormRowKey(DataSharingEntityType.LuauDataset, entityId);
      if (initialExperienceKey in initialValues && initialValues[initialExperienceKey]) {
        universeConfigurations[entityId].add(DataSharingLicenseType.RobloxGlobal);
      }
      if (initialLuauDatasetKey in initialValues && initialValues[initialLuauDatasetKey]) {
        universeConfigurations[entityId].add(DataSharingLicenseType.Public);
      }
    }

    if (!avatarAssetConfigurations[entityId] && entityType === DataSharingEntityType.AvatarAsset) {
      avatarAssetConfigurations[entityId] = new Set();
    }

    if (
      !avatarBundleConfigurations[entityId] &&
      entityType === DataSharingEntityType.AvatarBundle
    ) {
      avatarBundleConfigurations[entityId] = new Set();
    }

    if (!assetConfigurations[entityId] && entityType === DataSharingEntityType.CreatorStoreAsset) {
      assetConfigurations[entityId] = new Set();
    }

    if (isSelected) {
      switch (entityType) {
        case DataSharingEntityType.Experience:
          universeConfigurations[entityId].add(DataSharingLicenseType.RobloxGlobal);
          break;
        case DataSharingEntityType.LuauDataset:
          universeConfigurations[entityId].add(DataSharingLicenseType.Public);
          break;
        case DataSharingEntityType.AvatarAsset:
          avatarAssetConfigurations[entityId].add(DataSharingLicenseType.RobloxGlobal);
          break;
        case DataSharingEntityType.AvatarBundle:
          avatarBundleConfigurations[entityId].add(DataSharingLicenseType.RobloxGlobal);
          break;
        case DataSharingEntityType.CreatorStoreAsset:
          assetConfigurations[entityId].add(DataSharingLicenseType.RobloxGlobal);
          break;
        default:
          break;
      }
    } else if (entityType === DataSharingEntityType.Experience) {
      universeConfigurations[entityId].delete(DataSharingLicenseType.RobloxGlobal);
    } else if (entityType === DataSharingEntityType.LuauDataset) {
      universeConfigurations[entityId].delete(DataSharingLicenseType.Public);
    }
  });

  return {
    universeConfigurations,
    avatarAssetConfigurations,
    avatarBundleConfigurations,
    assetConfigurations,
  };
}
