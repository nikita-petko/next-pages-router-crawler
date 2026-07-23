import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { DEFAULT_CREATOR_HUB_SEARCH_VERSION } from '@rbx/creator-hub-search';
import { useMediaQuery } from '@rbx/ui';
import { UnifiedLogger } from '@rbx/unified-logger';
import type { TrackerClientRequest } from '../event/eventConstants';
import { RailProvider } from '../layout/providers/RailProvider';
import type { TBuildTarget, TProductKey, TRobloxEnvironment, TTargetEnvironment } from '../types';
import { ProductKey } from '../types';
import { getEventBasePath } from '../utils/getBasePaths';
import type { TNavigationIXPResults } from '../utils/getNavigationIXPParams';
import { getNavigationIXPParams } from '../utils/getNavigationIXPParams';
import getRobloxEnvironment from '../utils/getRobloxEnvironment';
import logEventToUnifiedLogger from '../utils/logEventToUnifiedLogger';
import NavigationConfigsContext from './NavigationConfigsContext';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';
import useNavigationDrawerState from './useNavigationDrawerState';

export type NavigationConfigsProviderProps = {
  environment: TTargetEnvironment;
  robloxEnvironment?: TRobloxEnvironment;
  target: TBuildTarget;
  currentProduct: TProductKey;
  drawerVariant?: 'fullScreen' | 'belowAppBar';
  children?: React.ReactNode;
  compactBreakpoint?: number;
  signalRCrossTab?: {
    enabled: boolean;
    isFetched: boolean;
  };
  /**
   * When true, uses SearchContainerRaw instead of SearchContainer (with withTranslation HOC).
   * Set this to true when your app uses StaticTranslationProvider with pre-loaded translations
   * instead of LocalizationProvider with dynamic translation loading.
   * @default false
   */
  useStaticTranslations?: boolean;
  enableGroupModeration?: boolean;
};

const defaultSignalRCrossTab = { enabled: false, isFetched: false };

const NavigationConfigsProvider: FunctionComponent<NavigationConfigsProviderProps> = ({
  environment,
  robloxEnvironment,
  target,
  currentProduct,
  compactBreakpoint,
  drawerVariant = 'fullScreen',
  children,
  signalRCrossTab = defaultSignalRCrossTab,
  useStaticTranslations = false,
  enableGroupModeration = false,
}) => {
  const isCompact = useMediaQuery((theme) => theme.breakpoints.down(compactBreakpoint ?? 'Large'));
  const robloxEnv = robloxEnvironment ?? getRobloxEnvironment(environment);
  const [navigationFlags, setNavigationFlags] = useState<TNavigationIXPResults>({
    enableAssistant: false,
    disableProducts: ['CommunityEvents'],
    enableLuobu: false,
    creatorEventsVariant: null,
    enableCourses: false,
    enableAdsManager: false,
    enableNotificationsM2: false,
    enableTalentHubV2M2: false,
    creatorHubSearchIxpParams: DEFAULT_CREATOR_HUB_SEARCH_VERSION,
  });
  const [navigationDropdownTabs, setNavigationDropdownTabs] = useState<TProductKey[]>(['Explore']);

  useIsomorphicLayoutEffect(() => {
    const {
      creatorEventsVariant,
      enableAssistant,
      enableCourses,
      enableAdsManager,
      enableNotificationsM2, // TODO @ahua (1/30/2026): Remove once notifications M2 is fully released
      enableTalentHubV2M2,
      creatorHubSearchIxpParams,
    } = getNavigationIXPParams(target, environment);
    setNavigationFlags({
      ...navigationFlags,
      creatorEventsVariant,
      enableAssistant,
      enableCourses,
      enableAdsManager: (enableAdsManager ?? false) || currentProduct === ProductKey.Advertise,
      enableNotificationsM2,
      enableTalentHubV2M2,
      creatorHubSearchIxpParams,
    });
    if (creatorEventsVariant === 'dropdown') {
      setNavigationDropdownTabs((dropdownTabs) => [...dropdownTabs, 'Community']);
    }
  }, []);

  const unifiedLoggerClient = useMemo(() => {
    const eventBaseUrl = getEventBasePath(target, environment);
    return new UnifiedLogger({
      eventBaseUrl,
      product: 'CreatorHubShell',
      sessionProductGroup: 'CreatorHub',
    });
  }, [environment, target]);

  const sendEvent = useCallback(
    (clientRequest: TrackerClientRequest) => {
      logEventToUnifiedLogger(unifiedLoggerClient, currentProduct, clientRequest);
    },
    [currentProduct, unifiedLoggerClient],
  );

  const drawerState = useNavigationDrawerState();

  const value = useMemo(
    () => ({
      environment,
      robloxEnvironment: robloxEnv,
      target,
      currentProduct,
      ...navigationFlags,
      enableCourses: navigationFlags.enableCourses ?? false,
      enableAdsManager: navigationFlags.enableAdsManager ?? false,
      enableTalentHubV2M2:
        navigationFlags.enableTalentHubV2M2 === true || navigationFlags.enableTalentHubV2M2 === 1,
      useStaticTranslations,
      drawerVariant,
      navigationDropdownTabs,
      enableNotificationsM2: navigationFlags.enableNotificationsM2 ?? false, // TODO @ahua (1/30/2026): Remove once notifications M2 is fully released
      isCompact,
      signalRCrossTab,
      enableGroupModeration,
      ...drawerState,
      sendEvent,
    }),
    [
      environment,
      robloxEnv,
      target,
      currentProduct,
      navigationFlags,
      drawerVariant,
      navigationDropdownTabs,
      isCompact,
      signalRCrossTab,
      enableGroupModeration,
      drawerState,
      sendEvent,
      useStaticTranslations,
    ],
  );
  return (
    <NavigationConfigsContext.Provider value={value}>
      <RailProvider>{children}</RailProvider>
    </NavigationConfigsContext.Provider>
  );
};

export default NavigationConfigsProvider;
