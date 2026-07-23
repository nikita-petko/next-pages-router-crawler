export enum ExperimentProductType {
  Configs = 'EXPERIMENT_PRODUCT_TYPE_CONFIGS',
  Matchmaking = 'EXPERIMENT_PRODUCT_TYPE_MATCHMAKING',
}

export enum ExperimentMetric {
  AverageSessionTime = 'UNIVERSE_EXPERIMENT_METRIC_AVERAGE_SESSION_TIME',
  PlaytimePerUser = 'UNIVERSE_EXPERIMENT_METRIC_PLAYTIME_PER_USER',
  Day1Retention = 'UNIVERSE_EXPERIMENT_METRIC_DAY_1_RETENTION',
  Day7Retention = 'UNIVERSE_EXPERIMENT_METRIC_DAY_7_RETENTION',
  PayerConversionRate = 'UNIVERSE_EXPERIMENT_METRIC_PAYER_CONVERSION_RATE',
  AverageRevenuePerUser = 'UNIVERSE_EXPERIMENT_METRIC_AVERAGE_REVENUE_PER_USER',
  AverageRevenuePerPayingUser = 'UNIVERSE_EXPERIMENT_METRIC_AVERAGE_REVENUE_PER_PAYING_USER',
}

export enum ExperimentState {
  Draft = 'EXPERIMENT_STATE_DRAFT',
  Scheduled = 'EXPERIMENT_STATE_SCHEDULED',
  Running = 'EXPERIMENT_STATE_RUNNING',
  Completed = 'EXPERIMENT_STATE_COMPLETED',
  Cancelled = 'EXPERIMENT_STATE_CANCELLED',
  Deleted = 'EXPERIMENT_STATE_DELETED',
}

export enum ExperimentOperationStatus {
  Ready = 'OPERATIONAL_STATUS_READY',
  Creating = 'OPERATIONAL_STATUS_CREATING',
  Updating = 'OPERATIONAL_STATUS_UPDATING',
  Starting = 'OPERATIONAL_STATUS_STARTING',
  Stopping = 'OPERATIONAL_STATUS_STOPPING',
  Scheduling = 'OPERATIONAL_STATUS_SCHEDULING',
  Deleting = 'OPERATIONAL_STATUS_DELETING',
  RampingUp = 'OPERATIONAL_STATUS_RAMPING_UP',
  Syncing = 'OPERATIONAL_STATUS_SYNCING',
  RollingOut = 'OPERATIONAL_STATUS_ROLLING_OUT',
}

/**
 * ExperimentApiErrorType is the type of error that occurred during an experiment operation.
 */
export enum ExperimentApiErrorType {
  Invalid = 'EXPERIMENT_API_ERROR_TYPE_INVALID',
  InvalidVariantConfiguration = 'EXPERIMENT_API_ERROR_TYPE_INVALID_VARIANT_CONFIGURATION',
  InvalidVariantLabel = 'EXPERIMENT_API_ERROR_TYPE_INVALID_VARIANT_LABEL',
  MustHaveExactlyOneBaselineVariant = 'EXPERIMENT_API_ERROR_TYPE_MUST_HAVE_EXACTLY_ONE_BASELINE_VARIANT',
  MatchmakingOverlappingRuntime = 'EXPERIMENT_API_ERROR_TYPE_MATCHMAKING_OVERLAPPING_RUNTIME',
  MatchmakingInvalidScoringConfigurations = 'EXPERIMENT_API_ERROR_TYPE_MATCHMAKING_INVALID_SCORING_CONFIGURATIONS',
  MatchmakingUnexpectedProductType = 'EXPERIMENT_API_ERROR_TYPE_MATCHMAKING_UNEXPECTED_PRODUCT_TYPE',
  MatchmakingEmptyConfiguration = 'EXPERIMENT_API_ERROR_TYPE_MATCHMAKING_EMPTY_CONFIGURATION',
  MatchmakingEmptyVariantMetadata = 'EXPERIMENT_API_ERROR_TYPE_MATCHMAKING_EMPTY_VARIANT_METADATA',
  MatchmakingVariantWeightMustBePositive = 'EXPERIMENT_API_ERROR_TYPE_MATCHMAKING_VARIANT_WEIGHT_MUST_BE_POSITIVE',
  MatchmakingVariantWeightsUnbalanced = 'EXPERIMENT_API_ERROR_TYPE_MATCHMAKING_VARIANT_WEIGHTS_UNBALANCED',
  MatchmakingPlaceConfigRequiresScoringIdOrDefault = 'EXPERIMENT_API_ERROR_TYPE_MATCHMAKING_PLACE_CONFIG_REQUIRES_SCORING_ID_OR_DEFAULT',
  ConfigsMissingVariant = 'EXPERIMENT_API_ERROR_TYPE_CONFIGS_MISSING_VARIANT',
  ConfigsVariantMissingKey = 'EXPERIMENT_API_ERROR_TYPE_CONFIGS_VARIANT_MISSING_KEY',
  ConfigsVariantMissingValue = 'EXPERIMENT_API_ERROR_TYPE_CONFIGS_VARIANT_MISSING_VALUE',
  ConfigsKeyAlreadyInUse = 'EXPERIMENT_API_ERROR_TYPE_CONFIGS_KEY_ALREADY_IN_USE',
  InvalidTargetingCriteria = 'EXPERIMENT_API_ERROR_TYPE_INVALID_TARGETING_CRITERIA',
  TargetingNotAllowed = 'EXPERIMENT_API_ERROR_TYPE_TARGETING_NOT_ALLOWED',
  SystemError = 'EXPERIMENT_API_ERROR_TYPE_SYSTEM_ERROR',
  ExperimentResultsNotFound = 'EXPERIMENT_API_ERROR_TYPE_EXPERIMENT_RESULTS_NOT_FOUND',
}

/**
 * SortOrder is the order in which the results are returned. Default is ascending.
 */
export enum SortOrder {
  Ascending = 'SORT_ORDER_ASCENDING',
  Descending = 'SORT_ORDER_DESCENDING',
}

/**
 * SortKey is the key to sort the results by. Default is by the config entry key.
 */
export enum SortKey {
  Name = 'LIST_EXPERIMENT_SORT_KEY_NAME',
  StartTime = 'LIST_EXPERIMENT_SORT_KEY_START_TIME',
  LastModifiedTime = 'LIST_EXPERIMENT_SORT_KEY_LAST_MODIFIED_TIME',
  // Relevance sorts by most actionable experiments first. Decision Needed, Running, Scheduled, Completed, Drafts.
  // It sorts using the difference between the current time and the time to make a decision (for running experiments).
  Relevance = 'LIST_EXPERIMENT_SORT_KEY_RELEVANCE',
}
