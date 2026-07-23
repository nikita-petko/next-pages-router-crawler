import type { FunctionComponent, PropsWithChildren, RefObject } from 'react';
import { createContext, useContext, useState, useMemo, useCallback, useRef } from 'react';
import {
  OnboardingFeatureKey,
  OnboardingStepKey,
  featureKeyToStepKeyOrder,
  getStepIndex,
} from '../constants/onboardingTipsConfigs';
import useCurrentBenchmarkTypeIsSimilarityForExperiencesList from '../hooks/useCurrentBenchmarkTypeIsSimilarityForExperiencesList';
import useOnboardingTipsEligibility from '../hooks/useOnboardingTipsEligibility';

export type TOnboardingTipsContext = {
  getEligibilityForOnboardingTips: (key: OnboardingFeatureKey) => boolean;
  revokeOnboardingTipsEligibility: (key: OnboardingFeatureKey) => void;
  getTotalSteps: (key: OnboardingFeatureKey) => number;
  getCurrentOnboardingStep: (key: OnboardingFeatureKey) => OnboardingStepKey;
  setPrevStep: (key: OnboardingFeatureKey) => void;
  setNextStep: (key: OnboardingFeatureKey) => void;
  registerComponentRefForScrolling: (
    step: OnboardingStepKey,
    componentRef: RefObject<HTMLSpanElement | null>,
  ) => void;
  unRegisterComponentRefForScrolling: (step: OnboardingStepKey) => void;
};

const featureToStepInitialMap = Object.values(OnboardingFeatureKey).reduce((maps, value) => {
  const steps = featureKeyToStepKeyOrder[value];
  if (steps && steps[0]) {
    maps.set(value, steps[0]);
  }
  return maps;
}, new Map<OnboardingFeatureKey, OnboardingStepKey>());

const unimplementedFn = () => {
  throw new Error('not implemented yet');
};

export const OnboardingTipsContext = createContext<TOnboardingTipsContext>({
  getEligibilityForOnboardingTips: unimplementedFn,
  revokeOnboardingTipsEligibility: unimplementedFn,
  getTotalSteps: unimplementedFn,
  getCurrentOnboardingStep: unimplementedFn,
  setPrevStep: unimplementedFn,
  setNextStep: unimplementedFn,
  registerComponentRefForScrolling: unimplementedFn,
  unRegisterComponentRefForScrolling: unimplementedFn,
});

type OnboardingFeatureTipsBundle = {
  isEligibleForOnboardingTips: boolean;
  revokeOnboardingTipsEligibility: () => void;
  totalSteps: number;
  currentOnboardingStep: OnboardingStepKey;
  setPrevStep: () => void;
  setNextStep: () => void;
  registerComponentRefForScrolling: (
    step: OnboardingStepKey,
    componentRef: RefObject<HTMLSpanElement | null>,
  ) => void;
  unRegisterComponentRefForScrolling: (step: OnboardingStepKey) => void;
};

export const useOnboardingTipsStepBundle = (
  featureKey: OnboardingFeatureKey,
): OnboardingFeatureTipsBundle => {
  const context = useContext(OnboardingTipsContext);
  if (context === null) {
    throw new Error('useOnboardingTipsStepBundle must be used within a OnboardingTipsProvider');
  }
  const isSimilarBenchmark = useCurrentBenchmarkTypeIsSimilarityForExperiencesList();
  const totalSteps = useMemo(() => {
    const steps = context.getTotalSteps(featureKey);
    if (featureKey === OnboardingFeatureKey.CreatorHubAnalyticsAcquisitionRfy) {
      return isSimilarBenchmark ? steps : steps - 1;
    }
    return steps;
  }, [context, featureKey, isSimilarBenchmark]);

  return useMemo(() => {
    const currentFeatureStep = context.getCurrentOnboardingStep(featureKey);
    return {
      isEligibleForOnboardingTips: context.getEligibilityForOnboardingTips(featureKey),
      revokeOnboardingTipsEligibility: () => context.revokeOnboardingTipsEligibility(featureKey),
      totalSteps,
      currentOnboardingStep: currentFeatureStep,
      setPrevStep: () => context.setPrevStep(featureKey),
      setNextStep: () => context.setNextStep(featureKey),
      registerComponentRefForScrolling: context.registerComponentRefForScrolling,
      unRegisterComponentRefForScrolling: context.unRegisterComponentRefForScrolling,
    };
  }, [context, featureKey, totalSteps]);
};

