import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { FindStudiosV2Container } from '@modules/talent-hub-v2/containers/FindStudiosV2Container';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';

const FindStudiosPage: NextLayoutPage = () => (
  <Authenticated>
    <TalentHubM2Guard>
      <FindStudiosV2Container />
    </TalentHubM2Guard>
  </Authenticated>
);

FindStudiosPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Discover' }, { label: 'Studios' }]}>{page}</TalentHubLayout>
);
FindStudiosPage.loggerConfig = { rosId: RosTeams.Knowledge };

export default FindStudiosPage;
