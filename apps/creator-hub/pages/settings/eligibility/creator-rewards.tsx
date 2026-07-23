import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import Authenticated from '@modules/authentication/Authenticated';
import AffiliateProgram from '@modules/affiliate-program/components/AffiliateProgram';
import AffiliateProgramProvider from '@modules/affiliate-program/providers/AffiliateProgramProvider';

const getPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.CreatorRewards' });

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

export default AffiliateProgramPage;
