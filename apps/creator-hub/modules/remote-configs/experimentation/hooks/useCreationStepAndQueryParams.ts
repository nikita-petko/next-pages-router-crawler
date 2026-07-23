import { isValidEnumValue, EnumType } from '@modules/miscellaneous/common/utils/enumUtils';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useCallback, useMemo } from 'react';
import { AnalyticsQueryParams } from '@modules/charts-generic';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';

type QueryParamsResultType = string | string[] | undefined | null;

export enum ExperimentCreationSteps {
  Setup = 'setup',
  Configuration = 'configuration',
  Review = 'review',
}
export const stepOrder = [
  ExperimentCreationSteps.Setup,
  ExperimentCreationSteps.Configuration,
  ExperimentCreationSteps.Review,
] as const;

const getFirstEnumQueryParam = <V extends string>(
  queryValue: QueryParamsResultType,
  enumType: EnumType<V>,
): V | undefined => {
  if (!queryValue) return undefined;
  const singleValue = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  if (singleValue && isValidEnumValue(enumType, singleValue)) {
    return singleValue;
  }
  return undefined;
};

const getQueryStringOrEmpty = (queryValue: QueryParamsResultType): string => {
  if (!queryValue) return '';
  const singleValue = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  return singleValue;
};

const useCreationStepAndQueryParams = () => {
  const [query, setQuery] = useQueryParams([
    AnalyticsQueryParams.ExperimentStep,
    AnalyticsQueryParams.ExperimentType,
    AnalyticsQueryParams.ExperimentId,
  ]);
  const { step: stepParam, type: experimentTypeParam, experimentId: experimentIdParam } = query;

  const activeStep =
    getFirstEnumQueryParam(stepParam, ExperimentCreationSteps) ?? ExperimentCreationSteps.Setup;

  const experimentType =
    getFirstEnumQueryParam(experimentTypeParam, ExperimentProductType) ??
    ExperimentProductType.Configs;
  const experimentId = useMemo(() => {
    return getQueryStringOrEmpty(experimentIdParam);
  }, [experimentIdParam]);

  const setActiveStep = useCallback(
    (step: ExperimentCreationSteps) => {
      setQuery({ [AnalyticsQueryParams.ExperimentStep]: step });
    },
    [setQuery],
  );

  const setExperimentType = useCallback(
    (type: ExperimentProductType) => {
      setQuery({ [AnalyticsQueryParams.ExperimentType]: type });
    },
    [setQuery],
  );

  const setNextStep = useCallback(
    (newExperimentId?: string) => {
      const currentIndex = stepOrder.indexOf(activeStep);
      const nextStep = stepOrder[currentIndex + 1];
      if (newExperimentId) {
        setQuery({
          [AnalyticsQueryParams.ExperimentId]: newExperimentId,
          ...(nextStep ? { [AnalyticsQueryParams.ExperimentStep]: nextStep } : {}),
        });
      } else if (nextStep) {
        setActiveStep(nextStep);
      }
    },
    [activeStep, setActiveStep, setQuery],
  );

  const setPrevStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(activeStep);
    const prevStep = stepOrder[currentIndex - 1];
    if (prevStep) {
      setActiveStep(prevStep);
    }
  }, [activeStep, setActiveStep]);

  return useMemo(
    () => ({
      activeStep,
      experimentType,
      setExperimentType,
      setNextStep,
      setPrevStep,
      setActiveStep,
      experimentId,
    }),
    [
      activeStep,
      experimentType,
      setExperimentType,
      setNextStep,
      setPrevStep,
      setActiveStep,
      experimentId,
    ],
  );
};

export default useCreationStepAndQueryParams;
