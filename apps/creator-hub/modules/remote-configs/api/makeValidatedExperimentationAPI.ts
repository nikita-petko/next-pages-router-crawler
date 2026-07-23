import {
  UniverseExperimentationAPIApi,
  GetExperimentResponse as DangerousGetExperimentResponse,
  GetAudiencesResponse as DangerousGetAudiencesResponse,
  CompleteExperimentResponse as DangerousCompleteExperimentResponse,
  GetExperimentOperationStatusResponse as DangerousGetExperimentOperationStatusResponse,
  CreateExperimentResponse as DangerousCreateExperimentResponse,
  UpdateExperimentResponse as DangerousUpdateExperimentResponse,
  StartExperimentResponse as DangerousStartExperimentResponse,
  ListExperimentsResponse as DangerousGetExperimentsResponse,
  ExperimentSummary as DangerousExperimentSummary,
  VariantMeta as DangerousVariantMeta,
  ExperimentApiError as DangerousExperimentApiError,
  SingleConfigExperimentConfiguration,
  MatchmakingExperimentConfiguration,
  ExperimentConfiguration,
  DiscardExperimentResponse as DangerousDiscardExperimentResponse,
  ExperimentOperation as DangerousExperimentOperation,
  RolloutVariantResponse as DangerousRolloutVariantResponse,
  CalculateExperimentMdeResponse as DangerousCalculateExperimentMdeResponse,
  GetLatestExperimentResultsResponse as DangerousGetLatestExperimentResultsResponse,
  GetExperimentStatsResponse as DangerousGetExperimentStatsResponse,
} from '@modules/clients/analytics/universeExperimentation';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared';
import { logAnalyticsError } from '@modules/charts-generic';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import {
  InternalUniversesUniverseIdAudiencesGetRequest,
  InternalV1UniversesUniverseIdExperimentExperimentIdcompletePostRequest,
  InternalV1UniversesUniverseIdExperimentExperimentIddiscardPostRequest,
  InternalV1UniversesUniverseIdExperimentExperimentIdrolloutPostRequest,
  InternalV1UniversesUniverseIdExperimentExperimentIdGetRequest,
  InternalV1UniversesUniverseIdExperimentExperimentIdPatchRequest,
  InternalV1UniversesUniverseIdExperimentExperimentIdstartPostRequest,
  InternalV1UniversesUniverseIdExperimentPostRequest,
  InternalV1UniversesUniverseIdExperimentsGetRequest,
  InternalV1UniversesUniverseIdOperationOperationIdGetRequest,
  ValidAudience,
  ValidCompleteExperimentResponse,
  ValidCreateExperimentResponse,
  ValidExperimentationAPI,
  ValidExperimentConfiguration,
  ValidExperimentConfigurationForCreation,
  ValidExperimentStateInfo,
  ValidGetAudiencesResponse,
  ValidGetExperimentOperationStatusResponse,
  ValidGetExperimentResponse,
  ValidGetExperimentsResponse,
  ValidStartExperimentResponse,
  ValidUpdateExperimentResponse,
  ValidDiscardExperimentResponse,
  ValidRolloutExperimentResponse,
  ValidOperationBase,
  ValidExperiment,
  InternalV1UniversesUniverseIdExperimentMdePostRequest,
  ValidCalculateExperimentMdeDataResponse,
  InternalV1UniversesUniverseIdExperimentExperimentIdResultsGetRequest,
  ValidGetExperimentResultsResponse,
  InternalV1UniversesUniverseIdExperimentExperimentIdStatsGetRequest,
  ValidGetExperimentStatsResponse,
} from './validExperimentationTypes';
import {
  ExperimentApiErrorType,
  ExperimentMetric,
  ExperimentOperationStatus,
  ExperimentProductType,
  ExperimentState,
} from './universeExperimentationClientEnums';
import {
  isDangerousValueConfigEntry,
  toAPIConfigEntryValue as toAPIConfigEntryValueForConfigsProductType,
  toValidConfigEntry as toValidConfigEntryForConfigsProductType,
} from './makeValidatedAPI';

