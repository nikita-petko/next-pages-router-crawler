import type { CSSProperties } from 'react';
import type { GroupRoleMetadata, GroupRoleColorType } from '../clients/groups';
import {
  DefaultMemberRoleIdNumber,
  DefaultRoleColor,
  PickableRoleColorsList,
  RoleColorTokenMap,
} from './constants';

export const getRoleStyle = (
  color?: GroupRoleColorType,
  themeMode?: string,
  property: 'fill' | 'background' | 'color' = 'fill',
): CSSProperties => {
  const resolvedColor = typeof color === 'number' ? color : DefaultRoleColor;
  const tokens = RoleColorTokenMap[resolvedColor];
  const token = themeMode === 'dark' ? tokens.dark : tokens.light;
  return { [property]: `var(--${token})` };
};

const sortRolesByName = (a: GroupRoleMetadata, b: GroupRoleMetadata) => {
  if (a.name === null || a.name === undefined) {
    return 1;
  }
  if (b.name === null || b.name === undefined) {
    return -1;
  }

  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
};

export const sortRolesById = (a: GroupRoleMetadata, b: GroupRoleMetadata) => {
  if (a.id === DefaultMemberRoleIdNumber) {
    return -1;
  }

  if (b.id === DefaultMemberRoleIdNumber) {
    return 1;
  }

  if (a.id === null || a.id === undefined || b.id === null || b.id === undefined) {
    return sortRolesByName(a, b);
  }

  const sorted = a.id - b.id;

  return sorted === 0 ? sortRolesByName(a, b) : sorted;
};

export const getRandomRoleColorType = () => {
  const randomIndex = Math.floor(Math.random() * PickableRoleColorsList.length);
  return PickableRoleColorsList[randomIndex];
};
