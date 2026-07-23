import { useEffect, type ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { PageLoading } from '@modules/miscellaneous/components';

const SelectPage: NextLayoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router?.isReady) {
      return;
    }

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Safe assert - note router overrides query params for path in pages router
    const universeId = router.query.id as string;
    if (universeId) {
      void router.replace(`/dashboard/creations/experiences/${universeId}/audience-reach`);
    }
  }, [router]);

  return <PageLoading />;
};

SelectPage.getPageLayout = (page: ReactNode) => getCreationsPageLayout(page);
SelectPage.loggerConfig = { rosId: RosTeams.Analytics };

export default SelectPage;