export const ExperimentMetricToRAQIV2Metric: Record<ExperimentMetric, TRAQIV2NumericUIMetric> = {
  [ExperimentMetric.PlaytimePerUser]: RAQIV2Metric.ExperimentMetricPlaytimePerUser,
  [ExperimentMetric.Day1Retention]: RAQIV2Metric.ExperimentMetricDay1Retention,
  [ExperimentMetric.Day7Retention]: RAQIV2Metric.ExperimentMetricDay7Retention,
  [ExperimentMetric.PayerConversionRate]: RAQIV2Metric.ExperimentMetricPayerConversionRate,
  [ExperimentMetric.AverageRevenuePerUser]: RAQIV2Metric.ExperimentMetricAverageRevenuePerUser,
  [ExperimentMetric.AverageRevenuePerPayingUser]:
    RAQIV2Metric.ExperimentMetricAverageRevenuePerPayingUser,
  [ExperimentMetric.AverageSessionTime]: RAQIV2Metric.ExperimentMetricAverageSessionTime,
};

function handleError(message: string): never {
  if (window.location.hostname.indexOf('localhost') !== -1) {
    // eslint-disable-next-line no-console -- help to surface errors in development
    console.error(message);
  }
  throw new Error(message);
}

const toValidVariantMeta = ({
  dangerousVariantMeta,
  state,
}: {
  dangerousVariantMeta?: DangerousVariantMeta;
  state: ExperimentState;
}) => {
  if (!dangerousVariantMeta?.label) {
    handleError('Variant label is required');
  }

  let validVariantId: string;
  if (!dangerousVariantMeta.variantId) {
    if (state !== ExperimentState.Draft && state !== ExperimentState.Scheduled) {
      handleError('Variant id is required for non-draft and non-scheduled experiments');
    }
    // The variant id is only assigned when an experiment is 'running'.
    // For draft or scheduled experiments, variants do not have ids yet.
    // To simplify client handling, we generate a temporary id using the variant label,
    // which should be unique(?) within an experiment since duplicate names are not allowed.
    validVariantId = `temp:${dangerousVariantMeta.label}`;
  } else {
    validVariantId = dangerousVariantMeta.variantId;
  }

  return {
    label: dangerousVariantMeta.label,
    variantId: validVariantId,
    isBaseline: dangerousVariantMeta.isBaseline ?? false,
    weight: dangerousVariantMeta.weight ?? 0,
  };
};

const toValidExperimentBase = (dangerousExperimentSummary: DangerousExperimentSummary) => {
  const { id, name, createdBy, startedTime, stoppedTime, scheduledTime, state } =
    dangerousExperimentSummary;

  if (!id) {
    handleError('Experiment id is required');
  }

  if (!name) {
    handleError(`Experiment name is required for experiment ${id}`);
  }

  if (createdBy === undefined) {
    handleError(`Experiment createdBy should be a valid user id for experiment ${id}`);
  }

  let validStateInfo: ValidExperimentStateInfo;
  if (!state || !isValidEnumValue(ExperimentState, state)) {
    handleError(`Invalid experiment state: ${state} for experiment ${id}`);
  } else {
    switch (state) {
      case ExperimentState.Draft:
        validStateInfo = {
          state: ExperimentState.Draft,
        };
        break;
      case ExperimentState.Scheduled:
        if (!scheduledTime) {
          handleError(`Experiment scheduled time is required for experiment ${id}`);
        }
        validStateInfo = {
          state: ExperimentState.Scheduled,
          scheduledTime: new Date(scheduledTime),
        };
        break;
      case ExperimentState.Running:
        if (!startedTime) {
          handleError(`Experiment started time is required for experiment ${id}`);
        }
        validStateInfo = {
          state: ExperimentState.Running,
          startedTime: new Date(startedTime),
        };
        break;
      case ExperimentState.Completed:
      case ExperimentState.Cancelled:
        if (!startedTime) {
          handleError(`Experiment started time is required for experiment ${id}`);
        }
        if (!stoppedTime) {
          handleError(`Experiment stopped time is required for experiment ${id}`);
        }
        validStateInfo = {
          state: ExperimentState.Completed,
          startedTime: new Date(startedTime),
          stoppedTime: new Date(stoppedTime),
        };
        break;
      case ExperimentState.Deleted:
        validStateInfo = {
          state: ExperimentState.Deleted,
        };
        break;
      default: {
        const exhaustiveCheck: never = state;
        throw new Error(`Invalid experiment state: ${exhaustiveCheck}`);
      }
    }
  }

  return {
    id,
    name,
    createdBy,
    ...validStateInfo,
  };
};

