import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import CreativeLibrarySheetBody from '@components/campaignBuilder/common/creative/CreativeLibrarySheetBody';
import { type CreativeUploadPersistedEntry } from '@components/common/creative/CreativeUploadTab';
import { FlowTypes, FormField, MAX_ALLOWED_CREATIVES } from '@constants/campaignBuilder';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useAppStore } from '@stores/appStoreProvider';
import {
  CampaignBuilderStoreType,
  useCampaignBuilderStore,
} from '@stores/campaignBuilderStoreProvider';
import { appendRegisteredThumbnailsToForm } from '@utils/appendRegisteredThumbnailsToForm';
import { countSelectedCreatives } from '@utils/campaignBuilder';

interface ThumbnailUploadDrawerContentProps {
  /** When set, overrides the metadata-driven max creatives cap (e.g. 1 for 1x2 posters). */
  maxAllowedCreativesOverride?: number;
  onPersistedUploadEntriesChange?: (entries: CreativeUploadPersistedEntry[]) => void;
  persistedUploadEntries?: CreativeUploadPersistedEntry[];
}

const ThumbnailUploadDrawerContent = ({
  maxAllowedCreativesOverride,
  onPersistedUploadEntriesChange,
  persistedUploadEntries = [],
}: ThumbnailUploadDrawerContentProps = {}) => {
  const queryClient = useQueryClient();
  const adAccountId = useAppStore((state) => state.appData.adAccountInfo?.id);
  const setThumbnailDrawerOpen = useCampaignBuilderStore((state) => state.setThumbnailDrawerOpen);
  const creatives = useWatch<FormType, typeof FormField.THUMBNAILS>({
    name: FormField.THUMBNAILS,
  });
  const isEditMode = useCampaignBuilderStore(
    (state: CampaignBuilderStoreType) => state.flowType === FlowTypes.EDIT,
  );
  const setCreativeLibraryRegistrationInProgress = useCampaignBuilderStore(
    (state) => state.setCreativeLibraryRegistrationInProgress,
  );
  const selected = useMemo(() => countSelectedCreatives(creatives), [creatives]);

  const { getValues, setValue, trigger } = useFormContext<FormType>();

  const maxAllowedCreativesFromMetadata = useAppStore(
    (state) =>
      state.appMetadataState.data?.maximumAdsPerTrafficDrivingCampaignCount ??
      MAX_ALLOWED_CREATIVES,
  );
  const maxAllowedCreatives = maxAllowedCreativesOverride ?? maxAllowedCreativesFromMetadata;

  // Library upload path: append registered assets to the campaign form.
  const handleNewlyRegisteredCreatives = (registered: Array<{ assetId: number; file: File }>) => {
    appendRegisteredThumbnailsToForm({
      adAccountId,
      creativeOrigin: 'upload',
      getValues,
      maxAllowedCreatives,
      queryClient,
      registered,
      setValue,
      trigger,
    });
  };

  const handleRemoveUploadedCreative = useCallback(
    (assetId: number) => {
      const currentCreatives = getValues(FormField.THUMBNAILS);
      const nextCreatives = currentCreatives.filter((creative) => creative.assetId !== assetId);
      if (nextCreatives.length === currentCreatives.length) {
        return;
      }
      setValue(FormField.THUMBNAILS, nextCreatives, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      trigger(FormField.THUMBNAILS);
    },
    [getValues, setValue, trigger],
  );

  return (
    <CreativeLibrarySheetBody
      formField={FormField.THUMBNAILS}
      isSelectMediaDisabled={selected >= maxAllowedCreatives}
      maxAllowedSelections={maxAllowedCreatives}
      maxUploadFiles={maxAllowedCreatives}
      onClose={() => setThumbnailDrawerOpen(false, getValues(FormField.EXPERIENCE).universe_id)}
      onPersistedUploadEntriesChange={onPersistedUploadEntriesChange}
      onRegistered={handleNewlyRegisteredCreatives}
      onRemoveUploadedAsset={handleRemoveUploadedCreative}
      onUploadInProgressChange={setCreativeLibraryRegistrationInProgress}
      persistedUploadEntries={persistedUploadEntries}
      // Active tab is edit-only; create-flow campaigns have no concept
      // of "active" creatives until they're submitted.
      showActiveTab={isEditMode}
      testIdPrefix='thumbnail'
      universeId={
        // Coerce the "no experience" sentinel (0) to undefined so the
        // upload tab never tags new registrations with universe 0.
        (getValues(FormField.EXPERIENCE)?.universe_id ?? 0) > 0
          ? getValues(FormField.EXPERIENCE)?.universe_id
          : undefined
      }
    />
  );
};

export default ThumbnailUploadDrawerContent;
