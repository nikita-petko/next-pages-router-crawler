import { CreatorType } from '@modules/miscellaneous/common';

export const normalizeCreatorType = (
  creatorType: string | number | undefined,
): CreatorType | undefined => {
  const normalizedCreatorType =
    typeof creatorType === 'string' ? creatorType.toLowerCase() : creatorType;
  if (normalizedCreatorType === 'user' || normalizedCreatorType === 1) {
    return CreatorType.User;
  }
  if (normalizedCreatorType === 'group' || normalizedCreatorType === 2) {
    return CreatorType.Group;
  }
  return undefined;
};

export const getCreatorDisplayName = (
  creatorType: CreatorType | undefined,
  creatorName: string,
): string => {
  if (creatorName.length === 0) {
    return '';
  }

  return creatorType === CreatorType.User ? `@${creatorName}` : creatorName;
};
