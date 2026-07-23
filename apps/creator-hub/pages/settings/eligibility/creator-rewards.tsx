import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import AffiliateProgram from '@modules/affiliate-program/components/AffiliateProgram';
import AffiliateProgramProvider from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import Authenticated from '@modules/authentication/Authenticated';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: (
      <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.CreatorRewards' />
    ),
  });

const AffiliateProgramPage: NextLayoutPage = () => {
  return (
    <Authenticated>
      <AffiliateProgramProvider>
        <AffiliateProgram />
      </AffiliateProgramProvider>
    </Authenticated>
  );
};

AffiliateProgramPage.getPageLayout = getPageLayout;
AffiliateProgramPage.loggerConfig = { rosId: RosTeams.GameOperations };

export default AffiliateProgramPage;
