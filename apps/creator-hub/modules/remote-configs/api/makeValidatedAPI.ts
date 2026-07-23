import {
  ConfigEntry as DangerousConfigEntry,
  ConfigEntryOverride as DangerousConfigEntryOverride,
  ConfigEntryStaged as DangerousConfigEntryStaged,
  GetLatestConfigurationResponse as DangerousGetLatestConfigurationResponse,
  GetStagedChangesResponse as DangerousGetStagedChangesResponse,
  PublishingMetadata as DangerousPublishingMetadata,
  ConfigChangeResult as DangerousConfigChangeResult,
  ChangelogEntry as DangerousChangelogEntry,
  ConfigEntryChange as DangerousConfigEntryChange,
  UniverseConfigsWebAPIApi,
  V1DraftUniversesUniverseIdPostRequest,
  V1DraftUniversesUniverseIdPutRequest,
  V1DraftUniversesUniverseIdGetRequest,
  V1DraftUniversesUniverseIdPublishPostRequest,
  V1DraftUniversesUniverseIdForcePostRequest,
  V1DraftUniversesUniverseIdDeleteRequest,
  V1DraftUniversesUniverseIdCancelPostRequest,
  V1ChangelogUniversesUniverseIdGetRequest,
  V1ChangelogUniversesUniverseIdEntryChangelogEntryIdRestorePostRequest,
  V2DraftUniversesUniverseIdDeleteRequest,
  V2DraftUniversesUniverseIdConditionPutRequest,
  V2DraftUniversesUniverseIdRuleOrderingPutRequest,
  V2DraftUniversesUniverseIdPostRequest,
  V2DraftUniversesUniverseIdPutRequest,
} from '@modules/clients/analytics/universeConfigs';
import { logAnalyticsError } from '@modules/charts-generic';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { DeploymentResult } from '@rbx/clients/creatorConfigsApi/v100';
import { ConfigType } from '@rbx/clients/universeConfigsWebApi';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  ValidRemoteConfigAPI,
  ValidConfigEntryStaged,
  ValidGetStagedChangesResponse,
  ValidPublishingMetadata,
  ValidDeletedConfigEntryOverride,
  ValidCancelPublishingResponse,
  ValidDiscardStagedChangesResponse,
  ValidForcePublishingResponse,
  ValidCreateConfigurationResponse,
  ValidPublishStagedChangesResponse,
  ValidUpdateConfigurationResponse,
  ValidGetLatestConfigurationResponse,
  InternalConfigurationsUniversesUniverseIdLatestGetRequest,
  InternalDraftUniversesUniverseIdCancelPostRequest,
  InternalDraftUniversesUniverseIdDeleteRequest,
  InternalV2DraftUniversesUniverseIdDeleteRequest,
  InternalDraftUniversesUniverseIdForcePostRequest,
  InternalDraftUniversesUniverseIdGetRequest,
  InternalDraftUniversesUniverseIdPostRequest,
  InternalDraftUniversesUniverseIdPublishPostRequest,
  InternalDraftUniversesUniverseIdPutRequest,
  InternalV2DraftUniversesUniverseIdPostRequest,
  InternalV2DraftUniversesUniverseIdPutRequest,
  InternalV2DraftUniversesUniverseIdConditionPutRequest,
  ValidConfigEntryValue,
  ValidConfigEntry,
  InternalChangelogUniversesUniverseIdGetRequest,
  ValidGetConfigurationHistoryResponse,
  ValidConfigChangeResult,
  ValidChangelogEntry,
  ValidConfigEntryChange,
  ValidNonDeletedConfigEntryOverride,
  ValidRestoreChangelogEntryResponse,
  ValidUpdateConditionResult,
  ValidUpdateRuleOrderingResult,
  InternalV2DraftUniversesUniverseIdRuleOrderingPutRequest,
  InternalChangelogUniversesUniverseIdEntryChangelogEntryIdRestorePostRequest,
  ValidConfigEntryInfo,
  ValidRuleOrdering,
  ValidConditionRule,
} from './validTypes';
import { ValidConfigEntryValueType, RpnOperator } from './universeConfigsClientEnums';

/**
 * This is an explicit any from the OpenAPI codegen, so it's extremely dangerous.
 * To wit, it can be used as a ValidConfigEntryValue, which it never fits.
 *
 * Since it's the base of all our ConfigEntry types, they are all dangerous.
 */
type DangerousConfigEntryValue = DangerousConfigEntry['entryValue'];
type DangerousValueConfigEntry = Omit<DangerousConfigEntry, 'configType'> & {
  configType?: typeof ConfigType.Value | typeof ConfigType.Invalid;
};
type DangerousConditionalConfigEntry = Omit<DangerousConfigEntry, 'configType'> & {
  configType: typeof ConfigType.Conditional;
};
type DangerousRuleConfigEntry = Omit<DangerousConfigEntry, 'configType'> & {
  configType: typeof ConfigType.Rule;
};
type DangerousRuleOrderingConfigEntry = Omit<DangerousConfigEntry, 'configType'> & {
  configType: typeof ConfigType.RuleOrdering;
};

export const isDangerousValueConfigEntry = (
  entry: DangerousConfigEntry,
): entry is DangerousValueConfigEntry => {
  // Treat entry as a "value" entry if its config type is undefined, "invalid", or "value"
  // This provides backwards compatibility with previous formats
  return (
    entry.configType === undefined ||
    entry.configType === ConfigType.Value ||
    entry.configType === ConfigType.Invalid
  );
};

const isDangerousConditionalConfigEntry = (
  entry: DangerousConfigEntry,
): entry is DangerousConditionalConfigEntry => {
  return entry.configType === ConfigType.Conditional;
};

const isDangerousRuleConfigEntry = (
  entry: DangerousConfigEntry,
): entry is DangerousRuleConfigEntry => {
  return entry.configType === ConfigType.Rule;
};

