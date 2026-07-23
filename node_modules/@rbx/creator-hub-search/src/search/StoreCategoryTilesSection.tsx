import type { FunctionComponent } from 'react';
import React, { useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import { makeStyles, Typography } from '@rbx/ui';
import { useSearchConfig } from '../contexts/SearchConfigContext';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import { getCreatorHubBaseUrl } from '../utilities/getBasePaths';
import { ESearchNavigationElement, useSearchNavigation } from './hooks/useSearchNavigation';
import type { TStoreNavClickedInteraction } from './searchEvents';
import { getModifierKeyInteraction, isRealMouseClickEvent } from './searchEvents';
import type { StoreCategoryTile } from './utils/storeCategoryTiles';
import { STORE_CATEGORY_TILES, buildStoreCategoryUrl } from './utils/storeCategoryTiles';

/** Identifies which tile was clicked, for the dedicated tile click event. */
export interface StoreCategoryTileClick {
  id: string;
  label: string;
  href: string;
  index: number;
}

interface StoreCategoryTilesSectionProps {
  /**
   * Current search query. When non-empty (after trim), each tile URL appends
   * `?keyword=<query>` so the destination page is pre-filtered.
   */
  query: string;
  /** Fires the dedicated category-tile click event. */
  onClickItem: (tile: StoreCategoryTileClick, interaction: TStoreNavClickedInteraction) => void;
}

const useStoreCategoryTilesStyles = makeStyles()((theme) => ({
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    padding: '8px 16px',
  },
  tileGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    padding: '8px 16px',
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    color: theme.palette.content.standard,
    textDecoration: 'none',
    textAlign: 'center',
    borderRadius: 6,
    '&:hover': {
      textDecoration: 'none',
    },
    // Focus ring is intentionally left to the global design-system :focus-visible
    // outline so it matches the search result rows (don't override the color).
    // When the link is hovered or focused, highlight the inner icon box.
    '&:hover .storeTileIconBox, &:focus-visible .storeTileIconBox': {
      backgroundColor: theme.palette.states.hover,
    },
  },
  tileIconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '64px',
    borderRadius: '8px',
    backgroundColor: theme.palette.surface[400],
    // Match the muted icon color used by SearchListItem (the row icons on
    // the left of each result).
    color: theme.palette.content.muted,
    transition: 'background-color 120ms ease-in-out',
  },
  tileLabel: {
    lineHeight: '1.2',
    color: theme.palette.content.standard,
  },
}));

type TileClasses = ReturnType<typeof useStoreCategoryTilesStyles>['classes'];

interface StoreCategoryTileLinkProps {
  id: string;
  href: string;
  label: string;
  ariaLabel: string;
  index: number;
  Icon: FunctionComponent;
  classes: TileClasses;
  onClickItem: (tile: StoreCategoryTileClick, interaction: TStoreNavClickedInteraction) => void;
}

/**
 * A single category tile. Each needs its own ref so it can participate in the
 * search dialog's arrow-key navigation (same `data-search-navigation-element`
 * wiring as the result rows), hence a per-tile component rather than inlining.
 * Opens in the same tab; tracks the click before navigating.
 */
const StoreCategoryTileLink: FunctionComponent<StoreCategoryTileLinkProps> = ({
  id,
  href,
  label,
  ariaLabel,
  index,
  Icon,
  classes,
  onClickItem,
}) => {
  const tileRef = useRef<HTMLAnchorElement>(null);
  const { onKeyDownSearch } = useSearchNavigation(tileRef);
  // Track the click; the anchor handles same-tab navigation (and Enter, and
  // modifier/middle-click → new tab) natively, like the result rows.
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const interaction = isRealMouseClickEvent(e)
      ? getModifierKeyInteraction(e, false)
      : ESearchInteraction.KeyboardEnter;
    onClickItem({ id, label, href, index }, interaction);
  };
  return (
    <a
      ref={tileRef}
      href={href}
      tabIndex={0}
      data-search-navigation-element={ESearchNavigationElement.ListItem}
      onClick={onClick}
      onKeyDown={onKeyDownSearch}
      aria-label={ariaLabel}
      className={classes.tile}>
      <span className={`${classes.tileIconBox} storeTileIconBox`} aria-hidden='true'>
        <Icon />
      </span>
      <Typography variant='caption' component='span' className={classes.tileLabel}>
        {label}
      </Typography>
    </a>
  );
};

export const StoreCategoryTilesSection: FunctionComponent<StoreCategoryTilesSectionProps> = ({
  query,
  onClickItem,
}) => {
  const { robloxSiteDomain } = useSearchConfig();
  const { translate } = useTranslation();
  const { classes } = useStoreCategoryTilesStyles();

  const creatorHubBaseUrl = getCreatorHubBaseUrl(robloxSiteDomain);

  return (
    <div className={classes.section}>
      <Typography
        variant='tableHead'
        component='h2'
        color='secondary'
        className={classes.sectionTitle}>
        {translate('Label.FilterByCategory') || 'Filter by category'}
      </Typography>
      <div className={classes.tileGrid}>
        {STORE_CATEGORY_TILES.map((tile: StoreCategoryTile, index: number) => {
          const label = translate(tile.translationKey) || tile.fallbackLabel;
          const href = buildStoreCategoryUrl(creatorHubBaseUrl, tile.storePath, query);
          const ariaLabel =
            translate('Label.StoreCategoryTileAriaLabel', { category: label }) ||
            `${label} in the Creator Store`;
          return (
            <StoreCategoryTileLink
              key={tile.id}
              id={tile.id}
              href={href}
              label={label}
              ariaLabel={ariaLabel}
              index={index}
              Icon={tile.Icon}
              classes={classes}
              onClickItem={onClickItem}
            />
          );
        })}
      </div>
    </div>
  );
};

export default StoreCategoryTilesSection;
