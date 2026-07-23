import { ReactNode } from 'react';
import Authenticated from '@modules/authentication/Authenticated';
import type { NextLayoutPage } from 'next';
import WebhooksMetadataContainer from '@modules/creator-settings/container/webhooks/WebhooksMetadataContainer';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import { PageNotFound } from '@modules/miscellaneous/error';

const getSettingsPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, { title: 'Heading.Webhooks' });

const WebhooksPage: NextLayoutPage = () => {
  if (process.env.buildTarget === 'luobu') {
    return <PageNotFound />;
  }

  return (
    <Authenticated>
      <WebhooksMetadataContainer />
    </Authenticated>
  );
};

WebhooksPage.getPageLayout = getSettingsPageLayout;

export default WebhooksPage;