const isDangerousRuleOrderingConfigEntry = (
  entry: DangerousConfigEntry,
): entry is DangerousRuleOrderingConfigEntry => {
  return entry.configType === ConfigType.RuleOrdering;
};

const toValidConfigEntryValue = (entryValue: DangerousConfigEntryValue): ValidConfigEntryValue => {
  if (entryValue === null || entryValue === undefined) {
    throw new Error('null ConfigEntryValue cannot be converted to ValidConfigEntryValue');
  }
  if (typeof entryValue === 'string') {
    return {
      valueType: ValidConfigEntryValueType.String,
      stringValue: entryValue,
    };
  }
  if (typeof entryValue === 'boolean') {
    return {
      valueType: ValidConfigEntryValueType.Boolean,
      boolValue: entryValue,
    };
  }
  if (typeof entryValue === 'number') {
    return {
      valueType: ValidConfigEntryValueType.Number,
      numberValue: entryValue,
    };
  }
  return {
    valueType: ValidConfigEntryValueType.Json,
    jsonValue: JSON.stringify(entryValue),
  };
};

const toValidConditionalEntryData = (
  entry: DangerousConditionalConfigEntry,
): {
  key: string;
  conditionName: string;
  entryValue: ValidConfigEntryValue;
} => {
  if (!entry.key) {
    throw new Error('ConfigEntry key is required');
  }
  const conditionName = entry.conditionalValueData?.conditionName;
  if (!conditionName) {
    throw new Error('ConfigEntry Conditional config type requires a condition name');
  }
  return {
    key: entry.key,
    conditionName,
    entryValue: toValidConfigEntryValue(entry.entryValue),
  };
};

export const toValidConfigEntry = (entry: DangerousValueConfigEntry): ValidConfigEntry => {
  if (!entry.key) {
    throw new Error('ConfigEntry key is required');
  }
  return {
    key: entry.key,
    entryValue: toValidConfigEntryValue(entry.entryValue),
    description: entry.description,
  };
};

const toValidChangelogConfigEntry = (entry: DangerousConfigEntry): ValidConfigEntry => {
  if (!entry.key) {
    throw new Error('ConfigEntry key is required');
  }

  // History rows should render all config types. For rules and rule ordering, prefer
  // structured fields so the table can display JSON/code diffs instead of opaque strings.
  let changelogEntryValue = entry.entryValue;
  if (isDangerousRuleConfigEntry(entry)) {
    changelogEntryValue = entry.ruleData?.rule ?? entry.entryValue;
  } else if (isDangerousRuleOrderingConfigEntry(entry)) {
    changelogEntryValue = entry.ruleOrderingData?.conditionOrder ?? entry.entryValue;
  }

  return {
    key: entry.key,
    entryValue: toValidConfigEntryValue(changelogEntryValue),
    description: entry.description,
  };
};

// Workaround: API sometimes sends "1970-01-01T00:00:00Z" when it should send undefined.
const normalizeEpochDate = (dateString?: string) =>
  dateString === '1970-01-01T00:00:00Z' ? undefined : dateString;

const toValidDeletedConfigEntryOverride = (
  dangerousDeletedConfigEntryOverride: DangerousConfigEntryOverride,
): ValidDeletedConfigEntryOverride => {
  const { entry: dangerousEntry } = dangerousDeletedConfigEntryOverride;
  if (!dangerousEntry?.key) {
    throw new Error('DeletedConfigEntryOverride requires an entry (at least with a key)');
  }
  return { entry: { key: dangerousEntry.key } };
};

const toValidNonDeletedConfigEntryOverride = (
  dangerousOverrideEntry: DangerousConfigEntryOverride,
): ValidNonDeletedConfigEntryOverride => {
  const { entry: dangerousEntry, lastModifiedTime } = dangerousOverrideEntry;
  if (lastModifiedTime) {
    if (!dangerousEntry) {
      throw new Error('ConfigEntryOverride entry is required if lastModifiedTime is present');
    }
    if (!isDangerousValueConfigEntry(dangerousEntry)) {
      throw new Error(
        `Unsupported non-value ConfigType in value conversion: ${String(dangerousEntry.configType)}`,
      );
    }
    return {
      lastModifiedTime,
      entry: toValidConfigEntry(dangerousEntry),
    };
  }
  if (!dangerousEntry) {
    throw new Error('ConfigEntryOverride requires an entry (at least with a key)');
  }
  if (!isDangerousValueConfigEntry(dangerousEntry)) {
    throw new Error(
      `Unsupported non-value ConfigType in value conversion: ${String(dangerousEntry.configType)}`,
    );
  }
  return {
    entry: toValidConfigEntry(dangerousEntry),
    lastModifiedTime,
  };
};

const toValidConfigEntryStaged = (
  dangerousConfigEntryStaged: DangerousConfigEntryStaged,
): ValidConfigEntryStaged | null => {
  const {
    isPublishing: isPublishingGiven,
    isDeleted,
    overrideEntry,
    currentValue: currentValueGiven,
  } = dangerousConfigEntryStaged;
  const isPublishing = isPublishingGiven ?? false;
  const currentValue =
    currentValueGiven != null ? toValidConfigEntryValue(currentValueGiven) : null;
  // currentValue would be null if it is a newly created override
  if (!overrideEntry) {
    logAnalyticsError(
      'ConfigEntryStaged isDeleted is true but overrideEntry is missing, we have no way of finding the key',
    );
    return null;
  }

  if (isDeleted || overrideEntry.entry?.entryValue == null) {
    if (!currentValue) {
      // cannot have a deleted entry without something to delete
      logAnalyticsError('ConfigEntryStaged isDeleted is true but currentValue is missing');
      // but we'll just ignore these if they happen to come from the API
      return null;
    }
    try {
      const validatedOverrideEntry = toValidDeletedConfigEntryOverride(overrideEntry);
      return {
        isDeleted: true,
        isPublishing,
        currentValue,
        overrideEntry: validatedOverrideEntry,
      };
    } catch (err) {
      // we need to just ignore if we can't figure out the key
      logAnalyticsError(`Error validating ConfigEntryStaged overrideEntry: ${err}`);
      return null;
    }
  }

  const validatedOverrideEntry = toValidNonDeletedConfigEntryOverride(overrideEntry);
  return {
    isDeleted: false,
    isPublishing,
    overrideEntry: validatedOverrideEntry,
    currentValue,
  };
};

