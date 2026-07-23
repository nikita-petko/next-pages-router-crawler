import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import Authenticated from '@modules/authentication/Authenticated';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';
import { StudioProfileV2Container } from '@modules/talent-hub-v2/containers/StudioProfileV2Container';
import TalentHubM2Guard from '@modules/talent-hub-v2/guards/TalentHubM2Guard';

const StudioProfilePage: NextLayoutPage = () => {
  const router = useRouter();
  const { studioId } = router.query;

  if (!router.isReady || typeof studioId !== 'string') {
    return null;
  }

  return (
    <Authenticated>
      <TalentHubM2Guard>
        <StudioProfileV2Container studioId={studioId} />
      </TalentHubM2Guard>
    </Authenticated>
  );
};

StudioProfilePage.getPageLayout = (page: ReactNode) => (
  <TalentHubLayout
    crumbs={[
      { label: 'Discover' },
      { label: 'Studios', href: '/hire/studios?th2=1' },
      { label: 'Studio Profile' },
    ]}>
    {page}
  </TalentHubLayout>
);
StudioProfilePage.loggerConfig = { rosId: RosTeams.Knowledge };

export default StudioProfilePage;
