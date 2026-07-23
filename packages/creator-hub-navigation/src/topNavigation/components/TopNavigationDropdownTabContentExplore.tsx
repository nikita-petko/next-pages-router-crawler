import React, { FunctionComponent, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import TopNavigationDropdownTabMenu, {
  TNavigationDropdownItem,
} from './TopNavigationDropdownTabMenu';
import { NavigationTab } from '../constants/navigationConstants';
import TopNavigationDropdownDrawerMenu from './TopNavigationDropdownDrawerMenu';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';

export type TNavigationDropdownData = {
  items: TNavigationDropdownItem[][];
};

const menuData = [
  [
    {
      translationKey: 'Heading.Licenses',
      path: '/explore/licenses',
    },
    {
      translationKey: 'Heading.Talent',
      path: '/talent',
    },
    {
      translationKey: 'Heading.Roadmap',
      path: '/roadmap',
    },
  ],
];

export const validateDropdownData = (data: TNavigationDropdownData) => {
  const { items } = data as TNavigationDropdownData;
  return !items.flat().some((item) => item.path === undefined || item.path === null || !item.title);
};

interface TopNavigationDropdownTabContentExploreProps {
  tab: NavigationTab;
}

const TopNavigationDropdownTabContentExplore: FunctionComponent<
  TopNavigationDropdownTabContentExploreProps
> = ({ tab }) => {
  const { translate } = useTranslation();
  const { isCompact } = useNavigationConfigs();

  const translatedItems = useMemo(() => {
    return menuData.map((subMenu) =>
      subMenu.map((item) => ({
        path: item.path,
        title: translate(item.translationKey),
      })),
    );
  }, [translate]);

  if (isCompact) {
    return <TopNavigationDropdownDrawerMenu translatedItems={translatedItems} tab={tab} />;
  }

  return <TopNavigationDropdownTabMenu items={translatedItems} />;
};

export default TopNavigationDropdownTabContentExplore;