const toValidConditionRule = (entry: DangerousRuleConfigEntry): ValidConditionRule => {
  const conditionKey = entry?.key;
  if (!conditionKey) {
    throw new Error('ConfigEntry Rule config type requires a key');
  }

  const tokens = entry?.ruleData?.rule?.tokens;
  if (!tokens) {
    throw new Error('ConfigEntry Rule config type requires tokens');
  }

  const validatedTokens: ValidConditionRule['tokens'] = tokens.map(({ operand, operator }) => {
    if (operand) {
      const attributeReference = operand?.attributeReference;
      if (attributeReference) {
        if (!isValidEnumValue(RAQIV2Dimension, attributeReference)) {
          throw new Error(`Invalid dimension: ${attributeReference}`);
        }
        return {
          type: 'dimension',
          dimension: attributeReference,
        };
      }

      const literalValue = operand?.literalValue;
      if (literalValue) {
        const value =
          literalValue.stringValue ??
          literalValue.integerValue ??
          literalValue.doubleValue ??
          literalValue.booleanValue;
        if (value === undefined) {
          throw new Error('Invalid literal value');
        }
        return {
          type: 'dimensionValue',
          value,
        };
      }

      throw new Error('Invalid operand');
    }

    if (operator) {
      if (!isValidEnumValue(RpnOperator, operator)) {
        throw new Error(`Invalid operator: ${operator}`);
      }
      return {
        type: 'operator',
        operator,
      };
    }

    throw new Error('Invalid RpnToken');
  });

  return {
    conditionKey,
    tokens: validatedTokens,
  };
};

const toValidRuleOrdering = (entry: DangerousRuleOrderingConfigEntry): ValidRuleOrdering => {
  const conditionOrder = entry?.ruleOrderingData?.conditionOrder;
  if (!conditionOrder) {
    throw new Error('ConfigEntry RuleOrdering config type requires conditionOrder');
  }

  return {
    conditionOrder,
  };
};

const toValidGetLatestConfigurationResponse = (
  dangerousResponse: DangerousGetLatestConfigurationResponse,
): ValidGetLatestConfigurationResponse => {
  if (!dangerousResponse.configVersion) {
    throw new Error('GetLatestConfigurationResponse configVersion is missing');
  }

  const validatedEntriesByKey: Map<string, ValidConfigEntryInfo> = new Map();
  const pendingConditionValuesByKey: Map<string, Map<string, ValidConfigEntryValue>> = new Map();
  let validatedRuleOrderingEntry: ValidRuleOrdering | undefined;
  const validatedRules: Map<string, ValidConditionRule> = new Map();

  dangerousResponse.entries?.forEach((entryInfo) => {
    const { entry } = entryInfo;
    if (!entry) {
      throw new Error('ConfigEntryInfo entry is required');
    }

    if (isDangerousValueConfigEntry(entry)) {
      const validatedEntryInfo: ValidConfigEntryInfo = {
        entry: toValidConfigEntry(entry),
        lastModifiedTime: normalizeEpochDate(entryInfo.lastModifiedTime),
        lastAccessedTime: normalizeEpochDate(entryInfo.lastAccessedTime),
      };
      const { key } = validatedEntryInfo.entry;
      const existingConditionValues = validatedEntriesByKey.get(key)?.entry.conditionValue;
      const pendingConditionValues = pendingConditionValuesByKey.get(key);
      if (pendingConditionValues) {
        validatedEntryInfo.entry.conditionValue = existingConditionValues
          ? new Map<string, ValidConfigEntryValue>([
              ...existingConditionValues,
              ...pendingConditionValues,
            ])
          : pendingConditionValues;
        pendingConditionValuesByKey.delete(key);
      } else if (existingConditionValues) {
        validatedEntryInfo.entry.conditionValue = existingConditionValues;
      }

      validatedEntriesByKey.set(key, validatedEntryInfo);
      return;
    }

    if (isDangerousConditionalConfigEntry(entry)) {
      const { key, conditionName, entryValue } = toValidConditionalEntryData(entry);
      const existingValidatedEntry = validatedEntriesByKey.get(key);
      if (existingValidatedEntry) {
        if (!existingValidatedEntry.entry.conditionValue) {
          existingValidatedEntry.entry.conditionValue = new Map();
        }
        existingValidatedEntry.entry.conditionValue.set(conditionName, entryValue);
        return;
      }
      const pendingConditionValues = pendingConditionValuesByKey.get(key) ?? new Map();
      pendingConditionValues.set(conditionName, entryValue);
      pendingConditionValuesByKey.set(key, pendingConditionValues);
      return;
    }

    if (isDangerousRuleConfigEntry(entry)) {
      if (!entry.key) {
        throw new Error('Rule config type requires a key');
      }
      validatedRules.set(entry.key, toValidConditionRule(entry));
      return;
    }

    if (isDangerousRuleOrderingConfigEntry(entry)) {
      validatedRuleOrderingEntry = toValidRuleOrdering(entry);
      return;
    }

    throw new Error(`Unknown ConfigType: ${String(entry.configType)}`);
  });

  if (pendingConditionValuesByKey.size > 0) {
    const keysWithoutBase = Array.from(pendingConditionValuesByKey.keys()).join(', ');
    throw new Error(
      `Conditional config type requires a matching non-conditional entry for key(s): ${keysWithoutBase}`,
    );
  }
  const validatedEntries =
    dangerousResponse.entries === undefined
      ? undefined
      : Array.from(validatedEntriesByKey.values());

  return {
    configVersion: dangerousResponse.configVersion,
    // entries might be missing if the config version is the latest
    entries: validatedEntries,
    ruleOrdering: validatedRuleOrderingEntry,
    rules: validatedRules,
  };
};

