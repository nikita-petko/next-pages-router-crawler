import { createContext } from 'react';
import { ItemConfigurationCollectiblesMetadataResponse } from '@modules/clients';
import { RobloxItemConfigurationApiGetItemResponse } from '@rbx/client-itemconfiguration/v1';

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
