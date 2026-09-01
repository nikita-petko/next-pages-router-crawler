import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { MocksAuthBypass } from '@modules/talent-hub-v2/components/shared/MocksAuthBypass';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { EditJobContainer } from '@modules/talent-hub-v2/containers/EditJobContainer';
import RequireAccountContext from '@modules/talent-hub-v2/guards/RequireAccountContext';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';

const EditJobPage: NextLayoutPage = () => {
  const { query } = useRouter();
  const jobId = typeof query.jobId === 'string' ? query.jobId : '';

  if (!jobId) {
    return null;
  }

  return (
    <MocksAuthBypass>
      <TalentHubM2Guard>
        <RequireAccountContext context='studio'>
          <EditJobContainer jobId={jobId} />
        </RequireAccountContext>
      </TalentHubM2Guard>
    </MocksAuthBypass>
  );
};

EditJobPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout
    crumbs={[
      { label: 'Manage' },
      { label: 'My studio' },
      { label: 'Jobs', href: '/hire/my-studio/jobs' },
      { label: 'Edit' },
    ]}>
    {page}
  </TalentHubLayout>
);
EditJobPage.loggerConfig = { rosId: RosTeams.Knowledge };

export default EditJobPage;