const toValidPublishingMetadata = (
  dangerousPublishingMetadata: DangerousPublishingMetadata | undefined,
): ValidPublishingMetadata | undefined => {
  if (!dangerousPublishingMetadata) {
    return undefined;
  }
  const { draftHash, publishingCountTotal, estimatedCompletionTime } = dangerousPublishingMetadata;
  if (!draftHash || !publishingCountTotal || !estimatedCompletionTime) {
    return undefined;
  }
  return {
    draftHash,
    publishingCountTotal,
    estimatedCompletionTime,
  };
};

class GetThemFromPublishedEntriesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GetThemFromPublishedEntriesError';
  }
}

const toValidGetStagedChangesResponse = (
  dangerousResponse: DangerousGetStagedChangesResponse,
  publishedEntries?: ValidConfigEntryInfo[],
): ValidGetStagedChangesResponse => {
  const {
    entries: dangerousEntries,
    draftHash,
    publishingMetadata: publishingMetadataGiven,
  } = dangerousResponse;
  if (!draftHash || !dangerousEntries) {
    return {};
  }

  const entries: ValidConfigEntryStaged[] = [];
  const nonDeletedEntryIndexByKey: Map<string, number> = new Map();
  const pendingConditionValuesByKey: Map<string, Map<string, ValidConfigEntryValue>> = new Map();
  let validatedRuleOrderingEntry: ValidRuleOrdering | undefined;
  const validatedRules: Map<string, ValidConditionRule> = new Map();

  dangerousEntries.forEach((entry) => {
    const dangerousOverrideEntry = entry.overrideEntry?.entry;
    if (!entry.isDeleted && dangerousOverrideEntry) {
      if (isDangerousConditionalConfigEntry(dangerousOverrideEntry)) {
        const { key, conditionName, entryValue } =
          toValidConditionalEntryData(dangerousOverrideEntry);
        const existingEntryIndex = nonDeletedEntryIndexByKey.get(key);
        if (existingEntryIndex === undefined) {
          const pendingConditionValues = pendingConditionValuesByKey.get(key) ?? new Map();
          pendingConditionValues.set(conditionName, entryValue);
          pendingConditionValuesByKey.set(key, pendingConditionValues);
          return;
        }
        const existingEntry = entries[existingEntryIndex];
        if (!existingEntry || existingEntry.isDeleted) {
          throw new Error('Conditional staged entry requires a non-deleted base entry');
        }
        if (!existingEntry.overrideEntry.entry.conditionValue) {
          existingEntry.overrideEntry.entry.conditionValue = new Map();
        }
        existingEntry.overrideEntry.entry.conditionValue.set(conditionName, entryValue);
        return;
      }

      if (isDangerousRuleConfigEntry(dangerousOverrideEntry)) {
        if (!dangerousOverrideEntry.key) {
          throw new Error('Rule config type requires a key');
        }
        validatedRules.set(
          dangerousOverrideEntry.key,
          toValidConditionRule(dangerousOverrideEntry),
        );
        return;
      }

      if (isDangerousRuleOrderingConfigEntry(dangerousOverrideEntry)) {
        validatedRuleOrderingEntry = toValidRuleOrdering(dangerousOverrideEntry);
        return;
      }
    }

    const validatedEntry = toValidConfigEntryStaged(entry);
    if (validatedEntry) {
      if (validatedEntry.isDeleted) {
        entries.push(validatedEntry);
        return;
      }

      const { key } = validatedEntry.overrideEntry.entry;
      const existingEntryIndex = nonDeletedEntryIndexByKey.get(key);
      let existingConditionValues: Map<string, ValidConfigEntryValue> | undefined;
      if (existingEntryIndex !== undefined) {
        const existingEntry = entries[existingEntryIndex];
        if (!existingEntry.isDeleted) {
          existingConditionValues = existingEntry.overrideEntry.entry.conditionValue;
        }
      }
      const pendingConditionValues = pendingConditionValuesByKey.get(key);
      if (pendingConditionValues) {
        validatedEntry.overrideEntry.entry.conditionValue = existingConditionValues
          ? new Map<string, ValidConfigEntryValue>([
              ...existingConditionValues,
              ...pendingConditionValues,
            ])
          : pendingConditionValues;
        pendingConditionValuesByKey.delete(key);
      } else if (existingConditionValues) {
        validatedEntry.overrideEntry.entry.conditionValue = existingConditionValues;
      }

      if (existingEntryIndex === undefined) {
        entries.push(validatedEntry);
        nonDeletedEntryIndexByKey.set(key, entries.length - 1);
      } else {
        entries[existingEntryIndex] = validatedEntry;
      }
    }
  });

  if (pendingConditionValuesByKey.size > 0) {
    // Draft/staged payloads can include only conditional updates for a key (no base value entry).
    // For those keys, hydrate from the latest published base entry and merge in the pending
    // conditional deltas so the staged table still gets a complete, valid entry.
    const publishedEntriesByKey: Map<string, ValidConfigEntryInfo> = new Map(
      (publishedEntries ?? []).map((entryInfo) => [entryInfo.entry.key, entryInfo]),
    );

    if (publishedEntriesByKey.size > 0) {
      pendingConditionValuesByKey.forEach((pendingConditionValues, key) => {
        const publishedEntryInfo = publishedEntriesByKey.get(key);
        if (publishedEntryInfo) {
          const { entry: publishedEntry, lastModifiedTime } = publishedEntryInfo;
          const mergedConditionValues = publishedEntry.conditionValue
            ? new Map<string, ValidConfigEntryValue>([
                ...publishedEntry.conditionValue,
                ...pendingConditionValues,
              ])
            : pendingConditionValues;
          entries.push({
            isDeleted: false,
            isPublishing: false,
            currentValue: publishedEntry.entryValue,
            overrideEntry: {
              entry: {
                ...publishedEntry,
                conditionValue: mergedConditionValues,
              },
              lastModifiedTime,
            },
          });
          pendingConditionValuesByKey.delete(key);
        }
      });
    }

    if (pendingConditionValuesByKey.size > 0) {
      const keysWithoutBase = Array.from(pendingConditionValuesByKey.keys()).join(', ');
      throw new GetThemFromPublishedEntriesError(
        `Conditional config type requires a matching non-conditional staged entry for key(s): ${keysWithoutBase}`,
      );
    }
  }

  return {
    entries,
    draftHash,
    publishingMetadata: toValidPublishingMetadata(publishingMetadataGiven),
    ruleOrdering: validatedRuleOrderingEntry,
    rules: validatedRules,
  };
};