export const OnboardingTipsProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const [featureCurrentStepRecord, setFeatureCurrentStepRecord] =
    useState<Map<OnboardingFeatureKey, OnboardingStepKey>>(featureToStepInitialMap);
  const { featureOnboardingEligibilityRecord, revokeOnboardingTipsEligibility } =
    useOnboardingTipsEligibility();

  const stepToScrollElements = useRef<Map<OnboardingStepKey, RefObject<HTMLSpanElement | null>>>(
    new Map(),
  );

  const registerComponentRefForScrolling = useCallback(
    (step: OnboardingStepKey, componentRef: RefObject<HTMLSpanElement | null>) => {
      stepToScrollElements.current.set(step, componentRef);
    },
    [],
  );

  const unRegisterComponentRefForScrolling = useCallback((step: OnboardingStepKey) => {
    stepToScrollElements.current.delete(step);
  }, []);

  const scrollToComponentForStep = useCallback((step: OnboardingStepKey) => {
    const componentRef = stepToScrollElements.current.get(step);
    if (componentRef) {
      componentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const getCurrentOnboardingStep = useCallback(
    (key: OnboardingFeatureKey) => {
      const steps = featureKeyToStepKeyOrder[key];
      return (
        featureCurrentStepRecord.get(key) ?? steps?.[0] ?? OnboardingStepKey.HomeRecommendationTab
      );
    },
    [featureCurrentStepRecord],
  );

  const getTotalSteps = useCallback((key: OnboardingFeatureKey) => {
    return featureKeyToStepKeyOrder[key]?.length ?? 0;
  }, []);

  const setPrevStep = useCallback(
    (key: OnboardingFeatureKey) => {
      setFeatureCurrentStepRecord((prevRecord) => {
        const newRecord = new Map(prevRecord);
        const currentStep = prevRecord.get(key);
        const steps = featureKeyToStepKeyOrder[key];
        if (currentStep && steps) {
          const currentStepIndex = getStepIndex(key, currentStep);
          const prevStep = steps[currentStepIndex - 1];
          if (currentStepIndex > 0 && prevStep) {
            scrollToComponentForStep(prevStep);
            newRecord.set(key, prevStep);
          }
        }
        return newRecord;
      });
    },
    [scrollToComponentForStep],
  );

  const setNextStep = useCallback(
    (key: OnboardingFeatureKey) => {
      setFeatureCurrentStepRecord((prevRecord) => {
        const newRecord = new Map(prevRecord);
        const currentStep = prevRecord.get(key);
        const steps = featureKeyToStepKeyOrder[key];
        if (currentStep && steps) {
          const currentStepIndex = getStepIndex(key, currentStep);
          const nextStep = steps[currentStepIndex + 1];
          if (currentStepIndex < getTotalSteps(key) - 1 && nextStep) {
            scrollToComponentForStep(nextStep);
            newRecord.set(key, nextStep);
          }
        }
        return newRecord;
      });
    },
    [getTotalSteps, scrollToComponentForStep],
  );

  const getEligibilityForOnboardingTips = useCallback(
    (key: OnboardingFeatureKey) => {
      return featureOnboardingEligibilityRecord.get(key) ?? false;
    },
    [featureOnboardingEligibilityRecord],
  );

  const contextValue = useMemo(
    () => ({
      getTotalSteps,
      getCurrentOnboardingStep,
      setPrevStep,
      setNextStep,
      registerComponentRefForScrolling,
      unRegisterComponentRefForScrolling,
      getEligibilityForOnboardingTips,
      revokeOnboardingTipsEligibility,
    }),
    [
      getTotalSteps,
      getCurrentOnboardingStep,
      setPrevStep,
      setNextStep,
      registerComponentRefForScrolling,
      unRegisterComponentRefForScrolling,
      getEligibilityForOnboardingTips,
      revokeOnboardingTipsEligibility,
    ],
  );

  return (
    <OnboardingTipsContext.Provider value={contextValue}>{children}</OnboardingTipsContext.Provider>
  );
};
