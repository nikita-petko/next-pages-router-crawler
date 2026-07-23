import { createContext } from 'react';
import {
  MockServerSignalValues,
  MatchmakingScoringConfiguration,
} from '@rbx/clients/matchmakingApi/v1';
import {
  ConfigurationBriefInfo,
  ConfigurationDetailedInfo,
  CustomSignal,
  DefaultSignalsWeights,
  PlaceConfigurationInfo,
} from '../types/ConfigurationInfo';
import { PlaceInfo } from '../types/PlaceInfo';

export interface MatchmakingConfiguration {
  currentConfigurationDetailedInfo: ConfigurationDetailedInfo | undefined;
  defaultSignalWeights: DefaultSignalsWeights | undefined;
  defaultServerValues: MockServerSignalValues[] | undefined;
  placesWithAppliedConfigurations: PlaceConfigurationInfo[] | undefined;
  allScoringConfigs: MatchmakingScoringConfiguration[] | undefined;
  placeInfoToConfigMap: Map<PlaceInfo, MatchmakingScoringConfiguration> | undefined;
  isLoadingConfigurationsForUniverse: boolean;
  isLoadingCurrentConfiguration: boolean;
  isLoadingPlacesWithConfigurations: boolean;
  fetchConfigurationsError: Error | null;
  allConfigurationBriefInfoList: ConfigurationBriefInfo[] | undefined;
  refreshConfigurations: () => void;
  handleAddConfiguration: () => Promise<string | undefined>;
  handleUpdateConfiguration: (configuration: ConfigurationDetailedInfo) => Promise<boolean>;
  handleDeleteConfiguration: (scoringConfigurationId: string) => Promise<boolean>;
  handleAddConfigurationForPlace: (
    scoringConfigurationId: string | undefined,
    placeId: number | undefined,
  ) => boolean;
  handleDeleteConfigurationForPlaceId: (placeId: number) => boolean;
  handleApplyConfigurationToPlaceIds: (configId: string, placeIds: number[]) => boolean;
  isUpdatingConfigurations: boolean;
  updateConfigurationsError: Error | null;

  handleAddCustomSignal: (
    signalConfiguration: CustomSignal,
    scoringConfigurationId: string | undefined,
  ) => Promise<boolean>;
  handleUpdateCustomSignal: (
    signalConfiguration: CustomSignal,
    signalName: string,
    scoringConfigurationId: string | undefined,
  ) => Promise<boolean>;
  handleDeleteCustomSignal: (
    scoringConfigurationId: string,
    signalName: string,
  ) => Promise<boolean>;
  isUpdatingCustomSignals: boolean;
  updateCustomSignalsError: Error | null;
}

const matchmakingConfigurationContext = createContext<MatchmakingConfiguration>({
  currentConfigurationDetailedInfo: undefined,
  defaultSignalWeights: undefined,
  defaultServerValues: undefined,
  allConfigurationBriefInfoList: undefined,
  placesWithAppliedConfigurations: undefined,
  allScoringConfigs: undefined,
  placeInfoToConfigMap: undefined,
  refreshConfigurations: () => {},
  handleAddConfiguration: async () => undefined,
  handleUpdateConfiguration: async () => false,
  handleDeleteConfiguration: async () => false,
  handleAddConfigurationForPlace: () => false,
  handleDeleteConfigurationForPlaceId: () => false,
  handleApplyConfigurationToPlaceIds: () => false,
  handleAddCustomSignal: async () => false,
  handleUpdateCustomSignal: async () => false,
  handleDeleteCustomSignal: async () => false,
  isLoadingConfigurationsForUniverse: false,
  isLoadingCurrentConfiguration: false,
  isLoadingPlacesWithConfigurations: false,
  fetchConfigurationsError: null,
  isUpdatingConfigurations: false,
  updateConfigurationsError: null,
  isUpdatingCustomSignals: false,
  updateCustomSignalsError: null,
});

export default matchmakingConfigurationContext;
