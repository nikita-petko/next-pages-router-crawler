import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import WebhooksMetadataContainer from '@modules/creator-settings/container/webhooks/WebhooksMetadataContainer';
import { getCreatorSettingsAppNavigationLayout } from '@modules/creator-settings/CreatorSettingsAppNavigationLayout';
import { PageNotFound } from '@modules/miscellaneous/error';

const getSettingsPageLayout = (page: ReactNode) =>
  getCreatorSettingsAppNavigationLayout(page, {
    title: <Translate namespace='CreatorDashboard.Navigation' translationKey='Heading.Webhooks' />,
  });

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
WebhooksPage.loggerConfig = { rosId: RosTeams.Knowledge };

export default WebhooksPage;
