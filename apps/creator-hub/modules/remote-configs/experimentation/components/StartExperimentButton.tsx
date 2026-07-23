import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TButtonProps } from '@rbx/ui';
import { Button, Tooltip } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  ExperimentApiErrorType,
  ExperimentOperationStatus,
  ExperimentProductType,
} from '../../api/universeExperimentationClientEnums';
import type { ValidExperiment } from '../../api/validExperimentationTypes';
import useCanConfigureOrPublish from '../../hooks/useCanConfigureOrPublish';
import useExperimentActionsWithOperationStatusObserver from '../hooks/useExperimentActionWithOperationStatusObserver';
import useShouldUpdateVariantsBeforeStarting from '../hooks/useShouldUpdateVariantsBeforeStarting';
import useShouldUpdateVariantsBeforeStartingForMatchmaking from '../hooks/useShouldUpdateVariantsBeforeStartingForMatchmaking';
import useShowErrorMessageInToast from '../hooks/useShowErrorMessageInToast';
import type { ShouldUpdateVariantsBeforeStarting } from '../types/ShouldUpdateVairantsBeforeStarting';
import { CheckingShouldUpdateVariantsError } from '../types/ShouldUpdateVairantsBeforeStarting';
import { defaultGoalMetrics } from '../utils/getDefaultFormData';

type StartExperimentButtonProps = {
  experiment: ValidExperiment;
  shouldUpdateVariantsBeforeStarting: ShouldUpdateVariantsBeforeStarting;
  variant?: TButtonProps['variant'];
  color?: TButtonProps['color'];
  size?: TButtonProps['size'];
};

