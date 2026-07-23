import { Asset } from '@modules/miscellaneous/common';
import { SearchSortParameter } from '@rbx/clients/universesApi';
import { EventSortBy } from '@rbx/clients/virtualEventsApi';
import { SortOrder } from '@rbx/core';
import { createContext, Context } from 'react';
import type { CreationsFilters } from '../interfaces/CreationsFilters';

export interface CreationsFiltersContext extends Context<CreationsFilters> {
  displayName: 'CreationsFilters';
}

export const defaultAssetsSort = {
  [Asset.Place]: SearchSortParameter.LastUpdated,
  [Asset.UpcomingEvent]: EventSortBy.StartUtc,
  [Asset.PastEvent]: EventSortBy.StartUtc,
  [Asset.DraftEvent]: EventSortBy.StartUtc,
};

const defaultCreationsFilters = {
  sort: defaultAssetsSort,
  setSort: () => {
    throw new Error('NotImplemented');
  },
  sortOrder: SortOrder.Desc,
  setSortOrder: () => {
    throw new Error('NotImplemented');
  },
  isArchived: false,
  setIsArchived: () => {
    throw new Error('NotImplemented');
  },
  isAgeRestrictedCollaboration: false,
  setIsAgeRestrictedCollaboration: () => {
    throw new Error('NotImplemented');
  },
  isPublicOnly: false,
  setIsPublicOnly: () => {
    throw new Error('NotImplemented');
  },
  isOnMarketplace: false,
  setIsOnMarketplace: () => {
    throw new Error('NotImplemented');
  },
  resetAllFilters: () => {
    throw new Error('NotImplemented');
  },
};

const creationsFiltersContext = createContext<CreationsFilters>(defaultCreationsFilters);
creationsFiltersContext.displayName = 'Filters';

export default creationsFiltersContext;
