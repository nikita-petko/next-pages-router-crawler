import type { FunctionComponent } from 'react';
import React, { useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import { Chip, makeStyles, Typography } from '@rbx/ui';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import { isInteractKey } from '../layout/layout/utils/keyboardNavigationHandler';
import {
  useSearchNavigation,
  SearchableContainer,
  ESearchNavigationElement,
} from './hooks/useSearchNavigation';
import type { TCategoryClickedInteraction } from './searchEvents';
import { isRealMouseClickEvent } from './searchEvents';
import type { SearchCategory, SearchDisplayCategoryDef } from './utils/searchCategories';
import { SEARCH_DISPLAY_CATEGORIES, LEARN_SUBCATEGORY_CHIPS } from './utils/searchCategories';

interface FilterChipsSectionProps {
  onClickFilter: (filter: SearchCategory, interaction: TCategoryClickedInteraction) => void;
}

interface DisplayCategoryChipsSectionProps {
  onClickFilter: (
    filter: SearchDisplayCategoryDef,
    interaction: TCategoryClickedInteraction,
  ) => void;
}

const useFilterChipsSectionStyles = makeStyles()(() => ({
  filterChipsSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  filterChipsSectionTitle: {
    padding: '8px 16px',
  },
  filterChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '8px 16px',
  },
}));

export const FilterChip: FunctionComponent<{
  filter: SearchCategory;
  onClickFilter: (filter: SearchCategory, interaction: TCategoryClickedInteraction) => void;
  translate: (key: string, args?: Record<string, string>) => string;
}> = ({ filter, onClickFilter, translate }) => {
  const chipRef = useRef<HTMLDivElement>(null);
  const { onKeyDownSearch } = useSearchNavigation(chipRef);

  const onClickChip = (e: React.MouseEvent) => {
    // Only handle trusted mouse/touch events, not synthetic clicks from keyboard
    if (isRealMouseClickEvent(e)) {
      onClickFilter(filter, ESearchInteraction.ClickCategoryPill);
    }
  };

  const onKeyDownChip = (e: React.KeyboardEvent) => {
    if (isInteractKey(e)) {
      e.preventDefault();
      e.stopPropagation();
      onClickFilter(filter, ESearchInteraction.KeyboardEnterCategoryPill);
    } else {
      onKeyDownSearch(e);
    }
  };

  return (
    <Chip
      ref={chipRef}
      // oxlint-disable-next-line typescript/no-unnecessary-template-expression
      label={translate(`${filter.translationKey}`) || filter.fallbackLabel}
      size='small'
      color='secondary'
      tabIndex={0}
      data-search-navigation-element={ESearchNavigationElement.Chip}
      onClick={onClickChip}
      onKeyDown={onKeyDownChip}
    />
  );
};

/**
 * Display category filter chip (Hub/Learn)
 */
export const DisplayFilterChip: FunctionComponent<{
  filter: SearchDisplayCategoryDef;
  onClickFilter: (
    filter: SearchDisplayCategoryDef,
    interaction: TCategoryClickedInteraction,
  ) => void;
  translate: (key: string, args?: Record<string, string>) => string;
}> = ({ filter, onClickFilter, translate }) => {
  const chipRef = useRef<HTMLDivElement>(null);
  const { onKeyDownSearch } = useSearchNavigation(chipRef);

  const onClickChip = (e: React.MouseEvent) => {
    if (isRealMouseClickEvent(e)) {
      onClickFilter(filter, ESearchInteraction.ClickCategoryPill);
    }
  };

  const onKeyDownChip = (e: React.KeyboardEvent) => {
    if (isInteractKey(e)) {
      e.preventDefault();
      e.stopPropagation();
      onClickFilter(filter, ESearchInteraction.KeyboardEnterCategoryPill);
    } else {
      onKeyDownSearch(e);
    }
  };

  return (
    <Chip
      ref={chipRef}
      // oxlint-disable-next-line typescript/no-unnecessary-template-expression
      label={translate(`${filter.translationKey}`) || filter.fallbackLabel}
      size='small'
      color='secondary'
      tabIndex={0}
      data-search-navigation-element={ESearchNavigationElement.Chip}
      onClick={onClickChip}
      onKeyDown={onKeyDownChip}
    />
  );
};

/**
 * Shows subcategory chips (Engine API, Cloud API, etc.) when Learn is selected in /docs context
 */
export const FilterChipsSection: FunctionComponent<FilterChipsSectionProps> = ({
  onClickFilter,
}) => {
  const { classes } = useFilterChipsSectionStyles();
  const { translate } = useTranslation();
  return (
    <div className={classes.filterChipsSection}>
      <Typography
        variant='tableHead'
        component='h2'
        color='secondary'
        className={classes.filterChipsSectionTitle}>
        {translate('Label.FilterByCategory') || 'Filter by category'}
      </Typography>
      <div className={classes.filterChips} data-filter-chips-container={SearchableContainer.Chips}>
        {/* Use LEARN_SUBCATEGORY_CHIPS instead of SEARCH_CATEGORIES to exclude Pages */}
        {LEARN_SUBCATEGORY_CHIPS.map((filter: SearchCategory) => (
          <FilterChip
            key={filter.value}
            filter={filter}
            onClickFilter={onClickFilter}
            translate={translate}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Shows Hub/Learn/Store display category chips (default state).
 */
export const DisplayCategoryChipsSection: FunctionComponent<DisplayCategoryChipsSectionProps> = ({
  onClickFilter,
}) => {
  const { classes } = useFilterChipsSectionStyles();
  const { translate } = useTranslation();

  return (
    <div className={classes.filterChipsSection}>
      <Typography
        variant='tableHead'
        component='h2'
        color='secondary'
        className={classes.filterChipsSectionTitle}>
        {translate('Label.FilterByCategory') || 'Filter by category'}
      </Typography>
      <div className={classes.filterChips} data-filter-chips-container={SearchableContainer.Chips}>
        {SEARCH_DISPLAY_CATEGORIES.map((filter: SearchDisplayCategoryDef) => (
          <DisplayFilterChip
            key={filter.value}
            filter={filter}
            onClickFilter={onClickFilter}
            translate={translate}
          />
        ))}
      </div>
    </div>
  );
};
