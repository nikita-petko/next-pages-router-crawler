import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  itemconfigurationClient,
  ItemConfigurationCollectiblesMetadataResponse,
} from '@modules/clients';
import { RobloxItemConfigurationApiGetItemResponse } from '@rbx/client-itemconfiguration/v1';
import ItemDetailsContext from './ItemDetailsContext';

const ItemDetailsProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({ children }) => {
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
      itemconfigurationClient.getCollectiblePublishingMetadata(),
      itemconfigurationClient.getItem(isBundle, id as string),
    ]);

    if (collectiblesPublishingMetadata.status === 'fulfilled') {
      setCollectiblesMetadata(collectiblesPublishingMetadata.value);
    } else {
      setCollectiblesMetadata(null);
    }
    if (getItemResponse.status === 'fulfilled') {
      setMarketplaceItemDetails(getItemResponse.value);
    } else {
      setMarketplaceItemDetails(null);
    }
    setisLoadingItem(false);
  }, [router]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const refreshItemDetails = useCallback(() => {
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
