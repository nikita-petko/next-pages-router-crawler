import { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import Authenticated from '@modules/authentication/Authenticated';
import StudioProfileV2Container from '@modules/talent-hub-v2/containers/StudioProfileV2Container';
import TalentHubV2Guard from '@modules/talent-hub-v2/guards/TalentHubV2Guard';
import { TalentHubLayout } from '@modules/talent-hub-v2/components/shared/TalentHubLayout';

const StudioProfilePage: NextLayoutPage = () => {
  const router = useRouter();
  const { studioId } = router.query;

  if (!router.isReady || typeof studioId !== 'string') {
    return null;
  }

  return (
    <Authenticated>
      <TalentHubV2Guard v2={<StudioProfileV2Container studioId={studioId} />} />
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

export default StudioProfilePage;