const toValidDurationDays = (durationString?: string) => {
  if (!durationString) {
    return 14; // default duration days;
  }

  if (!durationString.endsWith('s')) {
    handleError('Invalid duration string: must end with "s"');
  }

  const secondsStr = durationString.slice(0, -1);
  const seconds = Number(secondsStr);
  if (Number.isNaN(seconds)) {
    handleError('Invalid number in duration string');
  }

  return Math.floor(seconds / 86400);
};

const toValidDurationString = (durationDays: number) => {
  return `${durationDays * 86400}s`;
};

export const toValidGetExperimentResponse = (
  dangerousResponse: DangerousGetExperimentResponse,
): ValidGetExperimentResponse => {
  const { experiment } = dangerousResponse;
  if (!experiment) {
    handleError('Experiment is required');
  }

  const { exposurePercent, universeMetricConfiguration, experimentConfiguration } = experiment;

  const validExperimentBase = toValidExperimentBase(experiment);

  const experimentProductType = experimentConfiguration?.productType;
  if (!experimentProductType || !isValidEnumValue(ExperimentProductType, experimentProductType)) {
    handleError(
      `Invalid experiment product type: ${experimentProductType} for experiment ${validExperimentBase.id}`,
    );
  }

  let validExperimentConfiguration: ValidExperimentConfiguration;
  switch (experimentProductType) {
    case ExperimentProductType.Configs: {
      const dangerousVariants =
        experimentConfiguration.singleConfigExperimentConfiguration?.variants;
      if (!dangerousVariants?.length) {
        handleError(
          `Single config experiment configuration is required for experiment ${validExperimentBase.id}`,
        );
      }

      const validVariants = dangerousVariants.map((dangerousVariant) => {
        const { configEntry, variantMeta } = dangerousVariant;
        if (!configEntry) {
          handleError(`Config entry is required for experiment ${validExperimentBase.id}`);
        }

        if (!isDangerousValueConfigEntry(configEntry)) {
          handleError(`Config entry is required for experiment ${validExperimentBase.id}`);
        }

        return {
          ...toValidVariantMeta({
            dangerousVariantMeta: variantMeta,
            state: validExperimentBase.state,
          }),
          configEntry: toValidConfigEntryForConfigsProductType(configEntry),
        };
      });
      validExperimentConfiguration = {
        experimentType: ExperimentProductType.Configs,
        variants: validVariants,
      };
      break;
    }
    case ExperimentProductType.Matchmaking: {
      const dangerousVariants =
        experimentConfiguration.matchmakingExperimentConfiguration?.variants;
      if (!dangerousVariants?.length) {
        handleError(
          `Matchmaking experiment configuration is required for experiment ${validExperimentBase.id}`,
        );
      }
      const validVariants = dangerousVariants.map((dangerousVariant) => {
        const { placeMatchmakingConfigs, variantMeta } = dangerousVariant;
        if (!placeMatchmakingConfigs?.length) {
          handleError(
            `Matchmaking scoring config is required for experiment ${validExperimentBase.id}`,
          );
        }

        return {
          ...toValidVariantMeta({
            dangerousVariantMeta: variantMeta,
            state: validExperimentBase.state,
          }),
          placeMatchmakingConfigs: placeMatchmakingConfigs.map(
            ({ placeId, matchmakingScoringConfigId, usePlatformDefault }) => {
              if (!placeId) {
                handleError(`Place id is required for experiment ${validExperimentBase.id}`);
              }
              if (matchmakingScoringConfigId === undefined || matchmakingScoringConfigId === null) {
                handleError(
                  `Matchmaking scoring config id is required for experiment ${validExperimentBase.id}`,
                );
              }
              return {
                placeId,
                matchmakingScoringConfigId,
                usePlatformDefault: !!usePlatformDefault,
              };
            },
          ),
        };
      });
      validExperimentConfiguration = {
        experimentType: ExperimentProductType.Matchmaking,
        variants: validVariants,
      };
      break;
    }

    default: {
      const exhaustiveCheck: never = experimentProductType;
      throw new Error(`Invalid experiment product type: ${exhaustiveCheck}`);
    }
  }

  if (validExperimentConfiguration.variants.filter((variant) => variant.isBaseline).length !== 1) {
    handleError(
      `Experiment must have exactly one baseline variant for experiment ${validExperimentBase.id}`,
    );
  }

  const validGoalMetrics: ExperimentMetric[] = [];
  universeMetricConfiguration?.goalMetrics?.forEach((dangerousGoalMetric) => {
    if (!isValidEnumValue(ExperimentMetric, dangerousGoalMetric)) {
      logAnalyticsError(
        `Invalid goal metric: ${dangerousGoalMetric} for experiment ${validExperimentBase.id}`,
      );
      return;
    }

    validGoalMetrics.push(dangerousGoalMetric);
  });
  if (!validGoalMetrics?.length) {
    handleError(`Experiment goal metrics are required for experiment ${validExperimentBase.id}`);
  }

  const validLearningMetrics: ExperimentMetric[] = [];
  universeMetricConfiguration?.learningMetrics?.forEach((dangerousLearningMetric) => {
    if (!isValidEnumValue(ExperimentMetric, dangerousLearningMetric)) {
      logAnalyticsError(
        `Invalid learning metric: ${dangerousLearningMetric} for experiment ${validExperimentBase.id}`,
      );
      return;
    }

    validLearningMetrics.push(dangerousLearningMetric);
  });

  return {
    experiment: {
      exposurePercent: exposurePercent ?? 0,
      goalMetrics: validGoalMetrics,
      learningMetrics: validLearningMetrics,
      durationDays: toValidDurationDays(experiment.duration),
      ...validExperimentBase,
      ...validExperimentConfiguration,
    },
  };
};

