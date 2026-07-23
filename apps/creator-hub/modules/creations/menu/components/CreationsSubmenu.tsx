import type { FunctionComponent } from 'react';
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { Chip, IconButton, NavigateBeforeIcon, NavigateNextIcon, makeStyles } from '@rbx/ui';
import { enableAvatarLooks } from '@generated/flags/avatarMarketplace';
import type { TGroup } from '@modules/authentication/types';
import type { Asset } from '@modules/miscellaneous/common';
import { Flex } from '@modules/miscellaneous/components';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useMomentsGate from '../../home/hooks/useMomentsGate';
import useUGCFoldersGate from '../../home/hooks/useUGCFoldersGate';
import {
  getAllowedMarketplaceItemTypes,
  type AllowedMarketplaceItemTypes,
} from '../constants/MenuConstants';
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
  const { value: isAvatarLooksEnabled } = useFlag(enableAvatarLooks);
  const { translate } = useTranslation();
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [scrollWidth, setScrollWidth] = useState<number>(0);
  const [offsetWidth, setOffsetWidth] = useState<number>(0);

  const [allowedAssetTypes, setAllowedAssetTypes] = useState<Set<Asset> | undefined>(undefined);

  /** Used to fetch allowed asset types for the creator. This allows us to block
   * TIC/non-TIC users depending on a BE setting. This can be used for future new UGC menu
   * items as well.
   */
  useEffect(() => {
    void getAllowedMarketplaceItemTypes().then(({ assetTypes }: AllowedMarketplaceItemTypes) => {
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
        {filteredSubmenuItems?.map((submenuItem) => (
          <Chip
            key={submenuItem.type}
            classes={{ root: chip }}
            color={menuState.submenuItem === submenuItem ? 'primary' : 'secondary'}
            onClick={
              menuState.submenuItem === submenuItem ? undefined : () => onSubmenuChange(submenuItem)
            }
            label={translate(submenuItem.nameKey)}
            clickable
            tabIndex={0}
            aria-selected={menuState.submenuItem === submenuItem}
            role='tab'
          />
        ))}
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
