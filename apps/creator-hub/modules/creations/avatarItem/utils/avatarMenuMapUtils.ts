import { Asset, Item } from '@modules/miscellaneous/common';
import { AvatarItemDropdown } from '../constants/avatarItemConstants';

export const isOnItemTab = (tab: Asset): boolean => {
  return tab === Asset.TShirt;
};

export const isValidIndex = (
  index: number | undefined,
  array: AvatarItemDropdown[] | undefined,
): boolean => {
  return array !== undefined && index !== undefined && index > 0 && index < array.length;
};

export const serializeMenuMapKey = (tab: string, filter: string): string => {
  return `${tab}_${filter}`;
};

export const invertAvatarMenuMap = (
  menuMap: Partial<Record<Asset, AvatarItemDropdown[]>>,
): Map<string, number> => {
  const invertedMap: Map<string, number> = new Map<string, number>();
  const menuMapKeys = Object.keys(menuMap);
  menuMapKeys.forEach((key: string) => {
    (menuMap as any)[key].forEach((label: AvatarItemDropdown, index: number) => {
      invertedMap.set(serializeMenuMapKey(key.toString(), label.nameKey), index);
    });
  });
  return invertedMap;
};
