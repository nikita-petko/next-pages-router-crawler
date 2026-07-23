import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import AiCreateDrawer from '@components/common/creative/AiCreateDrawer';
import { FormField, MAX_ALLOWED_CREATIVES } from '@constants/campaignBuilder';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { appendRegisteredThumbnailsToForm } from '@utils/appendRegisteredThumbnailsToForm';
import { countSelectedCreatives } from '@utils/campaignBuilder';

interface ThumbnailAiCreateDrawerProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const ThumbnailAiCreateDrawer = ({ onOpenChange, open }: ThumbnailAiCreateDrawerProps) => {
  const queryClient = useQueryClient();
  const { getValues, setValue, trigger } = useFormContext<FormType>();
  const adAccountId = useAppStore((state) => state.appData.adAccountInfo?.id);
  const maxAllowedCreatives = useAppStore(
    (state) =>
      state.appMetadataState?.data?.maximumAdsPerTrafficDrivingCampaignCount ??
      MAX_ALLOWED_CREATIVES,
  );
  const setCreativeLibraryRegistrationInProgress = useCampaignBuilderStore(
    (state) => state.setCreativeLibraryRegistrationInProgress,
  );

  const thumbnails = useWatch<FormType, typeof FormField.THUMBNAILS>({
    name: FormField.THUMBNAILS,
  });
  const selectedCount = useMemo(() => countSelectedCreatives(thumbnails), [thumbnails]);
  const remainingSelectableCount = Math.max(0, maxAllowedCreatives - selectedCount);

  const experience = getValues(FormField.EXPERIENCE);
  const rawUniverseId = experience?.universe_id;
  const universeId =
    rawUniverseId != null && Number(rawUniverseId) > 0 ? Number(rawUniverseId) : undefined;

  const handleAddToCampaign = useCallback(
    (registered: Array<{ assetId: number; file: File }>) => {
      appendRegisteredThumbnailsToForm({
        adAccountId,
        creativeOrigin: 'ai',
        getValues,
        maxAllowedCreatives,
        queryClient,
        registered,
        setValue,
        trigger,
      });
      onOpenChange(false);
    },
    [adAccountId, getValues, maxAllowedCreatives, onOpenChange, queryClient, setValue, trigger],
  );

  return (
    <AiCreateDrawer
      fixedUniverseId={universeId}
      maxCampaignAddCount={remainingSelectableCount}
      onAddToCampaign={handleAddToCampaign}
      onBusyChange={setCreativeLibraryRegistrationInProgress}
      onOpenChange={onOpenChange}
      open={open}
    />
  );
};

export default ThumbnailAiCreateDrawer;
