import type { FunctionComponent } from 'react';
import React, { useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles, Typography } from '@rbx/ui';
import { useSearchConfig } from '../contexts/SearchConfigContext';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import { getCreatorHubBaseUrl } from '../utilities/getBasePaths';
import { ESearchNavigationElement, useSearchNavigation } from './hooks/useSearchNavigation';
import type { TStoreNavClickedInteraction } from './searchEvents';
import { getModifierKeyInteraction, isRealMouseClickEvent } from './searchEvents';
import { SvgIconKeyboardReturn, SvgIconSearch } from './searchIcons';
import { buildStoreCategoryUrl } from './utils/storeCategoryTiles';

interface SearchInStoreItemProps {
  /**
   * Current search query. The destination URL appends `?keyword=<query>` and
   * the row label shows `<query> in Store`.
   */
  query: string;
  /** Fires the dedicated "Search in Store" click event. */
  onClickItem: (href: string, interaction: TStoreNavClickedInteraction) => void;
}

const useSearchInStoreItemStyles = makeStyles()((theme) => ({
  row: {
    display: 'flex',
    alignItems: 'center',
    // Match the regular result rows (SearchListItem: padding 8px 16px, font-size
    // 14, lineHeight 1.4). Those wrap to two lines (title + secondary); this row
    // is a single line, so reserve the same height (two lines + padding) to keep
    // the row height consistent.
    padding: '8px 16px',
    minHeight: 'calc(1.4em * 2 + 16px)',
    boxSizing: 'border-box',
    fontSize: 14,
    lineHeight: 1.4,
    color: theme.palette.content.muted,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover, &:focus-visible': {
      backgroundColor: theme.palette.states.hover,
      textDecoration: 'none',
    },
    // Focus ring is intentionally left to the global design-system :focus-visible
    // outline so it matches the search result rows (don't override the color).
  },
  iconContainer: {
    // Mirrors `listItemIcon` (width 44) + `iconContainer` (28×28) from
    // SearchListItem.styles so the leading icon column lines up exactly.
    width: 44,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    color: 'inherit',
  },
  iconInner: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    flex: 1,
    lineHeight: 1.4,
    minWidth: 0,
  },
  query: {
    color: theme.palette.content.standard,
    fontWeight: 600,
  },
  suffix: {
    color: theme.palette.content.muted,
  },
  endAdornment: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 8,
    color: theme.palette.content.muted,
    lineHeight: 0,
  },
}));

/**
 * Row rendered at the bottom of the Store-drilled-in search list that lets the
 * user fall back to the full Creator Store search results for the current query
 * (`/store/models?keyword=<query>`). Opens in the same tab and fires a dedicated
 * click event, following the same anchor + onClick paradigm as the result rows.
 */
export const SearchInStoreItem: FunctionComponent<SearchInStoreItemProps> = ({
  query,
  onClickItem,
}) => {
  const { robloxSiteDomain } = useSearchConfig();
  const { translate } = useTranslation();
  const { classes } = useSearchInStoreItemStyles();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const { onKeyDownSearch } = useSearchNavigation(linkRef);
  // Show the keyboard-return (↵) affordance on focus, matching the result rows.
  const [isFocused, setIsFocused] = useState(false);

  const trimmed = query.trim();
  const href = buildStoreCategoryUrl(
    getCreatorHubBaseUrl(robloxSiteDomain),
    '/store/models',
    query,
  );

  // Track the click; the anchor handles same-tab navigation natively (and Enter,
  // and modifier/middle-click → new tab) just like the result rows.
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClickItem(
      href,
      isRealMouseClickEvent(e)
        ? getModifierKeyInteraction(e, false)
        : ESearchInteraction.KeyboardEnter,
    );
  };

  if (!trimmed) {
    return null;
  }

  const suffix = translate('Label.InStoreSuffix') || 'in Store';
  const ariaLabel =
    translate('Label.SearchInStoreAriaLabel', { query: trimmed }) ||
    `Search for ${trimmed} in the Creator Store`;

  return (
    <a
      ref={linkRef}
      href={href}
      tabIndex={0}
      data-search-navigation-element={ESearchNavigationElement.ListItem}
      onClick={onClick}
      onKeyDown={onKeyDownSearch}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      aria-label={ariaLabel}
      className={classes.row}>
      <span className={classes.iconContainer} aria-hidden='true'>
        <span className={classes.iconInner}>
          <SvgIconSearch />
        </span>
      </span>
      <Typography variant='body2' component='span' className={classes.label}>
        <span className={classes.query}>{trimmed}</span>{' '}
        <span className={classes.suffix}>{suffix}</span>
      </Typography>
      {isFocused && (
        <span className={classes.endAdornment} aria-hidden='true'>
          <SvgIconKeyboardReturn />
        </span>
      )}
    </a>
  );
};

export default SearchInStoreItem;
