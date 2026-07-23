import React, { FunctionComponent } from 'react';
import { useSettings } from '@modules/settings';
import { PageLoading } from '@modules/miscellaneous/common';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import UniversePlacesProvider from '../providers/UniversePlacesProvider';
import GameInstanceProviderV2 from '../providers/GameInstanceProviderV2';
import ServerDetailsPage from '../components/ServerDetailsPage/ServerDetailsPage';
import useServerManagementV2Gate from '../hooks/useServerManagementV2Gate';

const ServerDetailsPageContainer: FunctionComponent = () => {
  const { isFetched } = useSettings();
  const isV2Enabled = useServerManagementV2Gate();

  if (!isFetched) {
    return <PageLoading />;
  }

  if (!isV2Enabled) {
    return <PageNotFound />;
  }

  return (
    <GameInstanceProviderV2>
      <UniversePlacesProvider>
        <ServerDetailsPage />
      </UniversePlacesProvider>
    </GameInstanceProviderV2>
  );
};

export default withTranslation(ServerDetailsPageContainer, [TranslationNamespace.ServerManagement]);
