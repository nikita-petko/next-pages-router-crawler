import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import CreatorHubLayout from '@modules/creator-hub-layout/CreatorHubLayout';
import { PageNotFound } from '@modules/miscellaneous/error';

const getCustom404PagePageLayout = (page: ReactNode) => (
  <CreatorHubLayout disableLeftNavigation>{page}</CreatorHubLayout>
);

const Custom404Page: NextLayoutPage = () => {
  return <PageNotFound />;
};

Custom404Page.getPageLayout = getCustom404PagePageLayout;
Custom404Page.loggerConfig = { rosId: RosTeams.CreatorHubPlatform };

export default Custom404Page;
