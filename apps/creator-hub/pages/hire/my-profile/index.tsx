import type { ReactNode } from 'react';
import React from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { TalentProfileV2Container } from '@modules/talent-hub-v2/containers/TalentProfileV2Container';
import RequireAccountContext from '@modules/talent-hub-v2/guards/RequireAccountContext';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';

const MyProfilePageContent: React.FC = () => <TalentProfileV2Container profileId='me' />;

const MyProfilePage: NextLayoutPage = () => (
  <Authenticated>
    <TalentHubM2Guard>
      <RequireAccountContext context='personal'>
        <MyProfilePageContent />
      </RequireAccountContext>
    </TalentHubM2Guard>
  </Authenticated>
);

MyProfilePage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Manage' }, { label: 'My talent profile' }]}>
    {page}
  </TalentHubLayout>
);

MyProfilePage.loggerConfig = { rosId: RosTeams.Knowledge };

export default MyProfilePage;
