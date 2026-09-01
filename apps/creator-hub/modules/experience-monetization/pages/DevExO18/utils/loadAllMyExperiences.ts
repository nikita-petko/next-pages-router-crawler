import type { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { SortOrder } from '@rbx/core';
import { defaultAssetsSort } from '@modules/creations/common/contexts/CreationsFiltersContext';
import type CreationData from '@modules/creations/common/interfaces/CreationData';
import type { CreationsGridPagingParameters } from '@modules/creations/home/types/CreationsGridPagingParameters';
import loadCreationsForAssetType from '@modules/creations/home/utils/loadCreationsUtils';
import { Asset } from '@modules/miscellaneous/common';
import type { TSettings } from '@modules/settings/SettingsProvider/settingsHelpers';

const EXPERIENCES_PAGE_SIZE = 50;

async function loadAllMyExperiences(
  creatorType: SearchCreatorType,
  creatorTargetId: number,
  settings: TSettings | undefined,
  enableAudiencesReplacement: boolean,
): Promise<CreationData[]> {
  const accumulated: CreationData[] = [];
  let cursor: string | undefined;
  // Anchor pagination to a single timestamp so pages stay consistent as we fetch.
  const fromUtc = new Date();

  do {
    const pagingParameters: CreationsGridPagingParameters = {
      assetType: Asset.MyExperiences,
      creatorType,
      creatorTargetId,
      isArchived: false,
      sort: defaultAssetsSort,
      sortOrder: SortOrder.Desc,
      isClickable: false,
      fromUtc,
      settings,
      isOwnerViewEnabled: true,
      enableAccessAnnotationUpdate: true,
      enableAudiencesReplacement,
      count: EXPERIENCES_PAGE_SIZE,
      cursor,
    };

    const page = await loadCreationsForAssetType(pagingParameters);
    accumulated.push(...page.items);
    cursor = page.nextPageCursor;
  } while (cursor);

  return accumulated.filter((item) => item.universeId != null && item.name != null);
}

export default loadAllMyExperiences;