const toValidGetExperimentsResponse = (
  dangerousResponse: DangerousGetExperimentsResponse,
): ValidGetExperimentsResponse => {
  const { experiments, total } = dangerousResponse;
  if (!experiments) {
    logAnalyticsError('GetConfigurationsResponse entries are missing');
    return { experimentsSummary: [], total: 0 };
  }
  return {
    experimentsSummary: experiments.map((experiment) => {
      const validExperimentBase = toValidExperimentBase(experiment);

      if (
        !experiment.productType ||
        !isValidEnumValue(ExperimentProductType, experiment.productType)
      ) {
        handleError(
          `Invalid experiment product type: ${experiment.productType} for experiment ${validExperimentBase.id}`,
        );
      }

      let configKey: string;
      switch (experiment.productType) {
        case ExperimentProductType.Configs: {
          if (!experiment.experimentConfigKey) {
            handleError(
              `Experiment config key is required for configs experiment ${validExperimentBase.id}`,
            );
          }
          configKey = experiment.experimentConfigKey;
          break;
        }
        case ExperimentProductType.Matchmaking: {
          // we use the same config key column for matchmaking experiments and
          // use a constant string to represent the matchamking experiments
          // config key in the get experiments response
          configKey = 'Matchmaking Configuration';
          break;
        }
        default: {
          const exhaustiveCheck: never = experiment.productType;
          throw new Error(`Invalid experiment product type: ${exhaustiveCheck}`);
        }
      }

      return {
        ...validExperimentBase,
        configKey,
        experimentType: experiment.productType,
        durationDays: toValidDurationDays(experiment.duration),
      };
    }),
    total: total ?? 0,
  };
};

const toValidGetAudiencesResponse = (
  dangerousResponse: DangerousGetAudiencesResponse,
): ValidGetAudiencesResponse => {
  const { audiences, total } = dangerousResponse;

  const validAudiences: ValidAudience[] =
    audiences?.map((dangerousAudience) => {
      const { audienceId, name } = dangerousAudience;
      if (!audienceId) {
        handleError('Audience id is required');
      }
      if (!name) {
        handleError('Audience name is required');
      }
      return { audienceId, name };
    }) ?? [];

  return {
    audiences: validAudiences,
    nextPageToken: total ?? null,
  };
};

const toValidErrorType = (error: DangerousExperimentApiError) => {
  let validErrorType: ExperimentApiErrorType;
  if (error.errorType) {
    if (!isValidEnumValue(ExperimentApiErrorType, error.errorType)) {
      handleError(`Invalid experiment api error type: ${error.errorType}`);
    }
    validErrorType = error.errorType;
  } else {
    validErrorType = ExperimentApiErrorType.SystemError;
  }
  return validErrorType;
};

