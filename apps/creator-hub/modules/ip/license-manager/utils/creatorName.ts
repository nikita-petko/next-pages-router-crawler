import { CreatorType } from '@modules/miscellaneous/common';

export const normalizeCreatorType = (creatorType: string | undefined): CreatorType | undefined => {
  const normalizedCreatorType = creatorType?.toLowerCase();
  if (normalizedCreatorType === 'user') {
    return CreatorType.User;
  }
  if (normalizedCreatorType === 'group') {
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
