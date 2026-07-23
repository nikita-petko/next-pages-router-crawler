import { createContext } from 'react';
import type { RobloxItemConfigurationApiGetItemResponse } from '@rbx/client-itemconfiguration/v1';
import type { ItemConfigurationCollectiblesMetadataResponse } from '@modules/clients/itemconfiguration';

export interface ItemDetailsContextValue {
  isLoadingItem: boolean;
  refreshItemDetails: () => void;
  collectiblesMetadata: ItemConfigurationCollectiblesMetadataResponse | undefined | null;
  marketplaceItemDetails: RobloxItemConfigurationApiGetItemResponse | undefined | null;
}
const defaultDetails: ItemDetailsContextValue = {
  isLoadingItem: false,
  refreshItemDetails: () => {
    throw new Error('function is not implemented');
  },
  collectiblesMetadata: undefined,
  marketplaceItemDetails: undefined,
};

const itemDetailsContext = createContext<ItemDetailsContextValue>(defaultDetails);
itemDetailsContext.displayName = 'ItemDetails';

export default itemDetailsContext;