const toValidOperationBase = (operation?: DangerousExperimentOperation): ValidOperationBase => {
  if (!operation) {
    handleError('Experiment operation is required');
  }

  const { status, done, error } = operation;
  if (done && error) {
    return {
      done: true,
      isError: true,
      error: toValidErrorType(error),
    };
  }

  if (!status || !isValidEnumValue(ExperimentOperationStatus, status)) {
    handleError(`Invalid experiment operation status: ${status}`);
  }

  return done
    ? {
        done: true,
        isError: false,
        status,
      }
    : {
        done: false,
        status,
      };
};

const toValidExperimentOperationStatusResponse = (
  dangerousResponse: DangerousGetExperimentOperationStatusResponse,
): ValidGetExperimentOperationStatusResponse => {
  const validOperationBase = toValidOperationBase(dangerousResponse.operation);
  if (!validOperationBase.done || validOperationBase.isError) {
    return validOperationBase;
  }

  let validExperiment: ValidExperiment;
  try {
    validExperiment = toValidGetExperimentResponse({
      experiment: dangerousResponse.operation?.experiment,
    }).experiment;
  } catch (error) {
    // When an experiment is deleted (especially if it was a draft), the underlying data record may be removed.
    // As a result, the usual experiment validation will likely fail due to many experiment fields missing.
    // However, we should still expect to receive an experiment with a valid id and its state set to 'Deleted' at the minimum.
    // If that's the case, we can safely reconstruct a minimal valid 'Deleted' experiment. This allows downstream consumers
    // to handle the deleted state gracefully. Note that 'Deleted' experiments are not displayed in the UI,
    // so this fallback is safe. If the returned experiment does not meet these criteria, we re-throw the original validation error.
    const dangerousExperiment = dangerousResponse.operation?.experiment;

    if (
      dangerousExperiment?.state &&
      isValidArrayEnumValue([ExperimentState.Deleted], dangerousExperiment.state)
    ) {
      const { id } = dangerousExperiment;
      if (!id) {
        handleError('Experiment id is required');
      }

      validExperiment = {
        id,
        name: dangerousExperiment.name ?? '',
        createdBy: dangerousExperiment.createdBy ?? '',
        durationDays: 0,
        state: ExperimentState.Deleted,
        exposurePercent: 0,
        goalMetrics: [],
        learningMetrics: [],
        experimentType: ExperimentProductType.Configs,
        variants: [],
      };
    } else {
      throw error;
    }
  }

  return {
    ...validOperationBase,
    experiment: validExperiment,
  };
};

const toValidCompleteExperimentResponse = (
  dangerousResponse: DangerousCompleteExperimentResponse,
): ValidCompleteExperimentResponse => {
  const operationId = dangerousResponse.operation?.operationId;
  const validOperationBase = toValidOperationBase(dangerousResponse.operation);

  if (validOperationBase.done && validOperationBase.isError) {
    // When the post request returns an error, there may be no operation id.
    // In such cases, we use an empty string for operationId and allow downstream consumers to handle the error accordingly.
    return {
      ...validOperationBase,
      operationId: operationId ?? '',
    };
  }

  if (!operationId) {
    handleError('operation id is required');
  }

  return {
    ...validOperationBase,
    operationId,
  };
};

const toValidCreateExperimentResponse = (
  dangerousResponse: DangerousCreateExperimentResponse,
): ValidCreateExperimentResponse => {
  return toValidCompleteExperimentResponse(dangerousResponse);
};

const toValidUpdateExperimentResponse = (
  dangerousResponse: DangerousUpdateExperimentResponse,
): ValidUpdateExperimentResponse => {
  return toValidCompleteExperimentResponse(dangerousResponse);
};

const toValidStartExperimentResponse = (
  dangerousResponse: DangerousStartExperimentResponse,
): ValidStartExperimentResponse => {
  return toValidCompleteExperimentResponse(dangerousResponse);
};

const toValidDiscardExperimentResponse = (
  dangerousResponse: DangerousDiscardExperimentResponse,
): ValidDiscardExperimentResponse => {
  return toValidCompleteExperimentResponse(dangerousResponse);
};

