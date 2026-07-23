import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Grid } from '@rbx/ui';
import {
  ExperimentOperationStatus,
  ExperimentProductType,
} from '../../api/universeExperimentationClientEnums';
import type { ValidExperiment } from '../../api/validExperimentationTypes';
import useCanConfigureOrPublish from '../../hooks/useCanConfigureOrPublish';
import {
  hasTargetingCriteriaTokens,
  targetingClausesToTargetingCriteria,
} from '../../utils/experimentTargetingTransforms';
import ConfigsExperimentConfigurationStep from '../configs/ConfigsExperimentConfigurationStep';
import useVariantsConfigurationProvider from '../context/VariantsConfigurationContext';
import useExperimentActionsWithOperationStatusObserver from '../hooks/useExperimentActionWithOperationStatusObserver';
import MatchmakingExperimentConfigurationStep from '../matchmaking-experiments/MatchmakingExperimentConfigurationStep';
import type { ExperimentFormData } from '../types/FormData';
import { configurationStepFormDataKeys, setupStepFormDataKeys } from '../types/FormData';
import { defaultGoalMetrics } from '../utils/getDefaultFormData';
import CreationStepperButtons from './CreationStepperButtons';
import MDECardInForm from './MDECardInForm';

type ExperimentConfigurationStepProps = {
  onPrev: () => void;
  onCancel: () => void;
  experimentType: ExperimentProductType;
  experiment?: ValidExperiment;
  onNext: (experimentId?: string) => void;
};

const ExperimentConfigurationStep: FC<ExperimentConfigurationStepProps> = ({
  onPrev,
  onCancel,
  experimentType,
  experiment: givenExperiment,
  onNext,
}) => {
  const { canPublish, publishErrorMessage } = useCanConfigureOrPublish();
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    getFieldState,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- test
    formState: { dirtyFields },
  } = useFormContext<ExperimentFormData>();
  const { createExperiment, updateExperiment, getExperimentOperationStatus } =
    useExperimentActionsWithOperationStatusObserver();
  const { transformVariantsFormDataToValidVariants } =
    useVariantsConfigurationProvider(experimentType);

  const onExperimentUpdateOperationSuccess = useCallback(
    ({ experiment }: { experiment: ValidExperiment }) => {
      // After successfully creating or updating an experiment, reset the form values to clear the 'isDirty' state.
      // This ensures that clicking 'Next' again won't trigger another update if the form hasn't changed.
      reset(getValues());
      onNext(experiment.id);
    },
    [getValues, onNext, reset],
  );

  const configurationForm = useMemo(() => {
    switch (experimentType) {
      case ExperimentProductType.Configs:
        return <ConfigsExperimentConfigurationStep />;
      case ExperimentProductType.Matchmaking:
        return <MatchmakingExperimentConfigurationStep />;
      default: {
        const exhaustiveCheck: never = experimentType;
        return exhaustiveCheck;
      }
    }
  }, [experimentType]);

  const onSubmit = useMemo(
    () =>
      handleSubmit(async (data: ExperimentFormData) => {
        const validExperimentConfig = transformVariantsFormDataToValidVariants(data);

        if (givenExperiment) {
          if (
            setupStepFormDataKeys.every((key) => !getFieldState(key).isDirty) &&
            configurationStepFormDataKeys.every((key) => !getFieldState(key).isDirty)
          ) {
            // Skip updating experiment if nothing changed
            onNext();
            return;
          }

          const shouldPreserveEmptyTargetingRule = hasTargetingCriteriaTokens(
            givenExperiment.targetingCriteria,
          );

          const targetingCriteria =
            experimentType === ExperimentProductType.Configs
              ? targetingClausesToTargetingCriteria(data.targetingClauses, {
                  shouldPreserveEmptyRule: shouldPreserveEmptyTargetingRule,
                })
              : undefined;

          updateExperiment(
            {
              experimentId: givenExperiment.id,
              experimentName: data.name,
              exposurePercent: data.exposurePercent,
              goalMetric: data.goalMetric ?? defaultGoalMetrics[0],
              durationDays: data.durationDays,
              targetingCriteria,
              ...validExperimentConfig,
            },
            {
              onSuccess: onExperimentUpdateOperationSuccess,
            },
          );
        } else {
          createExperiment(
            {
              experimentName: data.name,
              exposurePercent: data.exposurePercent,
              goalMetric: data.goalMetric ?? defaultGoalMetrics[0],
              durationDays: data.durationDays,
              targetingCriteria:
                experimentType === ExperimentProductType.Configs
                  ? targetingClausesToTargetingCriteria(data.targetingClauses)
                  : undefined,
              ...validExperimentConfig,
            },
            {
              onSuccess: onExperimentUpdateOperationSuccess,
            },
          );
        }
      }),
    [
      handleSubmit,
      transformVariantsFormDataToValidVariants,
      givenExperiment,
      updateExperiment,
      onExperimentUpdateOperationSuccess,
      getFieldState,
      onNext,
      createExperiment,
      experimentType,
    ],
  );

  const experimentName = useWatch({ control, name: 'name' });
  const experimentStatus = useMemo(() => {
    // If no 'givenExperiment' exists, meaning we are creating a new experiment
    // Use experimentName as the key to grab operation status
    return getExperimentOperationStatus(givenExperiment?.id ?? experimentName);
  }, [givenExperiment?.id, experimentName, getExperimentOperationStatus]);

  const isCreatingOrUpdatingExperiment =
    experimentStatus === ExperimentOperationStatus.Creating ||
    experimentStatus === ExperimentOperationStatus.Updating;

  // Configuration step requires experimentName to be set
  // If the experiment name is not set, go back to the previous step
  useEffect(() => {
    if (!experimentName) {
      onPrev();
    }
  }, [experimentName, onPrev]);

  return (
    <Grid
      container
      flexDirection='column'
      gap='32px'
      width='100%'
      component='form'
      onSubmit={onSubmit}>
      {configurationForm}
      <MDECardInForm forceInSeparateContainer />
      <CreationStepperButtons
        isCancelButtonDisabled={isCreatingOrUpdatingExperiment}
        isPrevButtonDisabled={isCreatingOrUpdatingExperiment}
        onCancel={onCancel}
        isSubmitButtonLoading={isCreatingOrUpdatingExperiment}
        isSubmitButtonDisabled={!canPublish}
        message={canPublish ? undefined : publishErrorMessage}
        onPrev={onPrev}
      />
    </Grid>
  );
};

export default ExperimentConfigurationStep;
