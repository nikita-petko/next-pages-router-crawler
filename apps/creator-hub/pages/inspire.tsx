import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import InspireContainer from '@modules/landing/inspireLanding/components/InspireContainer';

const getInspirePageLayout = (page: ReactNode) => (
  <CreatorHubLayout title='Roblox Inspire 2026' noBreadCrumbs>
    {page}
  </CreatorHubLayout>
);

const title = 'Roblox Inspire 2026';
const description =
  'Join 50,000+ creators worldwide! Attend a local café, level up with virtual workshops, and compete in the 72-hour Game Jam.';

const InspirePage: NextLayoutPage = () => <InspireContainer />;

InspirePage.getPageLayout = getInspirePageLayout;
InspirePage.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };
InspirePage.pageMetadata = {
  title,
  description,
};

export default InspirePage;
