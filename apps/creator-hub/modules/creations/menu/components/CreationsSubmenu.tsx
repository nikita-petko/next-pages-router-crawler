import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Chip, IconButton, NavigateBeforeIcon, NavigateNextIcon, makeStyles } from '@rbx/ui';
import type { TGroup } from '@modules/authentication/types';
import { Asset } from '@modules/miscellaneous/common';
import { Flex } from '@modules/miscellaneous/components';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import TaxonomyL1Chips from '../../avatarItem/components/TaxonomyL1Chips';
import useTaxonomyView from '../../avatarItem/hooks/useTaxonomyView';
import {
  buildRecentsActiveTab,
  isRecentsActiveTab,
} from '../../avatarItem/utils/taxonomyRoutingUtils';
import useEnabledSubmenuItems from '../hooks/useEnabledSubmenuItems';
import creationsMenuManager from '../implementations/CreationsMenuManager';
import type MenuItem from '../interfaces/MenuItem';
import type MenuState from '../interfaces/MenuState';

const useStyles = makeStyles()((theme) => ({
  subMenuContainer: {
    maxWidth: '100%',
    position: 'relative',
    [theme.breakpoints.down('Large')]: {
      paddingTop: 24,
    },
  },
  subMenu: {
    overflowX: 'scroll',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar ': {
      display: 'none',
    },
  },
  backButton: {
    zIndex: theme.zIndex.mobileStepper,
    backgroundColor: theme.palette.surface[0],
    position: 'absolute',
    left: 0,
    paddingRight: 8,
  },
  nextButton: {
    zIndex: theme.zIndex.mobileStepper,
    backgroundColor: theme.palette.surface[0],
    position: 'absolute',
    right: 0,
    paddingLeft: 8,
  },
  chip: {
    marginRight: 8,
  },
}));

export type TCreationsSubmenuProps = {
  menuState: MenuState;
  onMenuStateChange: (newState: MenuState) => void;
  group: TGroup | null;
};

