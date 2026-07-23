import { Asset } from '@modules/miscellaneous/common';
import type { AvatarItemDropdown } from '../constants/avatarItemConstants';

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
  Object.entries(menuMap).forEach(([key, dropdownItems]) => {
    dropdownItems.forEach((label: AvatarItemDropdown, index: number) => {
      invertedMap.set(serializeMenuMapKey(key, label.nameKey), index);
    });
  });
  return invertedMap;
};
