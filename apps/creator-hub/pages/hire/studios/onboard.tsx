import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import Authenticated from '@modules/authentication/Authenticated';
import StudioOnboardingV2Container from '@modules/talent-hub-v2/containers/StudioOnboardingV2Container';
import TalentHubV2Guard from '@modules/talent-hub-v2/guards/TalentHubV2Guard';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';

const StudioOnboardingPage: NextLayoutPage = () => (
  <Authenticated>
    <TalentHubV2Guard v2={<StudioOnboardingV2Container />} />
  </Authenticated>
);

StudioOnboardingPage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout crumbs={[{ label: 'Discover' }, { label: 'Post a job' }]}>
    {page}
  </TalentHubLayout>
);

export default StudioOnboardingPage;
