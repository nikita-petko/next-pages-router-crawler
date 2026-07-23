import developClient from '@modules/clients/develop';
import { Audience } from '@modules/creations/common/audiences';
import { Asset, Item } from '@modules/miscellaneous/common';
import type { ExperienceData } from './loadExperiences';

export default async function loadExperienceDetails(
  universeId: number,
  enableAudiencesReplacement = false,
): Promise<ExperienceData | null> {
  const universeData = await developClient.getUniverseDetails(universeId);

  if (!universeData) {
    return null;
  }

  const isActive = enableAudiencesReplacement
    ? (universeData.audiences?.includes(Audience.Public) ?? false)
    : universeData.privacyType?.toLowerCase() === 'public';

  const experienceData: ExperienceData = {
    itemType: Item.Game,
    assetType: Asset.Place,
    universeId,
    assetId: universeData.rootPlaceId ?? undefined,
    name: universeData.name ?? '',
    isArchived: universeData.isArchived ?? false,
    isClickable: true,
    isActive,
    creatorName: universeData.creatorName,
  };

  return experienceData;
}
