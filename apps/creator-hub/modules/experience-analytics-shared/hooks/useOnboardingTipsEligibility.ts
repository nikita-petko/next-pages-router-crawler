import { useCallback, useMemo, useState } from 'react';
import { modelHistoryClient } from '@modules/clients/analytics';
import { OnboardingFeatureKey } from '../constants/onboardingTipsConfigs';
import singleToMappedRequest from './singleToMappedRequest';
import useMappedApiRequest from './useMappedApiRequest';

const featureToEligibilityDefaultMap = Object.values(OnboardingFeatureKey).reduce((maps, value) => {
  maps.set(value, false);
  return maps;
}, new Map<OnboardingFeatureKey, boolean>());

const useOnboardingTipsEligibility = () => {
  const [eligibilityOverrides, setEligibilityOverrides] = useState<
    Map<OnboardingFeatureKey, boolean>
  >(new Map());

  const featureKeys: OnboardingFeatureKey[] = Object.values(OnboardingFeatureKey);
  const makeMappedRequest = useMemo(
    () => singleToMappedRequest(modelHistoryClient.shouldUserSeeModal),
    [],
  );
  const { data: initialDataForAllFeatureKey } = useMappedApiRequest(featureKeys, makeMappedRequest);

  const revokeOnboardingTipsEligibility = useCallback(async (key: OnboardingFeatureKey) => {
    const updatedVisibility = await modelHistoryClient.recordUserSeenModal(key);
    setEligibilityOverrides((prevRecord) => {
      const newRecord = new Map(prevRecord);
      newRecord.set(key, updatedVisibility);
      return newRecord;
    });
  }, []);

  const featureOnboardingEligibilityRecord = useMemo(() => {
    const fetchedEligibility = initialDataForAllFeatureKey
      ? new Map(
          Array.from(initialDataForAllFeatureKey.entries()).map(([key, value]) => [key, !!value]),
        )
      : featureToEligibilityDefaultMap;
    return new Map([...fetchedEligibility, ...eligibilityOverrides]);
  }, [eligibilityOverrides, initialDataForAllFeatureKey]);

  return {
    featureOnboardingEligibilityRecord,
    revokeOnboardingTipsEligibility,
  };
};

export default useOnboardingTipsEligibility;