const toValidConfigChangeResult = (
  dangerousResponse: DangerousConfigChangeResult | undefined,
): ValidConfigChangeResult => {
  if (!dangerousResponse) {
    throw new Error('ConfigChangeResult is missing');
  }
  const { isError, data, error } = dangerousResponse;
  if (isError) {
    const errorCode = error?.errorCode;
    if (!errorCode) {
      throw new Error('ConfigChangeResult isError is true but error code is missing');
    }
    return {
      isError,
      error: { errorCode },
    };
  }
  return { isError: false, data: { draftHash: data?.draftHash } };
};

const toValidConfigEntryChange = (
  dangerousConfigEntryChange: DangerousConfigEntryChange,
): ValidConfigEntryChange => {
  let current: ValidConfigEntry | undefined;
  if (
    !dangerousConfigEntryChange.isCurrentDeleted &&
    dangerousConfigEntryChange.current?.entryValue != null
  ) {
    current = toValidChangelogConfigEntry(dangerousConfigEntryChange.current);
  }

  let before: ValidConfigEntry | undefined;
  if (
    !dangerousConfigEntryChange.isBeforeDeleted &&
    dangerousConfigEntryChange.before?.entryValue != null
  ) {
    before = toValidChangelogConfigEntry(dangerousConfigEntryChange.before);
  }

  return {
    current,
    isCurrentDeleted: dangerousConfigEntryChange.isCurrentDeleted,
    before,
    isBeforeDeleted: dangerousConfigEntryChange.isBeforeDeleted,
  };
};

const toValidChangelogEntry = (
  dangerousChangelogEntry: DangerousChangelogEntry,
): ValidChangelogEntry => {
  if (
    dangerousChangelogEntry.changelogEntryId === undefined ||
    !dangerousChangelogEntry.time ||
    !dangerousChangelogEntry.publishedBy ||
    dangerousChangelogEntry.version === undefined
  ) {
    throw new Error('ChangelogEntry changelogEntryId, time, publishedBy, and version are required');
  }
  return {
    changelogEntryId: dangerousChangelogEntry.changelogEntryId,
    time: dangerousChangelogEntry.time,
    publishedBy: Number(dangerousChangelogEntry.publishedBy), // ??? endpoint returns publishedBy as string?
    version: `${dangerousChangelogEntry.version}`,
    message: dangerousChangelogEntry.message,
    changes: dangerousChangelogEntry.changes?.map(toValidConfigEntryChange),
    cancelled: dangerousChangelogEntry.deploymentResult === DeploymentResult.Cancelled,
  };
};

export const toAPIConfigEntryValue = (
  internalEntryValue: ValidConfigEntryValue,
): DangerousConfigEntryValue => {
  switch (internalEntryValue.valueType) {
    case ValidConfigEntryValueType.String:
      return internalEntryValue.stringValue;
    case ValidConfigEntryValueType.Boolean:
      return internalEntryValue.boolValue;
    case ValidConfigEntryValueType.Number:
      return internalEntryValue.numberValue;
    case ValidConfigEntryValueType.Json:
      return JSON.parse(internalEntryValue.jsonValue);
    default: {
      const exhaustiveCheck: never = internalEntryValue;
      throw new Error(`Unknown ConfigEntryValueType: ${exhaustiveCheck}`);
    }
  }
};

const translatePostRequest = (
  internalRequestParameters: InternalDraftUniversesUniverseIdPostRequest,
): V1DraftUniversesUniverseIdPostRequest => {
  if (internalRequestParameters.createConfigurationData.isDeleted) {
    return {
      ...internalRequestParameters,
      createConfigurationData: {
        ...internalRequestParameters.createConfigurationData,
      },
    };
  }

  const internalEntry = internalRequestParameters.createConfigurationData?.entry;
  const entry = { ...internalEntry, entryValue: toAPIConfigEntryValue(internalEntry.entryValue) };
  return {
    ...internalRequestParameters,
    createConfigurationData: {
      ...internalRequestParameters.createConfigurationData,
      entry,
    },
  };
};

const translatePutRequest = (
  internalRequestParameters: InternalDraftUniversesUniverseIdPutRequest,
): V1DraftUniversesUniverseIdPutRequest => {
  if (internalRequestParameters.updateConfigurationData.isDeleted) {
    return {
      ...internalRequestParameters,
      updateConfigurationData: {
        ...internalRequestParameters.updateConfigurationData,
      },
    };
  }

  const internalEntry = internalRequestParameters.updateConfigurationData?.entry;
  const entry = { ...internalEntry, entryValue: toAPIConfigEntryValue(internalEntry.entryValue) };
  return {
    ...internalRequestParameters,
    updateConfigurationData: {
      ...internalRequestParameters.updateConfigurationData,
      entry,
    },
  };
};

