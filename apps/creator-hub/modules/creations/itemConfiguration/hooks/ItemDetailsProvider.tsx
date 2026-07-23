import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { RobloxItemConfigurationApiGetItemResponse } from '@rbx/client-itemconfiguration/v1';
import type { ItemConfigurationCollectiblesMetadataResponse } from '@modules/clients/itemconfiguration';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import ItemDetailsContext from './ItemDetailsContext';

const ItemDetailsProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const router = useRouter();

  const [collectiblesMetadata, setCollectiblesMetadata] =
    useState<ItemConfigurationCollectiblesMetadataResponse | null>();
  const [isLoadingItem, setisLoadingItem] = useState<boolean>(true);
  const [marketplaceItemDetails, setMarketplaceItemDetails] =
    useState<RobloxItemConfigurationApiGetItemResponse | null>();

  const fetchDetails = useCallback(async () => {
    const { isReady } = router;
    if (!isReady) {
      return;
    }
    const { id } = router.query;

    const isBundle = router.pathname.split('/').includes('bundle');

    const [collectiblesPublishingMetadata, getItemResponse] = await Promise.allSettled([
      itemconfigurationClient.getCollectiblesMetadata(),
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- pre-existing route param cast
      itemconfigurationClient.getItem(isBundle, id as string),
    ]);

    if (collectiblesPublishingMetadata.status === 'fulfilled') {
      setCollectiblesMetadata(collectiblesPublishingMetadata.value);
    } else {
      unifiedLoggerClient.logErrorEvent({
        eventName: 'itemConfigurationLoadFailure',
        parameters: {
          failedCall: 'getCollectiblesMetadata',
          error:
            collectiblesPublishingMetadata.reason instanceof Error
              ? collectiblesPublishingMetadata.reason.message
              : 'Unknown error',
        },
      });
      setCollectiblesMetadata(null);
    }
    if (getItemResponse.status === 'fulfilled') {
      setMarketplaceItemDetails(getItemResponse.value);
    } else {
      unifiedLoggerClient.logErrorEvent({
        eventName: 'itemConfigurationLoadFailure',
        parameters: {
          failedCall: 'getItem',
          error:
            getItemResponse.reason instanceof Error
              ? getItemResponse.reason.message
              : 'Unknown error',
        },
      });
      setMarketplaceItemDetails(null);
    }
    setisLoadingItem(false);
  }, [router]);

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler, typescript/no-floating-promises -- pre-existing fire-and-forget fetch on mount
    fetchDetails();
  }, [fetchDetails]);

  const refreshItemDetails = useCallback(() => {
    // oxlint-disable-next-line typescript/no-floating-promises -- pre-existing fire-and-forget refresh
    fetchDetails();
  }, [fetchDetails]);

  const contextValue = useMemo(
    () => ({
      isLoadingItem,
      refreshItemDetails,
      collectiblesMetadata,
      marketplaceItemDetails,
    }),
    [isLoadingItem, refreshItemDetails, collectiblesMetadata, marketplaceItemDetails],
  );

  return <ItemDetailsContext.Provider value={contextValue}>{children}</ItemDetailsContext.Provider>;
};

export default ItemDetailsProvider;
