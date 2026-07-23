import React, { FunctionComponent } from 'react';
import { useSettings } from '@modules/settings';
import { PageLoading } from '@modules/miscellaneous/common';
import { PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import SelectablePlacesTable from '../components/SelectablePlacesTable/SelectablePlacesTable';
import UniversePlacesProvider from '../providers/UniversePlacesProvider';
import GameInstanceProvider from '../providers/GameInstanceProvider';
import GameInstanceProviderV2 from '../providers/GameInstanceProviderV2';
import RestartActivityCard from '../components/RestartActivityCard/RestartActivityCard';
import TabbedPageManager from '../components/TabbedPageManager/TabbedPageManager';
import useServerManagementV2Gate from '../hooks/useServerManagementV2Gate';

const ServerManagementPage: FunctionComponent = () => {
  const { settings, isFetched } = useSettings();
  const isV2Enabled = useServerManagementV2Gate();

  if (!isFetched) {
    return <PageLoading />;
  }

  if (!settings.serverManagementEnabled && isFetched) {
    return <PageNotFound />;
  }

  return isV2Enabled ? (
    <div>
      <GameInstanceProviderV2>
        <UniversePlacesProvider>
          <TabbedPageManager />
        </UniversePlacesProvider>
      </GameInstanceProviderV2>
    </div>
  ) : (
    <div>
      <GameInstanceProvider>
        <UniversePlacesProvider>
          <RestartActivityCard />
          <SelectablePlacesTable />
        </UniversePlacesProvider>
      </GameInstanceProvider>
    </div>
  );
};

export default withTranslation(ServerManagementPage, [TranslationNamespace.ServerManagement]);
