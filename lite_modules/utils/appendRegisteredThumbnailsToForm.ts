import type { QueryClient } from '@tanstack/react-query';
import type { UseFormGetValues, UseFormSetValue, UseFormTrigger } from 'react-hook-form';

import { AssetSource, FormField, MAX_ALLOWED_CREATIVES } from '@constants/campaignBuilder';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useThumbnailStore } from '@stores/thumbnailStoreProvider';
import { countSelectedCreatives } from '@utils/campaignBuilder';

interface AppendRegisteredThumbnailsParams {
  adAccountId?: string;
  creativeOrigin: 'ai' | 'upload';
  getValues: UseFormGetValues<FormType>;
  maxAllowedCreatives?: number;
  queryClient: QueryClient;
  registered: Array<{ assetId: number; file: File }>;
  setValue: UseFormSetValue<FormType>;
  trigger: UseFormTrigger<FormType>;
}

/** Appends freshly-registered library assets to the campaign thumbnail form field. */
export const appendRegisteredThumbnailsToForm = ({
  adAccountId,
  creativeOrigin,
  getValues,
  maxAllowedCreatives = MAX_ALLOWED_CREATIVES,
  queryClient,
  registered,
  setValue,
  trigger,
}: AppendRegisteredThumbnailsParams): void => {
  if (registered.length === 0) {
    return;
  }

  const { setBlobByAssetId } = useThumbnailStore.getState();
  registered.forEach(({ assetId, file }) => {
    setBlobByAssetId(assetId, file);
  });

  const currentCreatives = getValues(FormField.THUMBNAILS);
  const existingIds = new Set(currentCreatives.map((creative) => creative.assetId));
  let selectedSlotsRemaining = maxAllowedCreatives - countSelectedCreatives(currentCreatives);
  const additions = registered
    .filter(({ assetId }) => !existingIds.has(assetId))
    .map(({ assetId }) => {
      const isSelected = selectedSlotsRemaining > 0;
      if (isSelected) {
        selectedSlotsRemaining -= 1;
      }
      return {
        assetId,
        creativeOrigin,
        existing: false,
        isSelected,
        source: AssetSource.ADS_MANAGER,
      };
    });
  if (additions.length === 0) {
    return;
  }
  setValue(FormField.THUMBNAILS, [...currentCreatives, ...additions], {
    shouldDirty: true,
    shouldTouch: true,
    shouldValidate: true,
  });
  trigger(FormField.THUMBNAILS);
  if (adAccountId != null) {
    queryClient.invalidateQueries({ queryKey: ['adCreatives', adAccountId] });
  }
};
