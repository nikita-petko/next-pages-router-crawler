import type { FunctionComponent } from 'react';
import React from 'react';
import { withTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useConfigurationManagement from '../hooks/useConfigurationManagement';
import useUniversePlaces from '../hooks/useUniversePlaces';
import ConfigurationSimulationContainer from './ConfigurationSimulationContainer';

const MatchmakingEditConfigurationContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { isPlacesLoading, placesInfo } = useUniversePlaces();
  const { isLoadingCurrentConfiguration, currentConfigurationDetailedInfo } =
    useConfigurationManagement();

  if (
    isLoadingCurrentConfiguration ||
    isPlacesLoading ||
    currentConfigurationDetailedInfo === undefined
  ) {
    return <PageLoading />;
  }
  return (
    <ConfigurationSimulationContainer
      isEditingConfiguration
      currentConfiguration={currentConfigurationDetailedInfo}
      placesInfo={placesInfo}
    />
  );
};

export default withTranslation(MatchmakingEditConfigurationContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.Matchmaking,
]);
