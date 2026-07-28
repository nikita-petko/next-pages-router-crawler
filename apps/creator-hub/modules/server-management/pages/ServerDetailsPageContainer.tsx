import type { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ServerDetailsPage from '../components/ServerDetailsPage/ServerDetailsPage';
import GameInstanceProviderV2 from '../providers/GameInstanceProviderV2';
import UniversePlacesProvider from '../providers/UniversePlacesProvider';

const ServerDetailsPageContainer: FunctionComponent = () => {
  const { isFetched } = useSettings();

  if (!isFetched) {
    return <PageLoading />;
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
