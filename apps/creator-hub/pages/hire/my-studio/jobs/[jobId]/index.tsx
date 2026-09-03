import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { MocksAuthBypass } from '@modules/talent-hub-v2/components/shared/MocksAuthBypass';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { JobApplicationsContainer } from '@modules/talent-hub-v2/containers/JobApplicationsContainer';
import RequireAccountContext from '@modules/talent-hub-v2/guards/RequireAccountContext';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';

const JobApplicationsPage: NextLayoutPage = () => {
  const { query } = useRouter();
  const jobId = typeof query.jobId === 'string' ? query.jobId : '';

  if (!jobId) {
    return null;
  }

  return (
    <MocksAuthBypass>
      <TalentHubM2Guard>
        <RequireAccountContext context='studio'>
          <JobApplicationsContainer jobId={jobId} />
        </RequireAccountContext>
      </TalentHubM2Guard>
    </MocksAuthBypass>
  );
};

JobApplicationsPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout
    crumbs={[
      { label: 'Manage' },
      { label: 'My studio' },
      { label: 'Jobs', href: '/hire/my-studio/jobs' },
      { label: 'Applications' },
    ]}>
    {page}
  </TalentHubLayout>
);
JobApplicationsPage.loggerConfig = { rosId: RosTeams.Knowledge };

export default JobApplicationsPage;
