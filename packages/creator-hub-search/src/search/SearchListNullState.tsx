import React, { useEffect, useState } from 'react';
import type { Locale } from '@rbx/intl';
import { useTranslation } from '@rbx/intl';
import { makeStyles } from '@rbx/ui';
import searchHistoryClient from '../clients/searchHistoryClient';
import { useSearchConfig } from '../contexts/SearchConfigContext';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import type { TResultClickedInteraction } from './searchEvents';
import {
  trackSearchRecentlyVisitedClicked,
  trackSearchRecentlyVisitedDeleted,
  trackSearchRecentlyVisitedImpression,
} from './searchEvents';
import { SearchList } from './SearchList';
import type { SearchListItemLinkWrapperProps } from './SearchListItem';
import type { TSearchListItem } from './types/SearchListItem';

type SearchListNullStateProps = {
  impressionRef: React.MutableRefObject<string | null>;
  locale: Locale;
  onClickItem: SearchListItemLinkWrapperProps['onClickItem'];
  searchSessionId: string;
};

const useNullStateStyles = makeStyles()(() => ({
  emptyDiv: {
    marginTop: '-8px',
    height: '0px',
  },
}));

const SearchListNullState: React.FC<SearchListNullStateProps> = ({
  impressionRef,
  locale,
  onClickItem,
  searchSessionId,
}) => {
  const { translate } = useTranslation();
  const { currentProduct, eventLogger } = useSearchConfig();
  const [recentlyVisited, setRecentlyVisited] = useState<TSearchListItem[]>([]);
  const { classes } = useNullStateStyles();
  useEffect(() => {
    const getRecentlyVisited = async () => {
      const items = await searchHistoryClient.getRecentlyVisited();
      setRecentlyVisited(items);
    };
    getRecentlyVisited();
  }, []);

  const onRemoveRecentlyVisitedItem = async (id: string) => {
    const updatedItems = await searchHistoryClient.removeFromRecentlyVisited(id);
    setRecentlyVisited(updatedItems);
  };

  useEffect(() => {
    if (
      !searchSessionId ||
      recentlyVisited.length === 0 ||
      impressionRef.current === searchSessionId
    ) {
      return;
    }
    impressionRef.current = searchSessionId;
    trackSearchRecentlyVisitedImpression({
      eventLogger,
      locale,
      recentlyVisited,
      currentProduct,
      searchSessionId,
    });
  }, [searchSessionId, recentlyVisited, impressionRef, locale, currentProduct, eventLogger]);

  const onRemoveItem = (id: string) => {
    const itemFromId = recentlyVisited.find((item) => item.id === id);
    if (itemFromId) {
      trackSearchRecentlyVisitedDeleted({
        eventLogger,
        interaction: ESearchInteraction.Click,
        item: itemFromId,
        locale,
        recentlyVisited,
        currentProduct,
        searchSessionId,
      });
    }
    onRemoveRecentlyVisitedItem(id);
  };

  const onClickRecentlyVisitedItem = (
    item: TSearchListItem,
    interaction: TResultClickedInteraction,
  ) => {
    trackSearchRecentlyVisitedClicked({
      eventLogger,
      interaction,
      item,
      locale,
      recentlyVisited,
      currentProduct,
      searchSessionId,
    });
    onClickItem(item, interaction);
  };

  return recentlyVisited.length > 0 ? (
    <SearchList
      title={translate('Label.RecentlyVisited') as string}
      isTitleClickable={false}
      items={recentlyVisited}
      onRemove={onRemoveItem}
      onClickItem={onClickRecentlyVisitedItem}
    />
  ) : (
    // NOTE (@tchu, 2025-08-22):
    // This is to remove the excess space in the search dialog when there are no recently visited items
    <div className={classes.emptyDiv} />
  );
};

export default React.memo(SearchListNullState);
