import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import FindStudiosV2Container from '@modules/talent-hub-v2/containers/FindStudiosV2Container';
import TalentHubV2Guard from '@modules/talent-hub-v2/guards/TalentHubV2Guard';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';

const FindStudiosPage: NextLayoutPage = () => (
  <Authenticated>
    <TalentHubV2Guard v2={<FindStudiosV2Container />} />
  </Authenticated>
);

FindStudiosPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Discover' }, { label: 'Studios' }]}>{page}</TalentHubLayout>
);

export default FindStudiosPage;
