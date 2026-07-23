import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { SortOrder } from '@rbx/core';
import { useLocalStorage } from '@rbx/react-utilities';
import { useAuthentication } from '@modules/authentication/providers';
import CreationsFiltersContext, { defaultAssetsSort } from '../contexts/CreationsFiltersContext';
import { AssetSorts } from '../interfaces/CreationsFilters';

const defaultFilters = {
  sort: defaultAssetsSort,
  sortOrder: SortOrder.Desc,
  isArchived: false,
  isPublishOnly: false,
  isOnMarketplace: false,
};

export const CreationsFiltersProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const { user: currentUser } = useAuthentication();

  const [rawSort, setSort] = useLocalStorage(
    `creationSort.${currentUser?.id}`,
    defaultFilters.sort,
  ) as [AssetSorts, Dispatch<SetStateAction<AssetSorts>>];

  const stableSortRef = useRef(rawSort);
  const sort = useMemo(() => {
    const prev = stableSortRef.current;
    const keys = Object.keys(rawSort) as Array<keyof AssetSorts>;
    const changed = keys.some((k) => rawSort[k] !== prev[k]);
    if (changed) {
      stableSortRef.current = rawSort;
    }
    return stableSortRef.current;
  }, [rawSort]);
  const [sortOrder, setSortOrder] = useLocalStorage(
    `creationSortOrder.${currentUser?.id}`,
    defaultFilters.sortOrder,
  ) as [SortOrder, Dispatch<SetStateAction<SortOrder>>];
  const [isArchived, setIsArchived] = useState<boolean>(defaultFilters.isArchived);
  const [isAgeRestrictedCollaboration, setIsAgeRestrictedCollaboration] = useState<boolean>(false);
  const [isPublicOnly, setIsPublicOnly] = useState<boolean>(defaultFilters.isPublishOnly);
  const [isOnMarketplace, setIsOnMarketplace] = useState<boolean>(defaultFilters.isOnMarketplace);

  const resetAllFilters = useCallback(() => {
    setSort(defaultFilters.sort);
    setSortOrder(defaultFilters.sortOrder);
    setIsArchived(defaultFilters.isArchived);
    setIsAgeRestrictedCollaboration(false);
    setIsPublicOnly(defaultFilters.isPublishOnly);
    setIsOnMarketplace(defaultFilters.isOnMarketplace);
  }, [setSort, setSortOrder]);

  const contextValue = useMemo(
    () => ({
      isArchived,
      isAgeRestrictedCollaboration,
      isOnMarketplace,
      isPublicOnly,
      resetAllFilters,
      setIsArchived,
      setIsAgeRestrictedCollaboration,
      setIsOnMarketplace,
      setIsPublicOnly,
      setSort,
      setSortOrder,
      sort,
      sortOrder,
    }),
    [
      isArchived,
      isAgeRestrictedCollaboration,
      isOnMarketplace,
      isPublicOnly,
      resetAllFilters,
      setIsArchived,
      setIsAgeRestrictedCollaboration,
      setIsOnMarketplace,
      setIsPublicOnly,
      setSort,
      setSortOrder,
      sort,
      sortOrder,
    ],
  );

  return (
    <CreationsFiltersContext.Provider value={contextValue}>
      {children}
    </CreationsFiltersContext.Provider>
  );
};

export default CreationsFiltersProvider;
