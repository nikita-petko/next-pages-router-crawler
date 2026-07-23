import React, { useCallback, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { List, Typography, ChevronRightIcon, ChevronLeftIcon, IconButton } from '@rbx/ui';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import throwError from '../utilities/error';
import useIncrementalRendering from './hooks/useIncrementalRendering';
import { SearchableContainer } from './hooks/useSearchNavigation';
import { RecentlyVisitedItem } from './RecentlyVisitedItem';
import type {
  TResultClickedInteraction,
  TCategoryClickedInteraction,
  TCategoryClearedInteraction,
} from './searchEvents';
import { isRealMouseClickEvent } from './searchEvents';
import useSearchListStyles from './SearchList.styles';
import type {
  SearchListItemLinkWrapperProps,
  SearchResultImpressionContext,
} from './SearchListItem';
import { placeholderEndAdornment, SearchListItemLink } from './SearchListItem';
import type { TSearchListItem } from './types/SearchListItem';

export interface SearchListProps {
  showAllResultsButton?: boolean;
  isTitleClickable?: boolean;
  title?: string;
  items: TSearchListItem[];
  onClickTitle?: (interaction: TCategoryClickedInteraction) => void;
  onClearFilter?: (interaction: TCategoryClearedInteraction) => void;
  onClickItem: SearchListItemLinkWrapperProps['onClickItem'];
  onRemove?: (id: string) => void;
  impressionContext?: Omit<SearchResultImpressionContext, 'rank'>;
  allResultsLabel?: string;
}

export const SearchList: React.FC<SearchListProps> = ({
  showAllResultsButton = false,
  isTitleClickable,
  title,
  items,
  onClickTitle,
  onClearFilter,
  onClickItem,
  onRemove,
  impressionContext,
  allResultsLabel,
}) => {
  const { classes, cx } = useSearchListStyles();
  const { translate } = useTranslation();
  const { visibleCount, sentinelRef, hasMore } = useIncrementalRendering(items.length);
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  const onClickLink = useCallback(
    (item: TSearchListItem, interaction: TResultClickedInteraction) => {
      onClickItem(item, interaction);
    },
    [onClickItem],
  );

  if (isTitleClickable && !showAllResultsButton && !onClickTitle) {
    throwError('SearchList: onClickTitle is required when isTitleClickable is true');
  }

  const onClickListTitle = (e: React.MouseEvent) => {
    if (isRealMouseClickEvent(e)) {
      onClickTitle?.(ESearchInteraction.ClickCategoryTitle);
    } else {
      onClickTitle?.(ESearchInteraction.KeyboardEnterCategoryTitle);
    }
  };

  const onClickAllResults = (e: React.MouseEvent) => {
    if (isRealMouseClickEvent(e)) {
      onClearFilter?.(ESearchInteraction.ClickCategoryTitle);
    } else {
      onClearFilter?.(ESearchInteraction.KeyboardEnterCategoryTitle);
    }
  };

  return (
    <>
      {!showAllResultsButton && title && (
        <div
          className={cx(classes.sectionTitleContainer, {
            [classes.sectionTitleHasButtonIcon]: isTitleClickable,
          })}>
          <Typography
            variant='tableHead'
            component='h2'
            color='primary'
            onClick={isTitleClickable ? onClickListTitle : undefined}
            className={cx(classes.sectionTitle, {
              [classes.isClickable]: isTitleClickable,
            })}>
            {title}
          </Typography>
          {isTitleClickable && (
            <IconButton
              onClick={onClickListTitle}
              aria-label={translate('Label.ClickFilter') || 'Click filter'}
              color='secondary'
              className={classes.chevronButton}>
              <ChevronRightIcon />
            </IconButton>
          )}
        </div>
      )}
      {showAllResultsButton && (
        <div className={classes.sectionTitleContainerAllResults}>
          <IconButton
            onClick={onClickAllResults}
            aria-label={allResultsLabel ?? (translate('Label.AllResults') || 'All Results')}
            color='secondary'
            className={classes.chevronButton}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography
            variant='tableHead'
            component='h2'
            color='primary'
            className={cx(classes.sectionTitleAllResults, {
              [classes.isClickable]: isTitleClickable,
            })}
            onClick={isTitleClickable ? onClickAllResults : undefined}>
            {allResultsLabel ?? (translate('Label.AllResults') || 'All Results')}
          </Typography>
        </div>
      )}
      <List
        className={classes.listContainer}
        data-list-container={SearchableContainer.List}
        tabIndex={-1}>
        {visibleItems.map((item, index) =>
          onRemove ? (
            <RecentlyVisitedItem
              key={item.id}
              item={item}
              onClickItem={onClickLink}
              onRemove={onRemove}
              className={item.className}
              ariaLabel={item.ariaLabel}
            />
          ) : (
            <SearchListItemLink
              key={item.id}
              item={item}
              onClickItem={onClickLink}
              className={item.className}
              ariaLabel={item.ariaLabel}
              endAdornment={placeholderEndAdornment}
              impressionContext={
                impressionContext ? { ...impressionContext, rank: index } : undefined
              }
            />
          ),
        )}
        {hasMore && <div ref={sentinelRef} aria-hidden='true' style={{ height: 1 }} />}
      </List>
    </>
  );
};
