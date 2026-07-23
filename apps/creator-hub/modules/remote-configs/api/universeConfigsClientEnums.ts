/**
 * Enums for Universe Remote Configurations Client
 */

/**
 * EntryTypeFilter is a filter based on the type of the entry whether the entry is an override or a default.
 * Defaults are those entries created from client instrumentation
 * these are the configurations accessed by the client code with no overrides. Overrides are
 * are entries created by a user to override the client default value.
 */

export enum EntryTypeFilter {
  Invalid = 'ENTRY_TYPE_FILTER_INVALID',
  Override = 'ENTRY_TYPE_FILTER_OVERRIDE',
  Default = 'ENTRY_TYPE_FILTER_DEFAULT',
}

/**
 * ErrorType is the type of error that occurred during an update, creation, discard or publishing of a draft.
 */
export enum ErrorType {
  Invalid = 'ERROR_TYPE_INVALID',
  DraftMismatch = 'ERROR_TYPE_DRAFT_MISMATCH',
  InvalidValueType = 'ERROR_TYPE_INVALID_VALUE_TYPE',
  CreateKeyHasOverride = 'ERROR_TYPE_CREATE_KEY_HAS_OVERRIDE',
  UpdateFailed = 'ERROR_TYPE_UPDATE_FAILED',
  CreationFailed = 'ERROR_TYPE_CREATION_FAILED',
  ReachedMaxEntries = 'ERROR_TYPE_REACHED_MAX_ENTRIES',
  OverrideNotFound = 'ERROR_TYPE_OVERRIDE_NOT_FOUND',
  DeploymentInProgress = 'ERROR_TYPE_DEPLOYMENT_IN_PROGRESS',
  ConfigLockedByExperiment = 'ERROR_TYPE_CONFIG_LOCKED_BY_EXPERIMENT',
}

/**
 * SortOrder is the order in which the results are returned. Default is ascending.
 */
export enum SortOrder {
  Invalid = 'SORT_ORDER_INVALID',
  Ascending = 'SORT_ORDER_ASCENDING',
  Descending = 'SORT_ORDER_DESCENDING',
}

/**
 * SortKey is the key to sort the results by. Default is by the config entry key.
 */
export enum SortKey {
  ConfigEntryKey = 'SORT_KEY_CONFIG_ENTRY_KEY',
  LastModifiedTime = 'SORT_KEY_LAST_MODIFIED_TIME',
  LastAccessedTime = 'SORT_KEY_LAST_ACCESSED_TIME',
}

/**
 * ValidConfigEntryValueType is the type of value a ConfigEntry can have.
 */
export enum ValidConfigEntryValueType {
  String = 'CONFIG_ENTRY_VALUE_TYPE_STRING',
  Boolean = 'CONFIG_ENTRY_VALUE_TYPE_BOOLEAN',
  Number = 'CONFIG_ENTRY_VALUE_TYPE_NUMBER',
  Json = 'CONFIG_ENTRY_VALUE_TYPE_JSON',
}

export enum RpnOperator {
  And = 'OPERATOR_AND',
  Or = 'OPERATOR_OR',
  Not = 'OPERATOR_NOT',
  Eq = 'OPERATOR_EQ',
  Ne = 'OPERATOR_NE',
  Gt = 'OPERATOR_GT',
  Lt = 'OPERATOR_LT',
  Gte = 'OPERATOR_GTE',
  Lte = 'OPERATOR_LTE',
  In = 'OPERATOR_IN',
  Nin = 'OPERATOR_NIN',
}

export const DeploymentStrategy = {
  Invalid: 'DEPLOYMENT_STRATEGY_INVALID',
  GradualRollout: 'DEPLOYMENT_STRATEGY_GRADUAL_ROLLOUT',
  Immediate: 'DEPLOYMENT_STRATEGY_IMMEDIATE',
} as const;

export type DeploymentStrategy = (typeof DeploymentStrategy)[keyof typeof DeploymentStrategy];
