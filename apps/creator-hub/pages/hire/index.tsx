import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { FindJobsV2Container } from '@modules/talent-hub-v2/containers/FindJobsV2Container';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';

const TalentHubHome: NextLayoutPage = () => (
  <Authenticated>
    <TalentHubM2Guard>
      <FindJobsV2Container />
    </TalentHubM2Guard>
  </Authenticated>
);

TalentHubHome.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Discover' }, { label: 'Jobs' }]}>{page}</TalentHubLayout>
);
TalentHubHome.loggerConfig = { rosId: RosTeams.Knowledge };

export default TalentHubHome;