const CreationsSubmenu: FunctionComponent<React.PropsWithChildren<TCreationsSubmenuProps>> = ({
  menuState,
  onMenuStateChange,
  group,
}) => {
  const {
    classes: { subMenuContainer, subMenu, backButton, nextButton, chip },
    cx,
  } = useStyles();
  const subMenuRef = useRef<HTMLDivElement>(null);
  const { translate } = useTranslation();
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [scrollWidth, setScrollWidth] = useState<number>(0);
  const [offsetWidth, setOffsetWidth] = useState<number>(0);

  // The taxonomy chip row replaces this item-type submenu, so only one of them is ever shown.
  // Guarded here rather than in the callers so both menu layouts stay in sync. `canUseTaxonomy` is
  // true whenever the feature is on for an Avatar Items tab, in either view, which is what makes the
  // Recents chip independent of the Taxonomy/Item-Type toggle.
  const { isTaxonomyMode, canUseTaxonomy } = useTaxonomyView(
    creationsMenuManager.getAssetType(menuState),
  );
  const [{ activeTab }, setRecentsTabParams] = useQueryParams(['activeTab', 'filterIndex']);
  const recentsLabel = translate('Label.Recents');

  // Recents is a top-level tab rather than part of either view, so it is offered here as well as in
  // the taxonomy chip row — the feature flag decides whether it exists, not the Taxonomy/Item-Type
  // toggle.
  const isOnRecents = isRecentsActiveTab(activeTab);
  const handleSelectRecents = useCallback(() => {
    setRecentsTabParams({
      activeTab: buildRecentsActiveTab(isTaxonomyMode),
      filterIndex: 0,
    });
  }, [isTaxonomyMode, setRecentsTabParams]);
  const recentsChip = (
    <Chip
      key='recents'
      classes={{ root: chip }}
      color={isOnRecents ? 'primary' : 'secondary'}
      onClick={isOnRecents ? undefined : handleSelectRecents}
      label={recentsLabel}
      clickable
      tabIndex={0}
      aria-selected={isOnRecents}
      role='tab'
    />
  );

  const onSubmenuChange = (value: MenuItem) => {
    onMenuStateChange({ menuItem: menuState.menuItem, submenuItem: value });
  };

  const filteredSubmenuItems = useEnabledSubmenuItems(menuState, group);

  const showRecentsBeforeAllAssetTypes =
    canUseTaxonomy &&
    (filteredSubmenuItems?.some((submenuItem) => submenuItem.type === Asset.AllCatalogAsset) ??
      false);

  const isStartOfMenu = useMemo(() => scrollLeft <= 0, [scrollLeft]);
  const isEndOfMenu = useMemo(
    () => scrollLeft + offsetWidth >= scrollWidth,
    [scrollLeft, scrollWidth, offsetWidth],
  );

  const updateScrollPosition = () => {
    const subMenuElement = subMenuRef?.current;
    setScrollLeft(subMenuElement?.scrollLeft ?? 0);
    setScrollWidth(subMenuElement?.scrollWidth ?? 0);
    setOffsetWidth(subMenuElement?.offsetWidth ?? 0);
  };

  useEffect(() => {
    const subMenuElement = subMenuRef?.current;
    const resizeObserver = new ResizeObserver(updateScrollPosition);
    if (subMenuElement) {
      subMenuElement.addEventListener('scroll', updateScrollPosition);
      resizeObserver.observe(subMenuElement);
    }
    return () => {
      if (subMenuElement) {
        subMenuElement.removeEventListener('scroll', updateScrollPosition);
        resizeObserver.unobserve(subMenuElement);
      }
    };
  }, []);

  // Rendered in the submenu slot so the chips occupy the same row as the toolbar controls, which
  // keeps Show Archived and the settings icon aligned to the right exactly as in the item-type view.
  if (isTaxonomyMode) {
    return <TaxonomyL1Chips />;
  }

  return (
    <Flex classes={{ root: subMenuContainer }}>
      {!isStartOfMenu && (
        <div className={backButton}>
          <IconButton
            onClick={() => {
              subMenuRef.current?.scrollBy({ left: -offsetWidth, behavior: 'smooth' });
            }}
            color='secondary'
            aria-label='back'>
            <NavigateBeforeIcon fontSize='small' />
          </IconButton>
        </div>
      )}
      {/* A phone has no room to scroll the row and no visible scrollbar to hint that it can be, so
          the chips wrap below Medium. Scrolling stays for the case a single chip is still too wide
          to fit; once the row fits, the prev/next buttons hide themselves on their own. Plain div
          rather than Flex because Flex also emits `gap: 0`, which would beat the wrapped row gap. */}
      <div ref={subMenuRef} className={cx(subMenu, 'flex max-medium:wrap max-medium:gap-y-small')}>
        {filteredSubmenuItems?.flatMap((submenuItem) => {
          const isSelectedSubmenuItem = !isOnRecents && menuState.submenuItem === submenuItem;
          const submenuChip = (
            <Chip
              key={submenuItem.type}
              classes={{ root: chip }}
              // Recents carries no asset type, so it resolves through the host tab and would
              // otherwise light up whichever item type hosts it.
              color={isSelectedSubmenuItem ? 'primary' : 'secondary'}
              onClick={isSelectedSubmenuItem ? undefined : () => onSubmenuChange(submenuItem)}
              label={translate(submenuItem.nameKey)}
              clickable
              tabIndex={0}
              aria-selected={isSelectedSubmenuItem}
              role='tab'
            />
          );
          // Recents sits immediately before All Asset Types, matching the taxonomy chip row.
          return showRecentsBeforeAllAssetTypes && submenuItem.type === Asset.AllCatalogAsset
            ? [recentsChip, submenuChip]
            : [submenuChip];
        })}
        {/* No All Asset Types entry to anchor to (a non-Avatar-Items submenu), so append instead. */}
        {canUseTaxonomy && !showRecentsBeforeAllAssetTypes && recentsChip}
      </div>
      {!isEndOfMenu && (
        <div className={nextButton}>
          <IconButton
            onClick={() => {
              subMenuRef.current?.scrollBy({ left: offsetWidth, behavior: 'smooth' });
            }}
            color='secondary'
            aria-label='next'>
            <NavigateNextIcon fontSize='small' />
          </IconButton>
        </div>
      )}
    </Flex>
  );
};

export default CreationsSubmenu;
