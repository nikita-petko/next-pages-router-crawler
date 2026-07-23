import { FormMode } from '@modules/miscellaneous/common';
import React, { FC, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ValidExperiment } from '../../api/validExperimentationTypes';
import {
  ExperimentProductType,
  ExperimentState,
} from '../../api/universeExperimentationClientEnums';
import { ExperimentFormData } from '../types/FormData';
import useVariantsConfigurationProvider from './VariantsConfigurationContext';
import { defaultGoalMetrics, getDefaultFormData } from '../utils/getDefaultFormData';

type ExperimentCreationFormProviderProps = {
  experimentType: ExperimentProductType;
  experiment?: ValidExperiment;
  children: React.ReactNode;
};

const ExperimentCreationFormProvider: FC<ExperimentCreationFormProviderProps> = ({
  experimentType,
  experiment,
  children,
}) => {
  const { transformValidVariantsToFormData: transformToConfigsFormData } =
    useVariantsConfigurationProvider(ExperimentProductType.Configs);
  const { transformValidVariantsToFormData: transformToMatchmakingFormData } =
    useVariantsConfigurationProvider(ExperimentProductType.Matchmaking);

  const defaultFormValues: ExperimentFormData = useMemo(() => {
    if (!experiment) {
      return getDefaultFormData(experimentType);
    }
    const { name, goalMetrics, exposurePercent, durationDays } = experiment;

    const defaultFormData = getDefaultFormData(experiment.experimentType);

    const base = {
      ...defaultFormData,
      scheduledAt:
        experiment.state === ExperimentState.Scheduled
          ? experiment.scheduledTime
          : defaultFormData.scheduledAt,
      name,
      exposurePercent,
      goalMetric:
        goalMetrics.find((metric) => !defaultGoalMetrics.includes(metric)) ?? goalMetrics[0],
      durationDays,
    };

    switch (experiment.experimentType) {
      case ExperimentProductType.Configs:
        return {
          ...base,
          ...transformToConfigsFormData(experiment.variants),
        };
      case ExperimentProductType.Matchmaking:
        return {
          ...base,
          ...transformToMatchmakingFormData(experiment.variants),
        };
      default: {
        const exhaustiveCheck: never = experiment;
        throw new Error(`Unknown experiment type: ${exhaustiveCheck}`);
      }
    }
  }, [experiment, experimentType, transformToConfigsFormData, transformToMatchmakingFormData]);

  const methods = useForm<ExperimentFormData>({
    defaultValues: defaultFormValues,
    mode: FormMode.All,
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

export default ExperimentCreationFormProvider;
