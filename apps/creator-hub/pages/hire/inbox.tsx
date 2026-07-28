import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import TalentInboxV2Container from '@modules/talent-hub-v2/containers/TalentInboxV2Container';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';

const TalentInboxPage: NextLayoutPage = () => (
  <Authenticated>
    <TalentHubM2Guard>
      <TalentInboxV2Container />
    </TalentHubM2Guard>
  </Authenticated>
);

TalentInboxPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Manage' }, { label: 'Inbox' }]}>{page}</TalentHubLayout>
);
TalentInboxPage.loggerConfig = { rosId: RosTeams.Knowledge };

export default TalentInboxPage;
