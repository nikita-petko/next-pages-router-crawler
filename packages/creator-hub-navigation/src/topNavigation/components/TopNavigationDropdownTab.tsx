import type { FunctionComponent } from 'react';
import React, { useCallback, useState, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, makeStyles, Button, ArrowDropDownRoundedIcon } from '@rbx/ui';
import { clickDropdownTabEventModel, clickTabEventModel } from '../../event/eventConstants';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import { getDocsLocaleFromPath } from '../../utils/getLocalizedDropdownLink';
import type { NavigationTab } from '../constants/navigationConstants';
import TopNavigationDropdownTabProvider from './TopNavigationDropdownTabProvider';

interface TTopNavigationDropdownTabProps {
  tab: NavigationTab;
  focused: boolean;
}

const useTopNavigationStyles = makeStyles()((theme) => ({
  button: {
    paddingTop: '18px',
    paddingBottom: '18px',
    paddingLeft: '10px',
    paddingRight: '4px',
    '&:focus-visible': {
      outline: `${theme.palette.content.standard} auto`,
      outlineOffset: '-8px',
    },
  },

  title: {
    textTransform: 'none',
  },

  selected: {
    color: theme.palette.content.standard,
  },

  unselected: {
    color: theme.palette.content.muted,
  },
}));

const TopNavigationDropdownTab: FunctionComponent<TTopNavigationDropdownTabProps> = ({
  tab,
  focused,
}) => {
  const { sendEvent } = useNavigationConfigs();
  const { translate } = useTranslation();
  const translatedTitle = translate(tab.title);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMouseOverButton, setIsMouseOverButton] = useState(false);
  const [isMouseOverMenu, setIsMouseOverMenu] = useState(false);
  const [isLastMovementKeyboard, setIsLastMovementKeyboard] = useState(false);
  const buttonId = `top-navigation-dropdown-tab-button-${tab.key}`;
  const menuId = `top-navigation-dropdown-tab-menu-${tab.key}`;

  const {
    classes: { selected, unselected, button, title },
    cx,
  } = useTopNavigationStyles();
  const anchorRef = useRef<HTMLButtonElement>(null);

  const onClickTab = useCallback(() => {
    setIsMenuOpen(false);
    sendEvent(clickTabEventModel(tab.key));
    setTimeout(() => {
      const localePath = getDocsLocaleFromPath(window.location.pathname);
      const href = tab.tabPath ? `${tab.href}${tab.tabPath}` : tab.href;
      const url = localePath ? `${href}/${localePath}` : href;
      window.open(url, '_self');
    }, 100);
  }, [sendEvent, tab.href, tab.key, tab.tabPath]);

  const openMenu = useCallback(() => {
    sendEvent(clickDropdownTabEventModel(tab.key));
    setIsMenuOpen(true);
  }, [sendEvent, tab.key]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const onMouseEnterButton = useCallback(() => {
    setIsLastMovementKeyboard(false);
    setIsMouseOverButton(true);
    openMenu();
  }, [openMenu]);

  const onMouseLeaveButton = useCallback(() => {
    setIsMouseOverButton(false);
    if (!isMouseOverMenu) {
      closeMenu();
    }
  }, [isMouseOverMenu, closeMenu]);

  const onMouseEnterMenu = useCallback(() => {
    setIsLastMovementKeyboard(false);
    setIsMouseOverMenu(true);
    openMenu();
  }, [openMenu]);

  const onMouseLeaveMenu = useCallback(() => {
    setIsMouseOverMenu(false);
    if (!isMouseOverButton) {
      closeMenu();
    }
  }, [isMouseOverButton, closeMenu]);

  const onClickButton = useCallback(() => {
    if (isLastMovementKeyboard) {
      openMenu();
    } else {
      onClickTab();
    }
  }, [isLastMovementKeyboard, onClickTab, openMenu]);

  const isKeyEscapeOrTab = (event: React.KeyboardEvent) => {
    return event.key === 'Escape' || event.key === 'Tab';
  };

  const onKeyDownButton = useCallback(
    (event: React.KeyboardEvent) => {
      setIsLastMovementKeyboard(true);
      if (isKeyEscapeOrTab(event)) {
        closeMenu();
      }
    },
    [closeMenu],
  );

  const onKeyDownMenu = useCallback(
    (event: React.KeyboardEvent) => {
      setIsLastMovementKeyboard(true);
      if (isKeyEscapeOrTab(event)) {
        closeMenu();
      }
    },
    [closeMenu],
  );

  return (
    <>
      {translatedTitle && (
        <Button
          onClick={onClickButton}
          onMouseEnter={onMouseEnterButton}
          onMouseLeave={onMouseLeaveButton}
          onKeyDown={onKeyDownButton}
          ref={anchorRef}
          className={button}
          disableFocusRipple
          id={buttonId}
          aria-expanded={isMenuOpen}
          aria-haspopup='true'
          aria-controls={isMenuOpen ? menuId : undefined}>
          <Typography className={cx(title, focused ? selected : unselected)} variant='largeLabel1'>
            {translatedTitle}
          </Typography>
          <ArrowDropDownRoundedIcon className={focused ? selected : unselected} />
        </Button>
      )}
      {tab.dropdownContentComponent && (
        <TopNavigationDropdownTabProvider
          anchorRef={anchorRef.current}
          buttonId={buttonId}
          isLastMovementKeyboard={isLastMovementKeyboard}
          isMenuOpen={isMenuOpen}
          menuId={menuId}
          tab={tab}
          setIsMenuOpen={setIsMenuOpen}
          onMouseEnterMenu={onMouseEnterMenu}
          onMouseLeaveMenu={onMouseLeaveMenu}
          onKeyDownMenu={onKeyDownMenu}>
          {React.createElement(tab.dropdownContentComponent)}
        </TopNavigationDropdownTabProvider>
      )}
    </>
  );
};

export default TopNavigationDropdownTab;
