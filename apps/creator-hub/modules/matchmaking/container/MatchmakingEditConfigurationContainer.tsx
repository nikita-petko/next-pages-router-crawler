import React, { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import useUniversePlaces from '../hooks/useUniversePlaces';
import ConfigurationSimulationContainer from './ConfigurationSimulationContainer';
import useConfigurationManagement from '../hooks/useConfigurationManagement';

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
