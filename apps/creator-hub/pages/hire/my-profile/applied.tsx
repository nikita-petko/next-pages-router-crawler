import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { MocksAuthBypass } from '@modules/talent-hub-v2/components/shared/MocksAuthBypass';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { MyJobsContainer } from '@modules/talent-hub-v2/containers/MyJobsContainer';
import RequireAccountContext from '@modules/talent-hub-v2/guards/RequireAccountContext';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';

/**
 * Jobs the current user has applied to. Personal-context only; the shared
 * `MyJobsContainer` handles the applied-jobs view via `useIsInStudioContext`
 * (returns `false` here because our guard already enforces personal context).
 */
const MyAppliedJobsPage: NextLayoutPage = () => (
  <MocksAuthBypass>
    <TalentHubM2Guard>
      <RequireAccountContext context='personal'>
        <MyJobsContainer />
      </RequireAccountContext>
    </TalentHubM2Guard>
  </MocksAuthBypass>
);

MyAppliedJobsPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout
    crumbs={[
      { label: 'Manage', labelKey: 'Heading.Manage' },
      { label: 'My talent profile', labelKey: 'Nav.MyTalentProfile' },
      { label: 'My applications', labelKey: 'Heading.MyApplications' },
    ]}>
    {page}
  </TalentHubLayout>
);
MyAppliedJobsPage.loggerConfig = { rosId: RosTeams.Knowledge };

export default MyAppliedJobsPage;
