import type { FunctionComponent, Dispatch, SetStateAction } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import type { NavigationTab } from '../constants/navigationConstants';

export type TopNavigationDropdownTabType = {
  anchorRef: HTMLElement | null;
  buttonId: string;
  isLastMovementKeyboard: boolean;
  isMenuOpen: boolean;
  menuId: string;
  tab: NavigationTab | null;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
  onMouseEnterMenu: (event: React.MouseEvent<Element, MouseEvent>) => void;
  onMouseLeaveMenu: (event: React.MouseEvent<Element, MouseEvent>) => void;
  onKeyDownMenu: (event: React.KeyboardEvent<Element>) => void;
  children?: React.ReactNode;
};

const TopNavigationDropdownTabContext = createContext<TopNavigationDropdownTabType>({
  anchorRef: null,
  buttonId: '',
  isLastMovementKeyboard: false,
  isMenuOpen: false,
  menuId: '',
  tab: null,
  setIsMenuOpen: () => {
    throw new Error('Not implemented');
  },
  onMouseEnterMenu: () => {
    throw new Error('Not implemented');
  },
  onMouseLeaveMenu: () => {
    throw new Error('Not implemented');
  },
  onKeyDownMenu: () => {
    throw new Error('Not implemented');
  },
});
TopNavigationDropdownTabContext.displayName = 'TopNavigationDropdownTab';

export function useTopNavigationDropdownTab() {
  return useContext(TopNavigationDropdownTabContext);
}

const TopNavigationDropdownTabProvider: FunctionComponent<TopNavigationDropdownTabType> = ({
  anchorRef,
  buttonId,
  children,
  isLastMovementKeyboard,
  isMenuOpen,
  menuId,
  tab,
  setIsMenuOpen,
  onMouseEnterMenu,
  onMouseLeaveMenu,
  onKeyDownMenu,
}) => {
  const value = useMemo(
    () => ({
      anchorRef,
      buttonId,
      isLastMovementKeyboard,
      isMenuOpen,
      menuId,
      tab,
      setIsMenuOpen,
      onMouseEnterMenu,
      onMouseLeaveMenu,
      onKeyDownMenu,
    }),
    [
      anchorRef,
      buttonId,
      isLastMovementKeyboard,
      isMenuOpen,
      menuId,
      tab,
      setIsMenuOpen,
      onMouseEnterMenu,
      onMouseLeaveMenu,
      onKeyDownMenu,
    ],
  );

  return (
    <TopNavigationDropdownTabContext.Provider value={value}>
      {children}
    </TopNavigationDropdownTabContext.Provider>
  );
};

export default TopNavigationDropdownTabProvider;
