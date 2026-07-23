import { useUniverseResource } from '@modules/experience-analytics-shared';
import { useCallback } from 'react';
import { QueryClient, UseMutateFunction, useMutation, useQueryClient } from '@tanstack/react-query';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ValidCompleteExperimentResponse,
  ValidExperiment,
  ValidExperimentConfigurationForCreation,
  ValidGetExperimentOperationStatusResponse,
} from '../../api/validExperimentationTypes';
import {
  ExperimentApiErrorType,
  ExperimentMetric,
  ExperimentOperationStatus,
} from '../../api/universeExperimentationClientEnums';
import { useCreatorExperimentationClient } from '../../CreatorExperimentationClientProvider';
import { getExperimentQueryKey } from './useExperiment';
import { refreshExperimentsList } from './useExperimentsList';
import useShowErrorMessageInToast from './useShowErrorMessageInToast';
import useCallbackWithQueryCacheBreaker from './useCallbackWithQueryCacheBreaker';
import isExperimentCreationErrorDueToDuplicatedName from '../utils/isExperimentCreationErrorDueToDuplicatedName';

type CreationParams = {
  experimentName: string;
  exposurePercent: number;
  goalMetric: ExperimentMetric;
  durationDays: number;
} & ValidExperimentConfigurationForCreation;

type UpdateParams = {
  experimentId: string;
} & CreationParams;

export type CompleteExperiment = UseMutateFunction<
  {
    operationId: string;
    status: ExperimentOperationStatus;
    experiment: ValidExperiment;
  },
  unknown,
  {
    experimentId: string;
    variantId: string;
  }
>;

export type StartOrScheduleExperiment = UseMutateFunction<
  {
    operationId: string;
    status: ExperimentOperationStatus;
    experiment: ValidExperiment;
  },
  unknown,
  {
    experimentId: string;
    scheduledAt: string | null;
  }
>;

export type UpdateExperiment = UseMutateFunction<
  {
    operationId: string;
    status: ExperimentOperationStatus;
    experiment: ValidExperiment;
  },
  unknown,
  UpdateParams
>;

export type CreateExperiment = UseMutateFunction<
  {
    operationId: string;
    status: ExperimentOperationStatus;
    experiment: ValidExperiment;
  },
  unknown,
  CreationParams
>;

export type DiscardExperiment = UseMutateFunction<
  {
    operationId: string;
    status: ExperimentOperationStatus;
    experiment: ValidExperiment;
  },
  unknown,
  { experimentId: string }
>;

export type RolloutExperiment = UseMutateFunction<
  {
    operationId: string;
    status: ExperimentOperationStatus;
    experiment: ValidExperiment;
  },
  unknown,
  {
    experimentId: string;
    variantId: string;
  }
>;

type ExperimentOperationCacheData = {
  expectedOperationStatus: ExperimentOperationStatus;
  operation?: ValidGetExperimentOperationStatusResponse;
};

