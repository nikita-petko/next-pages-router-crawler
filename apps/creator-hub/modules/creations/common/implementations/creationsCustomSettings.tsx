import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { createCustomSettingsWithArgs } from '@modules/settings';
import { itemconfigurationClient, serviceEfficiencyClient } from '@modules/clients';
import badgesClient from '@modules/clients/badges';
import developerAdsStatsClient from '@modules/clients/developerAdsStats';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import commerceApiClient from '@modules/clients/commerce';
import { matchmakingClient } from '@modules/react-query/matchmaking/matchmakingRequests';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { FeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';
import CreationsCustomSettingsManager, {
  CreationsCustomSettingsArgs,
} from './CreationsCustomSettingsManager';
import type CreationsCustomSettings from '../interfaces/CreationsCustomSettings';

/**
 * Please update all implementations of `useUniverseIdDerivedFromRouter` in sync
 * (We often cannot import from `creations/common` due to test-breaking circular dependencies)
 */
export function useUniverseIdDerivedFromRouter(): number | undefined {
  const router = useRouter();

  const universeId = useMemo(() => {
    const { id } = router.query;

    if (typeof id === 'undefined') {
      return id;
    }
    return parseInt(id as string, 10);
  }, [router.query]);
  return universeId;
}

function useCreationsCustomSettingsArgs(): CreationsCustomSettingsArgs {
  const universeId = useUniverseIdDerivedFromRouter();
  return [universeId];
}

const creationsCustomSettingsManager = new CreationsCustomSettingsManager(
  developerAdsStatsClient,
  serviceEfficiencyClient,
  priceExperimentationApi,
  priceConfigurationApi,
  badgesClient,
  itemconfigurationClient,
  commerceApiClient,
  matchmakingClient,
);

const { CustomSettingsProvider, useCustomSettings, CustomSettingsContext } =
  createCustomSettingsWithArgs<CreationsCustomSettings, CreationsCustomSettingsArgs>(
    creationsCustomSettingsManager,
    useCreationsCustomSettingsArgs,
  );

const CreationsCustomSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [universeId] = useCreationsCustomSettingsArgs();
  return (
    <FeatureFlagsProvider
      namespaces={[FeatureFlagNamespace.Analytics]}
      evaluationContext={{ universeId }}>
      <CustomSettingsProvider>{children}</CustomSettingsProvider>
    </FeatureFlagsProvider>
  );
};

export type CreationsCustomSettingsInjectionType = ReturnType<typeof useCustomSettings>;

export {
  CreationsCustomSettingsProvider,
  useCustomSettings as useCreationsCustomSettings,
  CustomSettingsContext as CreationsCustomSettingsContextForTestingOnly,
};
