import { Dispatch, SetStateAction } from 'react';
import { SortOrder } from '@rbx/core';
import { Asset } from '@modules/miscellaneous/common';
import { EventSortBy } from '@rbx/clients/virtualEventsApi';
import { SearchSortParameter } from '@rbx/clients/universesApi';

export type AssetSorts = {
  [Asset.Place]: SearchSortParameter;
  [Asset.UpcomingEvent]: EventSortBy;
  [Asset.PastEvent]: EventSortBy;
  [Asset.DraftEvent]: EventSortBy;
};

export interface CreationsFilters {
  isArchived: boolean;
  isAgeRestrictedCollaboration: boolean;
  isOnMarketplace: boolean;
  isPublicOnly: boolean;
  setIsArchived: Dispatch<SetStateAction<boolean>>;
  setIsAgeRestrictedCollaboration: Dispatch<SetStateAction<boolean>>;
  setIsOnMarketplace: Dispatch<SetStateAction<boolean>>;
  setIsPublicOnly: Dispatch<SetStateAction<boolean>>;
  setSort: Dispatch<SetStateAction<AssetSorts>>;
  setSortOrder: Dispatch<SetStateAction<SortOrder>>;
  sort: AssetSorts;
  sortOrder: SortOrder;
  resetAllFilters: () => void;
}

export function getSortForAssetType(assetType: Asset, sorts: AssetSorts) {
  // NOTE (dlevine, 11/03/2022): we can't just index the sorts by the assetType because the AssetSorts type knows that only
  // Places, and the three event types are valid indexes. The explicit if statement clarifies that for the type checker
  if (
    assetType === Asset.UpcomingEvent ||
    assetType === Asset.PastEvent ||
    assetType === Asset.DraftEvent
  ) {
    return sorts[assetType];
  }
  return sorts[Asset.Place];
}
