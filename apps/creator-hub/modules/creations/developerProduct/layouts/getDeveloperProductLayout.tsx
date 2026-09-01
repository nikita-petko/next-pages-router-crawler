/* istanbul ignore file */
import Authenticated from '@modules/authentication/Authenticated';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import GameProvider from '@modules/providers/game/GameProvider';
import AssociatedItemLeftNavigation from '../../associatedItems/components/AssociatedItemLeftNavigation';
import { CreationsCustomSettingsProvider } from '../../common/implementations/creationsCustomSettings';
import type { TGetCreationsPageLayoutContext } from '../../common/implementations/getCreationsPageLayout';
import { DeveloperProductProvider } from '../contexts/DeveloperProductContext';

const getDeveloperProductLayout = (
  page: React.ReactNode,
  context: TGetCreationsPageLayoutContext,
) => {
  return (
    <Authenticated>
      <CreationsCustomSettingsProvider>
        <GameProvider>
          <LanguageManagementProvider>
            <DeveloperProductProvider>
              <CreatorHubLayout
                leftNavigationContents={<AssociatedItemLeftNavigation />}
                {...context}>
                {page}
              </CreatorHubLayout>
            </DeveloperProductProvider>
          </LanguageManagementProvider>
        </GameProvider>
      </CreationsCustomSettingsProvider>
    </Authenticated>
  );
};

export default getDeveloperProductLayout;
