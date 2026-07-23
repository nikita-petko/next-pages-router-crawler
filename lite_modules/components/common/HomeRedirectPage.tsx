import { useRouter } from 'next/router';
import { ReactElement, useEffect } from 'react';

import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import Routes from '@constants/routes';
import { useAppStore } from '@stores/appStoreProvider';

const HomeRedirectPage = (): ReactElement => {
  const isLoading = useAppStore((state) => state.appMetadataState?.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (router.isReady && !isLoading) {
      // remove tableView url param from query, which is only used in old reporting
      const { tableView, ...query } = router.query;
      router.replace({ pathname: Routes.MANAGE, query });
    }
  }, [isLoading, router]);

  return <CenteredCircularProgress />;
};

export default HomeRedirectPage;
