import { developClient } from '@modules/clients';
import { Asset, Item } from '@modules/miscellaneous/common';
import { ExperienceData } from './loadExperiences';

export default async function loadExperienceDetails(
  universeId: number,
): Promise<ExperienceData | null> {
  const universeData = await developClient.getUniverseDetails(universeId);

  if (!universeData) {
    return null;
  }

  const experienceData: ExperienceData = {
    itemType: Item.Game,
    assetType: Asset.Place,
    universeId: universeData.id!,
    assetId: universeData.rootPlaceId ?? undefined,
    name: universeData.name ?? '',
    isArchived: universeData.isArchived ?? false,
    isClickable: true,
    isActive: universeData.privacyType?.toLowerCase() === 'public',
    creatorName: universeData.creatorName,
  };

  return experienceData;
}
