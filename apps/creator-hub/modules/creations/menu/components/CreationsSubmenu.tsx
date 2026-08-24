import type { FunctionComponent } from 'react';
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Chip, IconButton, NavigateBeforeIcon, NavigateNextIcon, makeStyles } from '@rbx/ui';
import type { TGroup } from '@modules/authentication/types';
import { Flex } from '@modules/miscellaneous/components';
import TaxonomyL1Chips from '../../avatarItem/components/TaxonomyL1Chips';
import useTaxonomyView from '../../avatarItem/hooks/useTaxonomyView';
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
  // Guarded here rather than in the callers so both menu layouts stay in sync.
  const { isTaxonomyMode } = useTaxonomyView(creationsMenuManager.getAssetType(menuState));

  const onSubmenuChange = (value: MenuItem) => {
    onMenuStateChange({ menuItem: menuState.menuItem, submenuItem: value });
  };

  const filteredSubmenuItems = useEnabledSubmenuItems(menuState, group);

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
        {filteredSubmenuItems?.map((submenuItem) => {
          const isSelectedSubmenuItem = menuState.submenuItem === submenuItem;
          return (
            <Chip
              key={submenuItem.type}
              classes={{ root: chip }}
              color={isSelectedSubmenuItem ? 'primary' : 'secondary'}
              onClick={isSelectedSubmenuItem ? undefined : () => onSubmenuChange(submenuItem)}
              label={translate(submenuItem.nameKey)}
              clickable
              tabIndex={0}
              aria-selected={isSelectedSubmenuItem}
              role='tab'
            />
          );
        })}
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
