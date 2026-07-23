/* istanbul ignore file */
import Authenticated from '@modules/authentication/Authenticated';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import GameProvider from '@modules/providers/game/GameProvider';
import { CreationsCustomSettingsProvider } from '../../common/implementations/creationsCustomSettings';
import PassItemLeftNavigation from '../common/PassItemLeftNavigation/PassItemLeftNavigation';
import { PassProvider } from '../contexts/PassContext';

const getPassConfigurationLayout = (
  page: React.ReactNode,
  { title }: { title: string | React.ReactNode },
) => {
  return (
    <Authenticated>
      <CreationsCustomSettingsProvider>
        <GameProvider>
          <LanguageManagementProvider>
            <PassProvider>
              <CreatorHubLayout title={title} leftNavigationContents={<PassItemLeftNavigation />}>
                {page}
              </CreatorHubLayout>
            </PassProvider>
          </LanguageManagementProvider>
        </GameProvider>
      </CreationsCustomSettingsProvider>
    </Authenticated>
  );
};

export default getPassConfigurationLayout;