const StartExperimentButtonBase = ({
  experiment,
  shouldUpdateVariantsBeforeStarting,
  variant = 'contained',
  color = 'primaryBrand',
  size = 'medium',
}: StartExperimentButtonProps) => {
  const showErrorMessageInToast = useShowErrorMessageInToast();
  const { translate } = useTranslationWrapper(useTranslation());
  const { canPublish, publishErrorMessage } = useCanConfigureOrPublish();
  const { startOrScheduleExperiment, updateExperiment, getExperimentOperationStatus } =
    useExperimentActionsWithOperationStatusObserver();
  const experimentStatus = useMemo(
    () => getExperimentOperationStatus(experiment.id),
    [experiment.id, getExperimentOperationStatus],
  );

  const [isCheckingShouldUpdateVariants, setIsCheckingShouldUpdateVariants] = useState(false);
  const [shouldUpdateVariantsError, setShouldUpdateVariantsError] =
    useState<CheckingShouldUpdateVariantsError | null>(null);

  const checkShouldUpdateVariants = useCallback(async () => {
    try {
      setIsCheckingShouldUpdateVariants(true);
      const result = await shouldUpdateVariantsBeforeStarting();
      if (!result.shouldUpdateVariants && result.error) {
        setShouldUpdateVariantsError(result.error);
      } else {
        setShouldUpdateVariantsError(null);
      }
      return result;
    } catch {
      showErrorMessageInToast(ExperimentApiErrorType.SystemError);
    } finally {
      setIsCheckingShouldUpdateVariants(false);
    }
    return { shouldUpdateVariants: false as const };
  }, [shouldUpdateVariantsBeforeStarting, showErrorMessageInToast]);

  const onClick = useCallback(async () => {
    try {
      const result = await checkShouldUpdateVariants();
      if (result.shouldUpdateVariants) {
        const { shouldUpdateVariants, ...updates } = result;
        updateExperiment(
          {
            experimentId: experiment.id,
            experimentName: experiment.name,
            exposurePercent: experiment.exposurePercent,
            goalMetric:
              experiment.goalMetrics.find((metric) => !defaultGoalMetrics.includes(metric)) ??
              experiment.goalMetrics[0],
            durationDays: experiment.durationDays,
            targetingCriteria: experiment.targetingCriteria,
            ...updates,
          },
          {
            onSuccess: () => {
              startOrScheduleExperiment({ experimentId: experiment.id, scheduledAt: null });
            },
          },
        );
      } else if (!result.error) {
        startOrScheduleExperiment({ experimentId: experiment.id, scheduledAt: null });
      }
    } catch {
      showErrorMessageInToast(ExperimentApiErrorType.SystemError);
    }
  }, [
    checkShouldUpdateVariants,
    experiment.durationDays,
    experiment.exposurePercent,
    experiment.goalMetrics,
    experiment.id,
    experiment.name,
    experiment.targetingCriteria,
    showErrorMessageInToast,
    startOrScheduleExperiment,
    updateExperiment,
  ]);

  const isLoading =
    isCheckingShouldUpdateVariants ||
    experimentStatus === ExperimentOperationStatus.Starting ||
    experimentStatus === ExperimentOperationStatus.Updating;

  const errorMessage = useMemo(() => {
    if (!canPublish) {
      return publishErrorMessage;
    }

    if (!shouldUpdateVariantsError) {
      return undefined;
    }

    switch (shouldUpdateVariantsError) {
      case CheckingShouldUpdateVariantsError.NO_TARGETING_CONFIG_FOUND:
        return 'Targeting config not found';
      default: {
        const exhaustiveCheck: never = shouldUpdateVariantsError;
        throw new Error(`Unknown shouldUpdateVariantsError: ${String(exhaustiveCheck)}`);
      }
    }
  }, [canPublish, publishErrorMessage, shouldUpdateVariantsError]);

  // Check should update variants when the component mounts
  const checkShouldUpdateVariantsRef = useRef(checkShouldUpdateVariants);
  useEffect(() => {
    void checkShouldUpdateVariantsRef.current();
  }, [checkShouldUpdateVariantsRef]);

  return (
    <Tooltip title={errorMessage}>
      <span>
        <Button
          variant={variant}
          color={color}
          onClick={onClick}
          loading={isLoading}
          size={size}
          disabled={!!errorMessage}>
          {translate(
            translationKey(
              'Action.ExperimentCreation.StartExperiment',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Button>
      </span>
    </Tooltip>
  );
};

const StartExperimentButtonForConfigs = ({
  experiment,
  ...props
}: Omit<StartExperimentButtonProps, 'shouldUpdateVariantsBeforeStarting'> & {
  experiment: ValidExperiment & { experimentType: ExperimentProductType.Configs };
}) => {
  const shouldUpdateVariantsBeforeStarting = useShouldUpdateVariantsBeforeStarting({
    experiment,
  });

  return (
    <StartExperimentButtonBase
      {...props}
      experiment={experiment}
      shouldUpdateVariantsBeforeStarting={shouldUpdateVariantsBeforeStarting}
    />
  );
};

const StartExperimentButtonForMatchmaking = ({
  experiment,
  ...props
}: Omit<StartExperimentButtonProps, 'shouldUpdateVariantsBeforeStarting'> & {
  experiment: ValidExperiment & { experimentType: ExperimentProductType.Matchmaking };
}) => {
  const shouldUpdateVariantsBeforeStarting = useShouldUpdateVariantsBeforeStartingForMatchmaking({
    experiment,
  });

  return (
    <StartExperimentButtonBase
      {...props}
      experiment={experiment}
      shouldUpdateVariantsBeforeStarting={shouldUpdateVariantsBeforeStarting}
    />
  );
};

const StartExperimentButton = ({
  experiment,
  ...props
}: Omit<StartExperimentButtonProps, 'shouldUpdateVariantsBeforeStarting'>) => {
  switch (experiment.experimentType) {
    case ExperimentProductType.Configs:
      return <StartExperimentButtonForConfigs {...props} experiment={experiment} />;
    case ExperimentProductType.Matchmaking:
      return <StartExperimentButtonForMatchmaking {...props} experiment={experiment} />;
    default: {
      const exhaustiveCheck: never = experiment;
      throw new Error(`Unknown experiment type: ${String(exhaustiveCheck)}`);
    }
  }
};

export default StartExperimentButton;
