import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import FindJobsV2Container from '@modules/talent-hub-v2/containers/FindJobsV2Container';
import TalentHubV2Guard from '@modules/talent-hub-v2/guards/TalentHubV2Guard';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';

const TalentHubHome: NextLayoutPage = () => (
  <Authenticated>
    <TalentHubV2Guard v2={<FindJobsV2Container />} />
  </Authenticated>
);

TalentHubHome.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Discover' }, { label: 'Jobs' }]}>{page}</TalentHubLayout>
);

export default TalentHubHome;
