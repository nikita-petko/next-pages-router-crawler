import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import commerceApiClient from '@modules/clients/commerce';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import serviceEfficiencyClient from '@modules/clients/serviceEfficiency';
import { createCustomSettingsWithArgs } from '@modules/settings/implementations/createCustomSettings';
import type CreationsCustomSettings from '../interfaces/CreationsCustomSettings';
import type { CreationsCustomSettingsArgs } from './CreationsCustomSettingsManager';
import CreationsCustomSettingsManager from './CreationsCustomSettingsManager';

/**
 * Please update all implementations of `useUniverseIdDerivedFromRouter` in sync
 * (We often cannot import from `creations/common` due to test-breaking circular dependencies)
 */
export function useUniverseIdDerivedFromRouter(): number | undefined {
  const router = useRouter();

  const universeId = useMemo(() => {
    const { id } = router.query;

    if (typeof id !== 'string') {
      return undefined;
    }
    return parseInt(id, 10);
  }, [router.query]);
  return universeId;
}

function useCreationsCustomSettingsArgs(): CreationsCustomSettingsArgs {
  const universeId = useUniverseIdDerivedFromRouter();
  return [universeId];
}

const creationsCustomSettingsManager = new CreationsCustomSettingsManager(
  serviceEfficiencyClient,
  priceExperimentationApi,
  priceConfigurationApi,
  itemconfigurationClient,
  commerceApiClient,
);

const { CustomSettingsProvider, useCustomSettings, CustomSettingsContext } =
  createCustomSettingsWithArgs<CreationsCustomSettings, CreationsCustomSettingsArgs>(
    creationsCustomSettingsManager,
    useCreationsCustomSettingsArgs,
  );

const CreationsCustomSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  return <CustomSettingsProvider>{children}</CustomSettingsProvider>;
};

export type CreationsCustomSettingsInjectionType = ReturnType<typeof useCustomSettings>;

export {
  CreationsCustomSettingsProvider,
  useCustomSettings as useCreationsCustomSettings,
  CustomSettingsContext as CreationsCustomSettingsContextForTestingOnly,
};
