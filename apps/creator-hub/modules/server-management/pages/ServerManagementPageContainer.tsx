import type { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import TabbedPageManager from '../components/TabbedPageManager/TabbedPageManager';
import GameInstanceProviderV2 from '../providers/GameInstanceProviderV2';
import UniversePlacesProvider from '../providers/UniversePlacesProvider';

const ServerManagementPage: FunctionComponent = () => {
  const { isFetched } = useSettings();

  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <div>
      <GameInstanceProviderV2>
        <UniversePlacesProvider>
          <TabbedPageManager />
        </UniversePlacesProvider>
      </GameInstanceProviderV2>
    </div>
  );
};

export default withTranslation(ServerManagementPage, [TranslationNamespace.ServerManagement]);