const toValidRolloutExperimentResponse = (
  dangerousResponse: DangerousRolloutVariantResponse,
): ValidRolloutExperimentResponse => {
  return toValidCompleteExperimentResponse(dangerousResponse);
};

const validExperimentConfigurationToAPIExperimentConfiguration = ({
  experimentType,
  variants,
}: ValidExperimentConfigurationForCreation): ExperimentConfiguration => {
  let experimentConfiguration: ExperimentConfiguration;
  switch (experimentType) {
    case ExperimentProductType.Configs: {
      const singleConfigExperimentConfiguration: SingleConfigExperimentConfiguration = {
        variants: variants.map((variant) => ({
          variantMeta: {
            label: variant.label,
            weight: variant.weight,
            isBaseline: variant.isBaseline,
          },
          configEntry: {
            key: variant.configEntry.key,
            entryValue: toAPIConfigEntryValueForConfigsProductType(variant.configEntry.entryValue),
          },
        })),
      };
      experimentConfiguration = {
        productType: experimentType,
        singleConfigExperimentConfiguration,
      };
      break;
    }
    case ExperimentProductType.Matchmaking: {
      const matchmakingExperimentConfiguration: MatchmakingExperimentConfiguration = {
        variants: variants.map((variant) => ({
          variantMeta: {
            label: variant.label,
            weight: variant.weight,
            isBaseline: variant.isBaseline,
          },
          placeMatchmakingConfigs: variant.placeMatchmakingConfigs,
        })),
      };
      experimentConfiguration = {
        productType: experimentType,
        matchmakingExperimentConfiguration,
      };
      break;
    }
    default: {
      const exhaustiveCheck: never = experimentType;
      throw new Error(`Invalid experiment product type: ${exhaustiveCheck}`);
    }
  }

  return experimentConfiguration;
};

const toValidCalculateExperimentMdeDataResponse = (
  dangerousResponse: DangerousCalculateExperimentMdeResponse,
): ValidCalculateExperimentMdeDataResponse => {
  const { operation } = dangerousResponse;
  if (!operation) {
    handleError('Operation is required');
  }

  const { mde, done, error } = operation;

  if (!done) {
    return {
      done: false,
    };
  }

  if (error) {
    if (!error.code) {
      handleError('Error code is required');
    }

    return {
      done: true,
      isError: true,
      error: {
        code: error.code,
        message: error.message ?? '',
      },
    };
  }

  if (!mde) {
    handleError('MDE is required');
  }
  const { totalSampleSize, mdeRelativePercentages, minimumSampleSizeThreshold } = mde;
  if (totalSampleSize === undefined) {
    handleError('Total sample size is required');
  }
  if (mdeRelativePercentages === undefined) {
    handleError('MDE relative percentages is required');
  }
  if (minimumSampleSizeThreshold === undefined) {
    handleError('Minimum sample size threshold is required');
  }

  return {
    done: true,
    isError: false,
    mde: {
      totalSampleSize,
      mdeRelativePercentages,
      minimumSampleSizeThreshold,
    },
  };
};

const toValidGetExperimentResultsResponse = (
  dangerousResponse: DangerousGetLatestExperimentResultsResponse,
): ValidGetExperimentResultsResponse => {
  const { resultsOperation } = dangerousResponse;
  if (!resultsOperation) {
    handleError('Operation is required');
  }

  const { experimentResults, done, error } = resultsOperation;

  if (!done) {
    return {
      done: false,
    };
  }

  if (error) {
    return {
      done: true,
      isError: true,
      error: toValidErrorType(error),
    };
  }

  if (!experimentResults?.variantResults) {
    handleError('Experiment results are required');
  }

  const validVariantsResults: Map<
    string,
    Map<
      ExperimentMetric,
      {
        ciUpper: number;
        ciLower: number;
        controlMean: number;
        isStatisticallySignificant: boolean;
      }
    >
  > = new Map();

  Object.entries(experimentResults.variantResults).forEach(([variantId, { metricResults }]) => {
    if (!metricResults) {
      handleError(`Metric results are required for variant ${variantId}`);
    }
    validVariantsResults.set(variantId, new Map());

    metricResults.forEach(
      ({ metric, ciLower, ciUpper, controlMean, isStatisticallySignificant }) => {
        if (!metric) {
          handleError(
            `Metric is required for variant ${variantId} when getting experiment results`,
          );
        }

        if (!isValidEnumValue(ExperimentMetric, metric)) {
          return;
        }

        if (ciUpper === undefined) {
          handleError(
            `CI upper is required for variant ${variantId} when getting experiment results`,
          );
        }
        if (ciLower === undefined) {
          handleError(
            `CI lower is required for variant ${variantId} when getting experiment results`,
          );
        }
        if (controlMean === undefined) {
          handleError(
            `Control mean is required for variant ${variantId} when getting experiment results`,
          );
        }

        validVariantsResults.get(variantId)?.set(metric, {
          ciUpper,
          ciLower,
          controlMean,
          isStatisticallySignificant: isStatisticallySignificant ?? false,
        });
      },
    );
  });

  if (!experimentResults.resultsTime) {
    handleError('Results time is required');
  }

  return {
    done: true,
    isError: false,
    experimentResults: {
      variantResults: validVariantsResults,
      resultsTime: new Date(experimentResults.resultsTime),
    },
  };
};

