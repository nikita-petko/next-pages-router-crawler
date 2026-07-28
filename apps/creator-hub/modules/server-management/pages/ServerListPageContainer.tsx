import type { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ServerListPage from '../components/ServerListPage/ServerListPage';
import GameInstanceProviderV2 from '../providers/GameInstanceProviderV2';
import UniversePlacesProvider from '../providers/UniversePlacesProvider';

const ServerListPageContainer: FunctionComponent = () => {
  const { isFetched } = useSettings();

  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <GameInstanceProviderV2>
      <UniversePlacesProvider>
        <ServerListPage />
      </UniversePlacesProvider>
    </GameInstanceProviderV2>
  );
};

export default withTranslation(ServerListPageContainer, [
  TranslationNamespace.ServerManagement,
  TranslationNamespace.ShareLinksManagement,
  TranslationNamespace.Table,
]);
