import type { ReactNode } from 'react';
import React from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import Authenticated from '@modules/authentication/Authenticated';
import type { Crumb } from '@modules/talent-hub-v2/components/shared/TalentHubBreadcrumbs';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { JobDetailContainer } from '@modules/talent-hub-v2/containers/JobDetailContainer';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';

function useJobDetailCrumbs(): Crumb[] {
  const { query } = useRouter();
  const from = typeof query.from === 'string' ? query.from : '';
  if (from === 'profile') {
    return [
      { label: 'Manage' },
      { label: 'My studio', href: '/hire/my-studio?th2=1' },
      { label: 'Job Detail' },
    ];
  }
  if (from === 'studio') {
    const studioId = typeof query.studioId === 'string' ? query.studioId : '';
    return [
      { label: 'Discover' },
      { label: 'Studios', href: '/hire/studios?th2=1' },
      {
        label: 'Studio Profile',
        href: studioId ? `/hire/studios/${studioId}?th2=1` : undefined,
      },
      { label: 'Job Detail' },
    ];
  }
  return [{ label: 'Discover' }, { label: 'Jobs', href: '/hire?th2=1' }, { label: 'Job Detail' }];
}

const JobDetailPageContent: React.FC = () => {
  const router = useRouter();
  const { jobId } = router.query;
  const crumbs = useJobDetailCrumbs();

  if (!router.isReady || typeof jobId !== 'string') {
    return null;
  }

  return (
    <TalentHubLayout crumbs={crumbs}>
      <Authenticated>
        <TalentHubM2Guard>
          <JobDetailContainer jobId={jobId} />
        </TalentHubM2Guard>
      </Authenticated>
    </TalentHubLayout>
  );
};

const JobDetailPage: NextLayoutPage = () => <JobDetailPageContent />;

JobDetailPage.getPageLayout = (page: ReactNode) => page;
JobDetailPage.loggerConfig = { rosId: RosTeams.Knowledge };

export default JobDetailPage;
