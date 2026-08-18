import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import CreativeLibrarySheetBody from '@components/campaignBuilder/common/creative/CreativeLibrarySheetBody';
import { type CreativeUploadPersistedEntry } from '@components/common/creative/CreativeUploadTab';
import {
  AssetSource,
  FormField,
  MAX_ATTRIBUTION_THUMBNAIL_SELECTIONS,
} from '@constants/campaignBuilder';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { ATTRIBUTION_THUMBNAIL_ASPECT_RATIO_VALIDATION } from '@utils/creativeFormat';

interface AttributionThumbnailUploadDrawerContentProps {
  onPersistedUploadEntriesChange?: (entries: CreativeUploadPersistedEntry[]) => void;
  persistedUploadEntries?: CreativeUploadPersistedEntry[];
}

const AttributionThumbnailUploadDrawerContent = ({
  onPersistedUploadEntriesChange,
  persistedUploadEntries = [],
}: AttributionThumbnailUploadDrawerContentProps = {}) => {
  const adAccountId = useAppStore((state) => state.appData.adAccountInfo?.id);
  const queryClient = useQueryClient();
  const setAttributionThumbnailDrawerOpen = useCampaignBuilderStore(
    (state) => state.setAttributionThumbnailDrawerOpen,
  );
  const setCreativeLibraryRegistrationInProgress = useCampaignBuilderStore(
    (state) => state.setCreativeLibraryRegistrationInProgress,
  );
  const attributionThumbnails = useWatch<FormType, typeof FormField.ATTRIBUTION_THUMBNAILS>({
    name: FormField.ATTRIBUTION_THUMBNAILS,
  });

  const { getValues, setValue, trigger } = useFormContext<FormType>();

  const selected = attributionThumbnails.filter(({ isSelected }) => isSelected).length;

  // Called by CreativeUploadTab after library registration; appends new ids and
  // auto-selects the first one if none selected (the attribution bar shows one).
  const handleNewlyRegistered = (registered: Array<{ assetId: number; file: File }>) => {
    if (registered.length === 0) {
      return;
    }
    const current = getValues(FormField.ATTRIBUTION_THUMBNAILS);
    const existingIds = new Set(current.map((item) => item.assetId));
    const newIds = registered.map(({ assetId }) => assetId).filter((id) => !existingIds.has(id));
    if (newIds.length === 0) {
      return;
    }
    let alreadySelected = current.some((item) => item.isSelected);
    const additions = newIds.map((assetId) => {
      const isSelected = !alreadySelected;
      if (isSelected) {
        alreadySelected = true;
      }
      return {
        assetId,
        existing: false,
        isSelected,
        source: AssetSource.ADS_MANAGER,
      };
    });
    setValue(FormField.ATTRIBUTION_THUMBNAILS, [...current, ...additions], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    trigger(FormField.ATTRIBUTION_THUMBNAILS);
    // Bust the shared Creative Library cache so the standalone library page
    // (and any sibling drawer) sees the freshly-registered assets on its next
    // mount instead of serving the pre-upload snapshot.
    if (adAccountId != null) {
      queryClient.invalidateQueries({ queryKey: ['adCreatives', adAccountId] });
    }
  };

  const handleRemoveUploaded = useCallback(
    (assetId: number) => {
      const current = getValues(FormField.ATTRIBUTION_THUMBNAILS);
      const next = current.filter((item) => item.assetId !== assetId);
      if (next.length === current.length) {
        return;
      }
      setValue(FormField.ATTRIBUTION_THUMBNAILS, next, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      trigger(FormField.ATTRIBUTION_THUMBNAILS);
    },
    [getValues, setValue, trigger],
  );

  return (
    <CreativeLibrarySheetBody
      // Square-only gate on the Upload tab, matching the library filter in
      // CreativeImportTab so both tabs accept the same set of assets.
      aspectRatioValidation={ATTRIBUTION_THUMBNAIL_ASPECT_RATIO_VALIDATION}
      formField={FormField.ATTRIBUTION_THUMBNAILS}
      isSelectMediaDisabled={selected >= MAX_ATTRIBUTION_THUMBNAIL_SELECTIONS}
      maxAllowedSelections={MAX_ATTRIBUTION_THUMBNAIL_SELECTIONS}
      maxUploadFiles={MAX_ATTRIBUTION_THUMBNAIL_SELECTIONS}
      onClose={() =>
        setAttributionThumbnailDrawerOpen(false, getValues(FormField.EXPERIENCE).universe_id)
      }
      onPersistedUploadEntriesChange={onPersistedUploadEntriesChange}
      onRegistered={handleNewlyRegistered}
      onRemoveUploadedAsset={handleRemoveUploaded}
      onUploadInProgressChange={setCreativeLibraryRegistrationInProgress}
      persistedUploadEntries={persistedUploadEntries}
      testIdPrefix='attribution-thumbnail'
      universeId={
        // Coerce the "no experience" sentinel (0) to undefined so the upload
        // tab never tags new registrations with universe 0.
        (getValues(FormField.EXPERIENCE)?.universe_id ?? 0) > 0
          ? getValues(FormField.EXPERIENCE)?.universe_id
          : undefined
      }
    />
  );
};

export default AttributionThumbnailUploadDrawerContent;