const OPERATION_STATUS_CACHE_KEY_PREFIX = 'experiment-operation-status';
// Typically, cacheKey refers to the experiment id.
// However, when creating a new experiment (before the id exists), we use the experiment name as the key.
const getExperimentOperationCacheKey = (cacheKey: string) => [
  OPERATION_STATUS_CACHE_KEY_PREFIX,
  cacheKey,
];
const setExperimentOperationCache = (
  queryClient: QueryClient,
  cacheKey: string,
  data: ExperimentOperationCacheData,
) => {
  queryClient.setQueryData<ExperimentOperationCacheData>(
    getExperimentOperationCacheKey(cacheKey),
    data,
  );
};
const removeExperimentOperationCache = (queryClient: QueryClient, cacheKey: string) => {
  queryClient.removeQueries({
    queryKey: getExperimentOperationCacheKey(cacheKey),
  });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const interval = 2000; // 2 seconds
const initialInterval = interval * 2; // 4 seconds
const maxAttempts = 20;

const useExperimentActionsWithOperationStatusObserver = (): {
  completeExperiment: CompleteExperiment;
  startOrScheduleExperiment: StartOrScheduleExperiment;
  updateExperiment: UpdateExperiment;
  createExperiment: CreateExperiment;
  discardExperiment: DiscardExperiment;
  rolloutExperiment: RolloutExperiment;
  getExperimentOperationStatus: (
    experimentId: string,
  ) => ExperimentOperationStatus | ExperimentApiErrorType | null;
} => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  const showErrorMessageInToast = useShowErrorMessageInToast();
  const client = useCreatorExperimentationClient();
  const queryClient = useQueryClient();

  const fetchOperationStatus = useCallback(
    async (operationId: string) => {
      return client.v1UniversesUniverseIdOperationOperationIdGet({
        universeId,
        operationId,
      });
    },
    [client, universeId],
  );

  const pollOperationStatus = useCallback(
    async ({ cacheKey, operationId }: { cacheKey: string; operationId: string }) => {
      let operation = await fetchOperationStatus(operationId);
      if ('status' in operation) {
        setExperimentOperationCache(queryClient, cacheKey, {
          operation,
          expectedOperationStatus: operation.status,
        });
      }

      let attempts = 1;
      while (!operation.done) {
        if (attempts > maxAttempts) {
          throw new Error('Error: reached out max number of attempts');
        }

        await sleep(attempts > 1 ? interval : initialInterval); // eslint-disable-line no-await-in-loop -- sleep in between requests to provide time for the op to resolve
        operation = await fetchOperationStatus(operationId); // eslint-disable-line no-await-in-loop -- make requests serially until one succeeds

        if ('status' in operation) {
          setExperimentOperationCache(queryClient, cacheKey, {
            operation,
            expectedOperationStatus: operation.status,
          });
        }

        attempts += 1;
      }

      return {
        operationId,
        operation,
      };
    },
    [fetchOperationStatus, queryClient],
  );

  const onError = useCallback(
    async ({ error, cacheKey }: { error: unknown; cacheKey: string }) => {
      if (typeof error === 'string' && isValidEnumValue(ExperimentApiErrorType, error)) {
        showErrorMessageInToast(error);
      } else if (await isExperimentCreationErrorDueToDuplicatedName(error)) {
        showErrorMessageInToast(
          translate(
            translationKey(
              'Label.Error.ExperimentOperation.ExperimentWithSameNameAlreadyExist',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
        );
      } else {
        showErrorMessageInToast(ExperimentApiErrorType.SystemError);
      }

      removeExperimentOperationCache(queryClient, cacheKey);
    },
    [queryClient, showErrorMessageInToast, translate],
  );

  const onPostCallSucceed = useCallback(
    ({ response, cacheKey }: { response: ValidCompleteExperimentResponse; cacheKey: string }) => {
      if (response.done && response.isError) {
        return Promise.reject(response.error);
      }

      const { operationId } = response;
      setExperimentOperationCache(queryClient, cacheKey, {
        expectedOperationStatus: response.status,
      });

      return pollOperationStatus({
        cacheKey,
        operationId,
      }).then(({ operation }) => {
        if (operation.isError) {
          return Promise.reject(operation.error);
        }

        // 1. refetch experiment list
        refreshExperimentsList({ universeId, queryClient });

        // 2. Update experiment in query cache directly instead of refetch experiment
        const { experiment } = operation;
        queryClient.setQueryData(getExperimentQueryKey(experiment.id, universeId), {
          experiment,
        });

        // 3. Remove operation status cache
        removeExperimentOperationCache(queryClient, cacheKey);

        return {
          operationId,
          status: operation.status,
          experiment: operation.experiment,
        };
      });
    },
    [pollOperationStatus, queryClient, universeId],
  );

  const { mutate: completeExperiment } = useMutation({
    mutationFn: ({ variantId, experimentId }: { variantId: string; experimentId: string }) => {
      return client
        .v1UniversesUniverseIdExperimentExperimentIdcompletePost({
          universeId,
          experimentId,
          variantId,
        })
        .then((response) =>
          onPostCallSucceed({
            response,
            cacheKey: experimentId,
          }),
        );
    },
    onMutate: ({ experimentId }) => {
      setExperimentOperationCache(queryClient, experimentId, {
        expectedOperationStatus: ExperimentOperationStatus.Stopping,
      });
    },
    onError: (error, { experimentId }) => onError({ error, cacheKey: experimentId }),
  });

  const { mutate: startOrScheduleExperiment } = useMutation({
    mutationFn: ({
      experimentId,
      scheduledAt,
    }: {
      experimentId: string;
      scheduledAt: string | null;
    }) =>
      client
        .v1UniversesUniverseIdExperimentExperimentIdstartPost({
          universeId,
          experimentId,
          scheduledAt,
        })
        .then((response) =>
          onPostCallSucceed({
            response,
            cacheKey: experimentId,
          }),
        ),
    onMutate: ({ experimentId, scheduledAt }) => {
      setExperimentOperationCache(queryClient, experimentId, {
        expectedOperationStatus: scheduledAt
          ? ExperimentOperationStatus.Scheduling
          : ExperimentOperationStatus.Starting,
      });
    },
    onError: (error, { experimentId }) => onError({ error, cacheKey: experimentId }),
  });

  const { mutate: updateExperiment } = useMutation({
    mutationFn: ({
      experimentId,
      experimentName,
      exposurePercent,
      goalMetric,
      durationDays,
      ...experimentConfiguration
    }: UpdateParams) =>
      client
        .v1UniversesUniverseIdExperimentExperimentIdPatch({
          universeId,
          experimentId,
          experimentName,
          exposurePercent,
          goalMetric,
          durationDays,
          ...experimentConfiguration,
        })
        .then((response) =>
          onPostCallSucceed({
            response,
            cacheKey: experimentId,
          }),
        ),
    onMutate: ({ experimentId }) => {
      setExperimentOperationCache(queryClient, experimentId, {
        expectedOperationStatus: ExperimentOperationStatus.Updating,
      });
    },
    onError: (error, { experimentId }) => onError({ error, cacheKey: experimentId }),
  });

  const { mutate: createExperiment } = useMutation({
    mutationFn: ({
      experimentName,
      exposurePercent,
      goalMetric,
      durationDays,
      ...validExperimentConfiguration
    }: CreationParams) =>
      client
        .v1UniversesUniverseIdExperimentPost({
          universeId,
          name: experimentName,
          exposurePercent,
          goalMetric,
          durationDays,
          ...validExperimentConfiguration,
        })
        .then((response) =>
          onPostCallSucceed({
            response,
            cacheKey: experimentName,
          }),
        ),
    onMutate: ({ experimentName }) => {
      setExperimentOperationCache(queryClient, experimentName, {
        expectedOperationStatus: ExperimentOperationStatus.Creating,
      });
    },
    onError: (error, { experimentName }) => onError({ error, cacheKey: experimentName }),
  });

  const { mutate: discardExperiment } = useMutation({
    mutationFn: ({ experimentId }: { experimentId: string }) =>
      client
        .v1UniversesUniverseIdExperimentExperimentIddiscardPost({
          universeId,
          experimentId,
        })
        .then((response) =>
          onPostCallSucceed({
            response,
            cacheKey: experimentId,
          }),
        ),
    onMutate: ({ experimentId }) => {
      setExperimentOperationCache(queryClient, experimentId, {
        expectedOperationStatus: ExperimentOperationStatus.Deleting,
      });
    },
    onError: (error, { experimentId }) => onError({ error, cacheKey: experimentId }),
  });

  const { mutate: rolloutExperiment } = useMutation({
    mutationFn: ({ variantId, experimentId }: { variantId: string; experimentId: string }) => {
      return client
        .v1UniversesUniverseIdExperimentExperimentIdrolloutPost({
          universeId,
          experimentId,
          variantId,
        })
        .then((response) =>
          onPostCallSucceed({
            response,
            cacheKey: experimentId,
          }),
        );
    },
    onMutate: ({ experimentId }) => {
      setExperimentOperationCache(queryClient, experimentId, {
        expectedOperationStatus: ExperimentOperationStatus.RollingOut,
      });
    },
    onError: (error, { experimentId }) => onError({ error, cacheKey: experimentId }),
  });

  const getExperimentOperationStatus = useCallbackWithQueryCacheBreaker(
    (cacheKey: string) => {
      const data = queryClient.getQueryData<ExperimentOperationCacheData>(
        getExperimentOperationCacheKey(cacheKey),
      );
      if (!data) {
        return null;
      }

      const { operation, expectedOperationStatus } = data;
      if (!operation?.done) {
        return expectedOperationStatus;
      }

      return operation.isError ? operation.error : operation.status;
    },
    [queryClient],
    queryClient.getQueryCache(),
    OPERATION_STATUS_CACHE_KEY_PREFIX,
  );

  return {
    completeExperiment,
    startOrScheduleExperiment,
    updateExperiment,
    createExperiment,
    discardExperiment,
    rolloutExperiment,
    getExperimentOperationStatus,
  };
};

export default useExperimentActionsWithOperationStatusObserver;
