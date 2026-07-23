import React, { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { FeatureFlagName, useSettings } from '@modules/settings';
import { PageNotFound } from '@modules/miscellaneous/error';
import TalentHubV2Guard from '@modules/talent-hub-v2/guards/TalentHubV2Guard';
import TalentInboxV2Container from '@modules/talent-hub-v2/containers/TalentInboxV2Container';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';

const InboxContent: React.FC = () => {
  const { settings, isFetched } = useSettings();

  if (!isFetched) {
    return null;
  }

  const m2Enabled = Boolean(settings?.[FeatureFlagName.enableTalentHubV2M2]);

  // M1 launch: keep Inbox route non-accessible unless M2 flag is on.
  if (!m2Enabled) {
    return <PageNotFound />;
  }

  return <TalentInboxV2Container />;
};

const TalentInboxPage: NextLayoutPage = () => (
  <Authenticated>
    <TalentHubV2Guard v2={<InboxContent />} />
  </Authenticated>
);

TalentInboxPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Manage' }, { label: 'Inbox' }]}>{page}</TalentHubLayout>
);

export default TalentInboxPage;
