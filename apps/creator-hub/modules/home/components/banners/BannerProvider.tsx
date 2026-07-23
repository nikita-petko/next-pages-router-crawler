import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { CreatorHomeClient } from '@modules/clients';
import { BannerConfiguration } from '@rbx/clients/creatorHomeApi';
import { useRouter } from 'next/router';
import { useCreator } from '../../providers/CreatorProvider';

type TCachedBanner = BannerConfiguration & { creatorHubId: string; bannerCacheExpiry?: string };

type TBannerContextValue = {
  bannerData?: BannerConfiguration;
  clearBannerData: (bannerId: string | undefined) => void;
};

const BannerContext = createContext<TBannerContextValue>({
  clearBannerData: () => {},
});

const HOUR_IN_MS = 60 * 60 * 1000;

const BannerProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { context } = useCreator();
  const router = useRouter();
  const [bannerData, setBannerData] = useState<BannerConfiguration | undefined>(undefined);
  const loadBannerAttemptContextId = useRef<string>('');

  useEffect(() => {
    if (!router.isReady || (router.query.groupId && context.type === 'User') || !context?.id) {
      return;
    }

    if (loadBannerAttemptContextId.current !== context?.id) {
      setBannerData(undefined);
    }

    let cachedBannerLoaded = false;
    const cachedBanner =
      typeof window !== 'undefined' ? localStorage.getItem(`creatorHubBanner.${context.id}`) : null;
    if (cachedBanner) {
      const deserializedCachedBanner: TCachedBanner = JSON.parse(cachedBanner);

      if (
        deserializedCachedBanner &&
        deserializedCachedBanner?.creatorHubId === context.id &&
        deserializedCachedBanner?.expiry &&
        new Date(deserializedCachedBanner.expiry) > new Date() &&
        deserializedCachedBanner?.bannerCacheExpiry &&
        new Date(deserializedCachedBanner?.bannerCacheExpiry) > new Date()
      ) {
        setBannerData(deserializedCachedBanner);
        cachedBannerLoaded = true;
        loadBannerAttemptContextId.current = context.id;
      }
    }

    let getBannerPromise: Promise<{ banners: BannerConfiguration[] }>;
    if (context.type === 'User') {
      getBannerPromise =
        CreatorHomeClient.creatorHomeContentApi.creatorHomeContentGetCreatorHubFeaturesByUser({
          userId: Number(context.id),
        });
    } else {
      getBannerPromise =
        CreatorHomeClient.creatorHomeContentApi.creatorHomeContentGetCreatorHubFeaturesByGroup({
          groupId: Number(context.id),
        });
    }

    const runBannerPromise = async () => {
      try {
        const response = await getBannerPromise;
        if (response.banners.length === 0) {
          return;
        }

        const banner = response.banners[0];
        if (typeof window !== 'undefined') {
          const newCachedBanner: TCachedBanner = {
            ...banner,
            creatorHubId: context.id,
            bannerCacheExpiry: new Date(Date.now() + HOUR_IN_MS).toString(),
          };
          localStorage.setItem(`creatorHubBanner.${context.id}`, JSON.stringify(newCachedBanner));
        }
        if (!cachedBannerLoaded) {
          setBannerData(banner);
          loadBannerAttemptContextId.current = context.id;
        }
      } catch {
        // Do nothing
      }
    };

    runBannerPromise();
  }, [context.id, context.type, router.isReady, router.query.groupId]);

  const clearBannerData = useCallback(
    (bannerId: string | undefined) => {
      if (typeof window !== 'undefined') {
        const cachedBanner = localStorage.getItem(`creatorHubBanner.${context.id}`);
        if (cachedBanner && bannerId) {
          const deserializedCachedBanner: TCachedBanner = JSON.parse(cachedBanner);
          if (deserializedCachedBanner?.banner === bannerId) {
            localStorage.setItem(`creatorHubBanner.${context.id}`, '');
          }
        }
      }

      setBannerData(undefined);
    },
    [context.id],
  );

  const bannerContextValue = React.useMemo(() => {
    return {
      bannerData,
      clearBannerData,
    };
  }, [bannerData, clearBannerData]);

  return <BannerContext.Provider value={bannerContextValue}>{children}</BannerContext.Provider>;
};

export { BannerContext, BannerProvider };
