import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import Routes from '@constants/routes';
import { setImpCookie } from '@services/ads/adAccountService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const GoImpersonate = () => {
  const router = useRouter();
  const hasTriggered = useRef(false);
  const { canUserImpersonate } = useAppStore((state: AppStoreType) => state.appMetadataState.data);
  const isMetadataLoading = useAppStore((state: AppStoreType) => state.appMetadataState.isLoading);

  useEffect(() => {
    if (!router.isReady || hasTriggered.current || isMetadataLoading) {
      return;
    }

    const { adAccountId } = router.query;
    if (typeof adAccountId !== 'string' || !UUID_PATTERN.test(adAccountId)) {
      router.replace(Routes.HOME);
      return;
    }

    if (!canUserImpersonate) {
      router.replace(Routes.HOME);
      return;
    }

    hasTriggered.current = true;

    setImpCookie(adAccountId)
      .then(() => {
        window.location.href = `${process.env.siteBasePath ?? ''}${Routes.MANAGE}`;
      })
      .catch(() => {
        router.replace(Routes.HOME);
      });
  }, [router.isReady, router.query, canUserImpersonate, isMetadataLoading, router]);

  return <CenteredCircularProgress />;
};

export default GoImpersonate;