type ApiUpdateConditionData = NonNullable<
  V2DraftUniversesUniverseIdConditionPutRequest['updateConditionData']
>;
type ApiRpnRule = NonNullable<ApiUpdateConditionData['rule']>;
type ApiRpnToken = NonNullable<ApiRpnRule['tokens']>[number];
type ApiLiteralValue = NonNullable<NonNullable<ApiRpnToken['operand']>['literalValue']>;
type ApiCreateConfigurationDataV2 = NonNullable<
  V2DraftUniversesUniverseIdPostRequest['createConfigurationDataV2']
>;
type ApiConditionalValue = NonNullable<ApiCreateConfigurationDataV2['conditionalValues']>[number];
type ApiCreateConditionalRuleData = NonNullable<
  ApiCreateConfigurationDataV2['conditionalRules']
>[number];
type ApiUpdateConfigurationDataV2 = NonNullable<
  V2DraftUniversesUniverseIdPutRequest['updateConfigurationDataV2']
>;
type ApiUpdateConditionalValueData = NonNullable<
  ApiUpdateConfigurationDataV2['toUpdateConditionalValues']
>[number];
type ApiCreateConditionalValueData = NonNullable<
  ApiUpdateConfigurationDataV2['toCreateConditionalValues']
>[number];

const toApiLiteralValue = (value: string | number | boolean): ApiLiteralValue => {
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (Number.isInteger(value)) {
    return { integerValue: value };
  }
  return { doubleValue: value };
};

const toApiConditionRule = (rule: ValidConditionRule): ApiRpnRule => {
  const tokens: ApiRpnToken[] = rule.tokens.map((token) => {
    if (token.type === 'dimension') {
      return {
        operand: {
          attributeReference: token.dimension,
        },
      };
    }

    if (token.type === 'dimensionValue') {
      const literalValue: ApiLiteralValue = toApiLiteralValue(token.value);
      return {
        operand: {
          literalValue,
        },
      };
    }

    return {
      operator: token.operator,
    };
  });

  return { tokens };
};

const toApiConditionalValue = (
  conditionName: string,
  conditionValue: ValidConfigEntryValue,
): ApiConditionalValue => {
  return {
    conditionName,
    conditionValue: toAPIConfigEntryValue(conditionValue),
  };
};

const toApiUpdateConditionalValueData = (
  conditionName: string,
  conditionValue: ValidConfigEntryValue,
): ApiUpdateConditionalValueData => {
  return {
    conditionName,
    conditionValue: toAPIConfigEntryValue(conditionValue),
  };
};

const toApiCreateConditionalValueData = (
  conditionName: string,
  conditionValue: ValidConfigEntryValue,
): ApiCreateConditionalValueData => {
  return {
    conditionName,
    conditionValue: toAPIConfigEntryValue(conditionValue),
  };
};

const toApiCreateConditionalRuleData = (rule: ValidConditionRule): ApiCreateConditionalRuleData => {
  return {
    conditionName: rule.conditionKey,
    rule: toApiConditionRule(rule),
  };
};

const toApiCreateConfigurationDataV2 = (
  internalEntry: ValidConfigEntry,
  internalConditionalRules: Array<ValidConditionRule>,
): ApiCreateConfigurationDataV2 => {
  const { key, description, entryValue, conditionValue } = internalEntry;
  const translatedCreateData: ApiCreateConfigurationDataV2 = {
    key,
    description,
    entryValue: toAPIConfigEntryValue(entryValue),
    conditionalRules: internalConditionalRules.map(toApiCreateConditionalRuleData),
  };

  if (conditionValue?.size) {
    translatedCreateData.conditionalValues = Array.from(conditionValue.entries()).map(
      ([conditionName, value]) => toApiConditionalValue(conditionName, value),
    );
  }

  return translatedCreateData;
};

const translateV2PostRequest = (
  internalRequestParameters: InternalV2DraftUniversesUniverseIdPostRequest,
): V2DraftUniversesUniverseIdPostRequest => {
  if (internalRequestParameters.createConfigurationData.isDeleted) {
    throw new Error('CreateConfigurationDataV2 does not support deleted entries');
  }

  const { createConfigurationData, conditionalRules, ...baseRequest } = internalRequestParameters;

  return {
    ...baseRequest,
    createConfigurationDataV2: toApiCreateConfigurationDataV2(
      createConfigurationData.entry,
      conditionalRules,
    ),
  };
};

const toApiUpdateConfigurationDataV2 = (
  internalUpdateConfigurationData: InternalV2DraftUniversesUniverseIdPutRequest['updateConfigurationData'],
  conditionNamesToUpdate: Array<string>,
  internalConditionalRules: Array<ValidConditionRule>,
): ApiUpdateConfigurationDataV2 => {
  const { entry, isDeleted } = internalUpdateConfigurationData;
  const { key } = entry;
  const translatedUpdateData: ApiUpdateConfigurationDataV2 = {
    key,
    conditionalRules: internalConditionalRules.map(toApiCreateConditionalRuleData),
  };
  if (isDeleted) {
    translatedUpdateData.isDeleted = true;
  } else {
    translatedUpdateData.description = entry.description;
    translatedUpdateData.entryValue = toAPIConfigEntryValue(entry.entryValue);
  }

  const conditionValue = 'conditionValue' in entry ? entry.conditionValue : undefined;
  if (!conditionValue?.size) {
    return translatedUpdateData;
  }

  const conditionNamesToUpdateSet = new Set(conditionNamesToUpdate);
  const toUpdateConditionalValues: ApiUpdateConditionalValueData[] = [];
  const toCreateConditionalValues: ApiCreateConditionalValueData[] = [];

  conditionValue.forEach((value, conditionName) => {
    if (conditionNamesToUpdateSet.has(conditionName)) {
      toUpdateConditionalValues.push(toApiUpdateConditionalValueData(conditionName, value));
      return;
    }
    toCreateConditionalValues.push(toApiCreateConditionalValueData(conditionName, value));
  });

  if (toUpdateConditionalValues.length > 0) {
    translatedUpdateData.toUpdateConditionalValues = toUpdateConditionalValues;
  }
  if (toCreateConditionalValues.length > 0) {
    translatedUpdateData.toCreateConditionalValues = toCreateConditionalValues;
  }

  return translatedUpdateData;
};

