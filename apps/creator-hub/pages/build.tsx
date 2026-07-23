import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import BuildContainer from '@modules/landing/buildLanding/components/BuildContainer';

const getBuildPageLayout = (page: ReactNode) => (
  <CreatorHubLayout
    title={<Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Program' />}
    noBreadCrumbs>
    {page}
  </CreatorHubLayout>
);
const title = 'Join the Roblox Jumpstart and Incubator Programs!';
const description = `We've launched two new programs to help you pioneer the next generation of novel games on Roblox and invite more 18+ players to Roblox. Get the details and learn how to apply now.`;

const BuildPage: NextLayoutPage = () => <BuildContainer />;

BuildPage.getPageLayout = getBuildPageLayout;
BuildPage.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };
BuildPage.pageMetadata = {
  title,
  description,
};

export default BuildPage;
