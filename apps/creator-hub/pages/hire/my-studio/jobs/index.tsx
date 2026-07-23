import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { MocksAuthBypass } from '@modules/talent-hub-v2/components/shared/MocksAuthBypass';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { MyJobsContainer } from '@modules/talent-hub-v2/containers/MyJobsContainer';
import RequireAccountContext from '@modules/talent-hub-v2/guards/RequireAccountContext';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';

const MyStudioJobsPage: NextLayoutPage = () => (
  <MocksAuthBypass>
    <TalentHubM2Guard>
      <RequireAccountContext context='studio'>
        <MyJobsContainer />
      </RequireAccountContext>
    </TalentHubM2Guard>
  </MocksAuthBypass>
);

MyStudioJobsPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Manage' }, { label: 'My studio' }, { label: 'Jobs' }]}>
    {page}
  </TalentHubLayout>
);
MyStudioJobsPage.loggerConfig = { rosId: RosTeams.Knowledge };

export default MyStudioJobsPage;
