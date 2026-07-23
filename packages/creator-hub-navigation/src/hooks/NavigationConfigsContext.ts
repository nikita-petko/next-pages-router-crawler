import { createContext } from 'react';
import type { CreatorHubSearchIxpParams } from '@rbx/creator-hub-search';
import { DEFAULT_CREATOR_HUB_SEARCH_VERSION } from '@rbx/creator-hub-search';
import type { TrackerClientRequest } from '../event/eventConstants';
import type { TBuildTarget, TProductKey, TRobloxEnvironment, TTargetEnvironment } from '../types';
import type { NavigationDrawerState } from './useNavigationDrawerState';
import { defaultNavigationDrawerState } from './useNavigationDrawerState';

export type NavigationConfigsContextValue = NavigationDrawerState & {
  environment: TTargetEnvironment;
  robloxEnvironment: TRobloxEnvironment;
  target: TBuildTarget;
  currentProduct: TProductKey;
  enableAssistant: boolean;
  disableProducts: string[] | null;
  creatorEventsVariant: string | null;
  drawerVariant: 'fullScreen' | 'belowAppBar';
  sendEvent: (clientRequest: TrackerClientRequest) => void;
  navigationDropdownTabs: TProductKey[] | null;
  enableCourses: boolean;
  enableNotificationsM2: boolean; // TODO @ahua (1/30/2026): Remove once notifications M2 is fully released
  enableAdsManager: boolean;
  enableTalentHubV2M2: boolean;
  creatorHubSearchIxpParams: CreatorHubSearchIxpParams;
  isCompact: boolean;
  signalRCrossTab: {
    enabled: boolean;
    isFetched: boolean;
  };
  /**
   * When true, uses SearchContainerRaw instead of SearchContainer (with withTranslation HOC).
   * Set this to true when your app uses StaticTranslationProvider with pre-loaded translations.
   */
  useStaticTranslations: boolean;
  enableGroupModeration: boolean;
};
const defaultContextValue: NavigationConfigsContextValue = {
  environment: 'production',
  robloxEnvironment: 'production',
  target: 'global',
  currentProduct: 'CreatorHub',
  enableAssistant: false,
  disableProducts: null,
  creatorEventsVariant: null,
  drawerVariant: 'fullScreen',
  navigationDropdownTabs: null,
  enableCourses: false,
  enableNotificationsM2: false, // TODO @ahua (1/30/2026): Remove once notifications M2 is fully released
  enableAdsManager: false,
  enableTalentHubV2M2: false,
  creatorHubSearchIxpParams: DEFAULT_CREATOR_HUB_SEARCH_VERSION,
  isCompact: false,
  signalRCrossTab: {
    enabled: false,
    isFetched: false,
  },
  useStaticTranslations: false,
  enableGroupModeration: false,
  ...defaultNavigationDrawerState,
  sendEvent: () => {
    throw new Error('Not implemented');
  },
};

const NavigationConfigsContext = createContext<NavigationConfigsContextValue>(defaultContextValue);
NavigationConfigsContext.displayName = 'NavigationConfigsContext';

export default NavigationConfigsContext;
