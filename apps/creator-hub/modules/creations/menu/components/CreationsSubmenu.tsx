import type { FunctionComponent } from 'react';
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Chip, IconButton, NavigateBeforeIcon, NavigateNextIcon, makeStyles } from '@rbx/ui';
import type { TGroup } from '@modules/authentication/types';
import { Asset } from '@modules/miscellaneous/common';
import { Flex } from '@modules/miscellaneous/components';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import TaxonomyL1Chips from '../../avatarItem/components/TaxonomyL1Chips';
import useTaxonomyView from '../../avatarItem/hooks/useTaxonomyView';
import {
  buildTaxonomyActiveTab,
  RECENTS_L1_KEY,
} from '../../avatarItem/utils/taxonomyRoutingUtils';
import useAvatarLooksGate from '../../home/hooks/useAvatarLooksGate';
import useMomentsGate from '../../home/hooks/useMomentsGate';
import useUGCFoldersGate from '../../home/hooks/useUGCFoldersGate';
import { getAvatarItemsEntryPointAssetTypes } from '../constants/MenuConstants';
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
  } = useStyles();
  const subMenuRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  const isMomentsTabEnabled = useMomentsGate();
  const isUGCFoldersEnabled = useUGCFoldersGate();
  const isAvatarLooksEnabled = useAvatarLooksGate();
  const { translate } = useTranslation();
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [scrollWidth, setScrollWidth] = useState<number>(0);
  const [offsetWidth, setOffsetWidth] = useState<number>(0);

  const [allowedAssetTypes, setAllowedAssetTypes] = useState<Set<Asset> | undefined>(undefined);

  // The taxonomy chip row replaces this item-type submenu, so only one of them is ever shown.
  // Guarded here rather than in the callers so both menu layouts stay in sync. `canUseTaxonomy` is
  // true whenever the feature is on for an Avatar Items tab, in either view, which is what makes the
  // Recents chip independent of the Taxonomy/Item-Type toggle.
  const { isTaxonomyMode, canUseTaxonomy } = useTaxonomyView(
    creationsMenuManager.getAssetType(menuState),
  );
  const [, setRecentsTabParams] = useQueryParams(['activeTab', 'filterIndex']);
  const recentsLabel = translate('Label.Recents');

  // Recents is a top-level tab rather than part of either view, so it is offered here as well as in
  // the taxonomy chip row — the feature flag decides whether it exists, not the Taxonomy/Item-Type
  // toggle. Selecting it always leaves this row, which is why it is never the selected chip.
  const recentsChip = (
    <Chip
      key='recents'
      classes={{ root: chip }}
      color='secondary'
      onClick={() =>
        setRecentsTabParams({
          activeTab: buildTaxonomyActiveTab(RECENTS_L1_KEY),
          filterIndex: 0,
        })
      }
      label={recentsLabel}
      clickable
      tabIndex={0}
      aria-selected={false}
      role='tab'
    />
  );

  /** Used to fetch allowed asset types for the creator. This allows us to block
   * TIC/non-TIC users depending on a BE setting. This can be used for future new UGC menu
   * items as well.
   */
  useEffect(() => {
    void getAvatarItemsEntryPointAssetTypes().then((assetTypes: Set<Asset>) => {
      setAllowedAssetTypes(assetTypes);
    });
  }, []);

  const onSubmenuChange = (value: MenuItem) => {
    onMenuStateChange({ menuItem: menuState.menuItem, submenuItem: value });
  };

  const filteredSubmenuItems = useMemo(() => {
    // Only set isMarketplaceAssetType if on the Avatar Items menu
    return menuState.menuItem.submenuItems?.filter((submenuItem) =>
      creationsMenuManager.isMenuItemEnabled(
        submenuItem,
        settings,
        group,
        menuState.menuItem.nameKey === 'Label.AvatarItems'
          ? allowedAssetTypes?.has(submenuItem.type)
          : undefined,
        allowedAssetTypes,
        isMomentsTabEnabled,
        isUGCFoldersEnabled,
        isAvatarLooksEnabled,
      ),
    );
  }, [
    menuState.menuItem.submenuItems,
    settings,
    group,
    menuState.menuItem.nameKey,
    allowedAssetTypes,
    isMomentsTabEnabled,
    isUGCFoldersEnabled,
    isAvatarLooksEnabled,
  ]);

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
      <Flex ref={subMenuRef} classes={{ root: subMenu }}>
        {filteredSubmenuItems?.flatMap((submenuItem) => {
          const submenuChip = (
            <Chip
              key={submenuItem.type}
              classes={{ root: chip }}
              color={menuState.submenuItem === submenuItem ? 'primary' : 'secondary'}
              onClick={
                menuState.submenuItem === submenuItem
                  ? undefined
                  : () => onSubmenuChange(submenuItem)
              }
              label={translate(submenuItem.nameKey)}
              clickable
              tabIndex={0}
              aria-selected={menuState.submenuItem === submenuItem}
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
      </Flex>
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