const toValidGetExperimentStatsResponse = (
  dangerousResponse: DangerousGetExperimentStatsResponse,
): ValidGetExperimentStatsResponse => {
  const { operation } = dangerousResponse;
  if (!operation) {
    handleError('Operation is required');
  }

  const { done, error, experimentStats } = operation;

  if (!done) {
    return {
      done: false,
    };
  }

  if (error) {
    return {
      done: true,
      isError: true,
      error: {
        code: error.code ?? 418, // 🫖 I'm a teapot
        message: error.message ?? '',
      },
    };
  }

  if (!experimentStats) {
    handleError('Experiment stats are required');
  }

  const { isSrmDetected } = experimentStats;

  return {
    done: true,
    isError: false,
    experimentStats: {
      isSrmDetected: isSrmDetected ?? false,
    },
  };
};

const makeValidatedExperimentationAPI = (
  given: UniverseExperimentationAPIApi,
): ValidExperimentationAPI => {
  return {
    v1UniversesUniverseIdExperimentExperimentIdGet: async (
      requestParameters: InternalV1UniversesUniverseIdExperimentExperimentIdGetRequest,
    ) => {
      const dangerousResponse =
        await given.v1UniversesUniverseIdExperimentExperimentIdGet(requestParameters);
      return toValidGetExperimentResponse(dangerousResponse);
    },
    v1UniversesUniverseIdAudiencesGet: async (
      requestParameters: InternalUniversesUniverseIdAudiencesGetRequest,
    ): Promise<ValidGetAudiencesResponse> => {
      const dangerousResponse = await given.v1UniversesUniverseIdAudiencesGet(requestParameters);
      return toValidGetAudiencesResponse(dangerousResponse);
    },
    v1UniversesUniverseIdExperimentExperimentIdcompletePost: async (
      requestParameters: InternalV1UniversesUniverseIdExperimentExperimentIdcompletePostRequest,
    ) => {
      const dangerousResponse = await given.v1UniversesUniverseIdExperimentExperimentIdcompletePost(
        {
          universeId: requestParameters.universeId,
          experimentId: requestParameters.experimentId,
          rolloutVariantData: {
            variantId: requestParameters.variantId,
          },
        },
      );
      return toValidCompleteExperimentResponse(dangerousResponse);
    },
    v1UniversesUniverseIdOperationOperationIdGet: async (
      requestParameters: InternalV1UniversesUniverseIdOperationOperationIdGetRequest,
    ) => {
      const dangerousResponse = await given.v1UniversesUniverseIdOperationOperationIdGet({
        universeId: requestParameters.universeId,
        operationId: requestParameters.operationId,
      });
      return toValidExperimentOperationStatusResponse(dangerousResponse);
    },
    v1UniversesUniverseIdExperimentPost: async (
      requestParameters: InternalV1UniversesUniverseIdExperimentPostRequest,
    ) => {
      const { universeId, name, description, exposurePercent, goalMetric, durationDays } =
        requestParameters;
      const dangerousResponse = await given.v1UniversesUniverseIdExperimentPost({
        universeId,
        createExperimentData: {
          name,
          description,
          experimentConfiguration:
            validExperimentConfigurationToAPIExperimentConfiguration(requestParameters),
          exposurePercent,
          duration: toValidDurationString(durationDays),
          universeGoalMetrics: [goalMetric],
        },
      });
      return toValidCreateExperimentResponse(dangerousResponse);
    },
    v1UniversesUniverseIdExperimentExperimentIdPatch: async (
      requestParameters: InternalV1UniversesUniverseIdExperimentExperimentIdPatchRequest,
    ) => {
      const {
        universeId,
        experimentName,
        experimentId,
        exposurePercent,
        goalMetric,
        durationDays,
      } = requestParameters;
      const dangerousResponse = await given.v1UniversesUniverseIdExperimentExperimentIdPatch({
        universeId,
        experimentId,
        updateExperimentData: {
          name: experimentName,
          exposurePercent,
          universeGoalMetrics: [goalMetric],
          duration: toValidDurationString(durationDays),
          experimentConfiguration:
            validExperimentConfigurationToAPIExperimentConfiguration(requestParameters),
        },
      });
      return toValidUpdateExperimentResponse(dangerousResponse);
    },
    v1UniversesUniverseIdExperimentExperimentIdstartPost: async (
      requestParameters: InternalV1UniversesUniverseIdExperimentExperimentIdstartPostRequest,
    ) => {
      const { scheduledAt } = requestParameters;
      const dangerousResponse = await given.v1UniversesUniverseIdExperimentExperimentIdstartPost({
        universeId: requestParameters.universeId,
        experimentId: requestParameters.experimentId,
        startExperimentData: {
          scheduledStartTime: scheduledAt ?? undefined,
          isScheduled: !!scheduledAt,
        },
      });
      return toValidStartExperimentResponse(dangerousResponse);
    },
    v1UniversesUniverseIdExperimentsGet: async (
      requestParameters: InternalV1UniversesUniverseIdExperimentsGetRequest,
    ) => {
      const dangerousResponse = await given.v1UniversesUniverseIdExperimentsGet(requestParameters);
      return toValidGetExperimentsResponse(dangerousResponse);
    },
    v1UniversesUniverseIdExperimentExperimentIddiscardPost: async (
      requestParameters: InternalV1UniversesUniverseIdExperimentExperimentIddiscardPostRequest,
    ) => {
      const dangerousResponse =
        await given.v1UniversesUniverseIdExperimentExperimentIddiscardPost(requestParameters);
      return toValidDiscardExperimentResponse(dangerousResponse);
    },
    v1UniversesUniverseIdExperimentExperimentIdrolloutPost: async (
      requestParameters: InternalV1UniversesUniverseIdExperimentExperimentIdrolloutPostRequest,
    ) => {
      const dangerousResponse = await given.v1UniversesUniverseIdExperimentExperimentIdrolloutPost({
        universeId: requestParameters.universeId,
        experimentId: requestParameters.experimentId,
        rolloutVariantData: {
          variantId: requestParameters.variantId,
        },
      });
      return toValidRolloutExperimentResponse(dangerousResponse);
    },
    v1UniversesUniverseIdExperimentMdePost: async (
      requestParameters: InternalV1UniversesUniverseIdExperimentMdePostRequest,
    ) => {
      const dangerousResponse =
        await given.v1UniversesUniverseIdExperimentMdePost(requestParameters);
      return toValidCalculateExperimentMdeDataResponse(dangerousResponse);
    },
    v1UniversesUniverseIdExperimentExperimentIdResultsGet: async (
      requestParameters: InternalV1UniversesUniverseIdExperimentExperimentIdResultsGetRequest,
    ) => {
      const dangerousResponse =
        await given.v1UniversesUniverseIdExperimentExperimentIdResultsGet(requestParameters);
      return toValidGetExperimentResultsResponse(dangerousResponse);
    },
    v1UniversesUniverseIdExperimentExperimentIdStatsGet: async (
      requestParameters: InternalV1UniversesUniverseIdExperimentExperimentIdStatsGetRequest,
    ) => {
      const dangerousResponse =
        await given.v1UniversesUniverseIdExperimentExperimentIdStatsGet(requestParameters);
      return toValidGetExperimentStatsResponse(dangerousResponse);
    },
  };
};

export default makeValidatedExperimentationAPI;
