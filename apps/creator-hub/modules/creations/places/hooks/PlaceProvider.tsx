import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { DevelopAssetDetailsResponse, developClient, universesClient } from '@modules/clients';
import useThumbnailImage from '@modules/miscellaneous/common/components/ThumbnailImage/useThumbnailImage';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import PlaceDetailsContext from './PlaceDetailsContext';

const PlaceProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({ children }) => {
  const router = useRouter();
  const [placeDetails, setPlaceDetails] = useState<DevelopAssetDetailsResponse>();
  const [canConfigurePlace, setCanConfigurePlace] = useState<boolean>(false);
  const [isPlaceLoading, setIsPlaceLoading] = useState<boolean>(true);
  const [containingUniverse, setContainingUniverse] = useState<number>(0);

  const { query: routerQuery, isReady: isRouterReady } = useRouter();
  const placeId = useMemo(() => {
    if (isRouterReady) {
      const { placeId: routerPlaceId } = routerQuery;
      if (routerPlaceId) {
        const parsedId = parseInt(routerPlaceId as string, 10);
        return parsedId > 0 ? parsedId : undefined;
      }
    }
    return undefined;
  }, [routerQuery, isRouterReady]);

  const { thumbnailImage: placeIcon, refreshThumbnail } = useThumbnailImage({
    targetId: placeId ?? 0,
    targetType: ThumbnailTypes.placeIcon,
    returnPolicy: ReturnPolicy.PlaceHolder,
    alt: placeDetails?.name,
    fontColor: 'dark',
  });

  const getPlaceDetails = useCallback(async () => {
    setIsPlaceLoading(true);
    const id = router.query?.id;
    if (typeof placeId === 'undefined') {
      return;
    }

    try {
      const placeDetailsPromise = developClient.getAssetDetails([placeId]);
      const universeIdPromise = universesClient.getUniverseContainingPlace(placeId);
      const placeDetailsResponse = await placeDetailsPromise;
      setPlaceDetails(placeDetailsResponse.data?.[0]);
      setContainingUniverse((await universeIdPromise).universeId ?? 0);
      setCanConfigurePlace(true);
    } catch {
      // eslint-disable-next-line no-console
      console.warn(`Could not fetch place ${placeId} details for universeId ${id}`);
    } finally {
      setIsPlaceLoading(false);
    }
  }, [router.query?.id, placeId]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    getPlaceDetails();
  }, [getPlaceDetails, router.isReady]);

  const cachedPlaceProviderValue = useMemo(() => {
    const refreshPlaceDetails = () => {
      return getPlaceDetails();
    };

    return {
      placeDetails,
      canConfigurePlace,
      containingUniverse,
      refreshPlaceDetails,
      isPlaceLoading,
      placeIcon,
      refreshPlaceIcon: refreshThumbnail,
    };
  }, [
    placeDetails,
    canConfigurePlace,
    containingUniverse,
    getPlaceDetails,
    isPlaceLoading,
    placeIcon,
    refreshThumbnail,
  ]);

  return (
    <PlaceDetailsContext.Provider value={cachedPlaceProviderValue}>
      {children}
    </PlaceDetailsContext.Provider>
  );
};

export default PlaceProvider;
