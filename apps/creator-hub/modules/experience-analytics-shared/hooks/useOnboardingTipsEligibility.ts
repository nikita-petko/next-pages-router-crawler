import { useCallback, useEffect, useMemo, useState } from 'react';
import { modelHistoryClient } from '@modules/clients/analytics';
import { OnboardingFeatureKey } from '../constants/onboardingTipsConfigs';
import singleToMappedRequest from './singleToMappedRequest';
import useMappedApiRequest from './useMappedApiRequest';

const featureToEligibilityDefaultMap = Object.values(OnboardingFeatureKey).reduce((maps, value) => {
  maps.set(value, false);
  return maps;
}, new Map<OnboardingFeatureKey, boolean>());

const useOnboardingTipsEligibility = () => {
  const [featureOnboardingEligibilityRecord, setFeatureOnboardingEligibilityRecord] = useState<
    Map<OnboardingFeatureKey, boolean>
  >(featureToEligibilityDefaultMap);

  const featureKeys: OnboardingFeatureKey[] = Object.values(OnboardingFeatureKey);
  const makeMappedRequest = useMemo(
    () => singleToMappedRequest(modelHistoryClient.shouldUserSeeModal),
    [],
  );
  const { data: initialDataForAllFeatureKey } = useMappedApiRequest(featureKeys, makeMappedRequest);

  const revokeOnboardingTipsEligibility = useCallback(async (key: OnboardingFeatureKey) => {
    const updatedVisibility = await modelHistoryClient.recordUserSeenModal(key);
    setFeatureOnboardingEligibilityRecord((prevRecord) => {
      const newRecord = new Map(prevRecord);
      newRecord.set(key, updatedVisibility);
      return newRecord;
    });
  }, []);

  useEffect(() => {
    if (initialDataForAllFeatureKey) {
      const filteredData = new Map(
        Array.from(initialDataForAllFeatureKey.entries()).map(([key, value]) => [key, !!value]),
      );
      setFeatureOnboardingEligibilityRecord(filteredData);
    }
  }, [initialDataForAllFeatureKey]);

  return {
    featureOnboardingEligibilityRecord,
    revokeOnboardingTipsEligibility,
  };
};

export default useOnboardingTipsEligibility;