const translateV2PutRequest = (
  internalRequestParameters: InternalV2DraftUniversesUniverseIdPutRequest,
): V2DraftUniversesUniverseIdPutRequest => {
  const { updateConfigurationData, conditionNamesToUpdate, conditionalRules, ...baseRequest } =
    internalRequestParameters;

  return {
    ...baseRequest,
    updateConfigurationDataV2: toApiUpdateConfigurationDataV2(
      updateConfigurationData,
      conditionNamesToUpdate,
      conditionalRules,
    ),
  };
};

const translateConditionPutRequest = (
  internalRequestParameters: InternalV2DraftUniversesUniverseIdConditionPutRequest,
): V2DraftUniversesUniverseIdConditionPutRequest => {
  const { updateConditionData } = internalRequestParameters;
  const translatedUpdateConditionData: ApiUpdateConditionData = {
    conditionName: updateConditionData.conditionName,
  };
  if (updateConditionData.newConditionName !== undefined) {
    translatedUpdateConditionData.newConditionName = updateConditionData.newConditionName;
  }
  if (updateConditionData.isDeleted !== undefined) {
    translatedUpdateConditionData.isDeleted = updateConditionData.isDeleted;
  }
  if (updateConditionData.rule) {
    translatedUpdateConditionData.rule = toApiConditionRule(updateConditionData.rule);
  }

  return {
    ...internalRequestParameters,
    updateConditionData: translatedUpdateConditionData,
  };
};

/**
 * This is a wrapper around the UniverseConfigsWebAPIApi that validates the response
 * and throws an error if the response is invalid.
 *
 * Since we convert the embedded `any`-typed EntryValues to our own types, this is required to wrap
 * the generated API client.
 */
