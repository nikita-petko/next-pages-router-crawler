import { CreatorDetails, CreatorGroupDetails } from './types';

export default function findFirstCreator(
  creatorData?: CreatorGroupDetails[],
): CreatorDetails | null {
  if (!creatorData || !creatorData.length) {
    return null;
  }

  for (let i = 0; i < creatorData.length; i += 1) {
    const group = creatorData[i];
    if (group.creatorsList && group.creatorsList.length) {
      return group.creatorsList[0];
    }
  }
  return null;
}