const makeValidatedApi = (given: UniverseConfigsWebAPIApi): ValidRemoteConfigAPI => {
  return {
    // This get request is dangerous and has embedded `any`-typed EntryValues
    v1ConfigurationsUniversesUniverseIdLatestGet: async (
      requestParameters: InternalConfigurationsUniversesUniverseIdLatestGetRequest,
    ): Promise<ValidGetLatestConfigurationResponse> => {
      const dangerousResponse =
        await given.v1ConfigurationsUniversesUniverseIdLatestGet(requestParameters);
      return toValidGetLatestConfigurationResponse(dangerousResponse);
    },
    v1DraftUniversesUniverseIdGet: async (
      internalRequestParameters: InternalDraftUniversesUniverseIdGetRequest,
    ): Promise<ValidGetStagedChangesResponse> => {
      const requestParameters: V1DraftUniversesUniverseIdGetRequest = internalRequestParameters;
      const dangerousResult = await given.v1DraftUniversesUniverseIdGet(requestParameters);
      try {
        return toValidGetStagedChangesResponse(dangerousResult);
      } catch (error) {
        if (error instanceof GetThemFromPublishedEntriesError) {
          // Staged responses can be partial and contain only conditional deltas for a key.
          // Fetch the latest published entries to hydrate the missing non-conditional base
          // entry, then retry staged validation with that published context.
          const dangerousPublishedEntriesResponse =
            await given.v1ConfigurationsUniversesUniverseIdLatestGet(requestParameters);
          const { entries: publishedEntries } = toValidGetLatestConfigurationResponse(
            dangerousPublishedEntriesResponse,
          );
          return toValidGetStagedChangesResponse(dangerousResult, publishedEntries);
        }
        throw error;
      }
    },

    // The remainder are less dangerous since they don't have embedded `any`-typed EntryValues
    v1DraftUniversesUniverseIdCancelPost: async (
      internalRequestParameters: InternalDraftUniversesUniverseIdCancelPostRequest,
    ): Promise<ValidCancelPublishingResponse> => {
      const requestParameters: V1DraftUniversesUniverseIdCancelPostRequest =
        internalRequestParameters;
      const unvalidatedResponse =
        await given.v1DraftUniversesUniverseIdCancelPost(requestParameters);
      return {
        cancelPublishStagedResult: toValidConfigChangeResult(
          unvalidatedResponse.cancelPublishStagedResult,
        ),
      };
    },
    v1DraftUniversesUniverseIdDelete: async (
      internalRequestParameters: InternalDraftUniversesUniverseIdDeleteRequest,
    ): Promise<ValidDiscardStagedChangesResponse> => {
      const requestParameters: V1DraftUniversesUniverseIdDeleteRequest = internalRequestParameters;
      const unvalidatedResponse = await given.v1DraftUniversesUniverseIdDelete(requestParameters);
      return {
        discardStagedResult: toValidConfigChangeResult(unvalidatedResponse.discardStagedResult),
      };
    },
    v2DraftUniversesUniverseIdDelete: async (
      internalRequestParameters: InternalV2DraftUniversesUniverseIdDeleteRequest,
    ): Promise<ValidDiscardStagedChangesResponse> => {
      const requestParameters: V2DraftUniversesUniverseIdDeleteRequest = internalRequestParameters;
      const unvalidatedResponse = await given.v2DraftUniversesUniverseIdDelete(requestParameters);
      return {
        discardStagedResult: toValidConfigChangeResult(unvalidatedResponse.discardStagedResult),
      };
    },
    v1DraftUniversesUniverseIdForcePost: async (
      internalRequestParameters: InternalDraftUniversesUniverseIdForcePostRequest,
    ): Promise<ValidForcePublishingResponse> => {
      const requestParameters: V1DraftUniversesUniverseIdForcePostRequest =
        internalRequestParameters;
      const unvalidatedResponse =
        await given.v1DraftUniversesUniverseIdForcePost(requestParameters);
      return {
        forcePublishStagedResult: toValidConfigChangeResult(
          unvalidatedResponse.forcePublishStagedResult,
        ),
      };
    },
    v1DraftUniversesUniverseIdPost: async (
      internalRequestParameters: InternalDraftUniversesUniverseIdPostRequest,
    ): Promise<ValidCreateConfigurationResponse> => {
      const requestParameters = translatePostRequest(internalRequestParameters);
      const unvalidatedResponse = await given.v1DraftUniversesUniverseIdPost(requestParameters);
      return {
        createConfigResult: toValidConfigChangeResult(unvalidatedResponse.createConfigResult),
      };
    },
    v2DraftUniversesUniverseIdPost: async (
      internalRequestParameters: InternalV2DraftUniversesUniverseIdPostRequest,
    ): Promise<ValidCreateConfigurationResponse> => {
      const requestParameters = translateV2PostRequest(internalRequestParameters);
      const unvalidatedResponse = await given.v2DraftUniversesUniverseIdPost(requestParameters);
      return {
        createConfigResult: toValidConfigChangeResult(unvalidatedResponse.createConfigResult),
      };
    },
    v1DraftUniversesUniverseIdPublishPost: async (
      internalRequestParameters: InternalDraftUniversesUniverseIdPublishPostRequest,
    ): Promise<ValidPublishStagedChangesResponse> => {
      const requestParameters: V1DraftUniversesUniverseIdPublishPostRequest =
        internalRequestParameters;
      const unvalidatedResponse =
        await given.v1DraftUniversesUniverseIdPublishPost(requestParameters);
      return {
        publishStagedResult: toValidConfigChangeResult(unvalidatedResponse.publishStagedResult),
      };
    },
    v1DraftUniversesUniverseIdPut: async (
      internalRequestParameters: InternalDraftUniversesUniverseIdPutRequest,
    ): Promise<ValidUpdateConfigurationResponse> => {
      const requestParameters = translatePutRequest(internalRequestParameters);
      const unvalidatedResponse = await given.v1DraftUniversesUniverseIdPut(requestParameters);
      return unvalidatedResponse.updateConfigResult
        ? {
            updateConfigResult: toValidConfigChangeResult(unvalidatedResponse.updateConfigResult),
          }
        : {
            updateConfigResult: {
              isError: false,
              data: {},
            },
          };
    },
    v2DraftUniversesUniverseIdPut: async (
      internalRequestParameters: InternalV2DraftUniversesUniverseIdPutRequest,
    ): Promise<ValidUpdateConfigurationResponse> => {
      const requestParameters = translateV2PutRequest(internalRequestParameters);
      const unvalidatedResponse = await given.v2DraftUniversesUniverseIdPut(requestParameters);
      return unvalidatedResponse.updateConfigResult
        ? {
            updateConfigResult: toValidConfigChangeResult(unvalidatedResponse.updateConfigResult),
          }
        : {
            updateConfigResult: {
              isError: false,
              data: {},
            },
          };
    },
    v2DraftUniversesUniverseIdConditionPut: async (
      internalRequestParameters: InternalV2DraftUniversesUniverseIdConditionPutRequest,
    ): Promise<ValidUpdateConditionResult> => {
      const requestParameters = translateConditionPutRequest(internalRequestParameters);
      const unvalidatedResponse =
        await given.v2DraftUniversesUniverseIdConditionPut(requestParameters);
      return toValidConfigChangeResult(unvalidatedResponse.updateConditionResult);
    },
    v2DraftUniversesUniverseIdRuleOrderingPut: async (
      internalRequestParameters: InternalV2DraftUniversesUniverseIdRuleOrderingPutRequest,
    ): Promise<ValidUpdateRuleOrderingResult> => {
      const requestParameters: V2DraftUniversesUniverseIdRuleOrderingPutRequest =
        internalRequestParameters;
      const unvalidatedResponse =
        await given.v2DraftUniversesUniverseIdRuleOrderingPut(requestParameters);
      return toValidConfigChangeResult(unvalidatedResponse.updateRuleOrderingResult);
    },
    v1ChangelogUniversesUniverseIdGet: async (
      internalRequestParameters: InternalChangelogUniversesUniverseIdGetRequest,
    ): Promise<ValidGetConfigurationHistoryResponse> => {
      const requestParameters: V1ChangelogUniversesUniverseIdGetRequest = internalRequestParameters;
      const unvalidatedResponse = await given.v1ChangelogUniversesUniverseIdGet(requestParameters);
      return {
        getConfigurationHistoryResult: {
          changelogEntries: unvalidatedResponse?.changelogEntries?.map(toValidChangelogEntry) ?? [],
          total: unvalidatedResponse?.total ?? 0,
        },
      };
    },
    v1ChangelogUniversesUniverseIdEntryChangelogEntryIdRestorePost: async (
      internalRequestParameters: InternalChangelogUniversesUniverseIdEntryChangelogEntryIdRestorePostRequest,
    ): Promise<ValidRestoreChangelogEntryResponse> => {
      const requestParameters: V1ChangelogUniversesUniverseIdEntryChangelogEntryIdRestorePostRequest =
        internalRequestParameters;
      const unvalidatedResponse =
        await given.v1ChangelogUniversesUniverseIdEntryChangelogEntryIdRestorePost(
          requestParameters,
        );
      return {
        restoreChangelogEntryResult: toValidConfigChangeResult(
          unvalidatedResponse.restoreChangelogEntryResult,
        ),
      };
    },
  };
};

export default makeValidatedApi;
