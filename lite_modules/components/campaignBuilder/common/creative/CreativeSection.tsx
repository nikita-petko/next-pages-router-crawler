import { Grid, Typography } from '@rbx/ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { EventName, logNativeImpressionEvent } from '@clients/unifiedLogger';
import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import ReachCreativeSection from '@components/campaignBuilder/common/creative/ReachCreativeSection';
import ReachCreativePreview from '@components/campaignBuilder/common/creative/reachSection/ReachCreativePreview';
import ThumbnailCreativeSection from '@components/campaignBuilder/common/creative/ThumbnailCreativeSection';
import VideoCreativeSection from '@components/campaignBuilder/common/creative/VideoCreativeSection';
import FormAccordion from '@components/campaignBuilder/common/FormAccordion';
import { ServerCampaignObjectiveType } from '@constants/campaign';
import { AssetSource, FlowTypes, FormField, ReachAdFormat } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getThumbnailsByUniverseId } from '@services/games/getGameInfoService';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';

const CreativeSection = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { rightContentSubContainer },
  } = useCampaignBuilderCommonStyles();
  const { getFieldState, getValues, register, resetField, setValue, trigger } =
    useFormContext<FormType>();
  const universeFilter = useWatch<FormType, typeof FormField.EXPERIENCE>({
    name: FormField.EXPERIENCE,
  });
  const formThumbnails = useWatch<FormType, typeof FormField.THUMBNAILS>({
    name: FormField.THUMBNAILS,
  });
  const videos = useWatch<FormType, typeof FormField.VIDEOS>({
    name: FormField.VIDEOS,
  });
  const isExtendToOffPlatformEnabled = useWatch<
    FormType,
    typeof FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED
  >({
    name: FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED,
  });
  const goal = useWatch<FormType, typeof FormField.GOAL>({
    name: FormField.GOAL,
  });
  const creativeFormat = useWatch<FormType, typeof FormField.CREATIVE_FORMAT>({
    name: FormField.CREATIVE_FORMAT,
  });
  const { universe_id: universeId } = universeFilter || {};

  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const editMode = flowType === FlowTypes.EDIT;
  const cloneMode = flowType === FlowTypes.CLONE;

  // With the creative library on, the experience's auto-imported thumbnails
  // are surfaced as opt-in tiles in the "Add creatives" drawer
  // (CreativeImportTab) instead of being force-prepopulated onto the form, so
  // the drawer is the single place they enter the campaign.
  const isCreativeLibraryEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isCreativeLibraryEnabled ?? false,
  );

  const isEditingGaasCampaignWithNoCreatives =
    editMode && isExtendToOffPlatformEnabled && !videos.length;

  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(
    editMode && !isEditingGaasCampaignWithNoCreatives,
  );
  const simplifiedCampaignAssetIds = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.asset_ids,
  );
  const createMode = useCampaignBuilderStore((state) => state.flowType === FlowTypes.CREATE);

  const { data: thumbnails } = useQuery({
    enabled: !!universeId && (createMode || editMode),
    queryFn: () => getThumbnailsByUniverseId(universeId),
    queryKey: ['thumbnails', universeId],
  });

  useEffect(() => {
    register(FormField.THUMBNAILS);
  }, [register]);

  // Wipe carried-over thumbnails on a real experience swap (defined → defined,
  // different id) in create flow. We deliberately do NOT wipe on a transient
  // defined → undefined transition: an unmount of an upstream experience
  // provider, an in-flight refetch, or any other path that briefly nulls out
  // universeId would otherwise silently clear the user's work. Edit mode is
  // also excluded because the existing branch below merges rather than
  // replaces and the experience picker is locked anyway.
  const previousUniverseIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const prev = previousUniverseIdRef.current;
    previousUniverseIdRef.current = universeId;
    if (prev === undefined || universeId === undefined || prev === universeId || editMode) {
      return;
    }
    setValue(FormField.THUMBNAILS, [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [universeId, editMode, setValue]);

  useEffect(() => {
    if (simplifiedCampaignAssetIds && cloneMode) {
      const assetIds = simplifiedCampaignAssetIds.map((imageId) => ({
        assetId: imageId,
        existing: false, // Clone mode cannot have published thumbnails.
        isSelected: true,
        source: AssetSource.CREATOR,
      }));
      setValue(FormField.THUMBNAILS, assetIds || []);
    }
  }, [setValue, editMode, cloneMode, simplifiedCampaignAssetIds]);

  useEffect(() => {
    if (thumbnails && createMode && !isCreativeLibraryEnabled) {
      const assetIds = thumbnails.assetIds.map((assetId, index) => ({
        assetId: Number(assetId),
        existing: false, // Create mode cannot have published thumbnails.
        isSelected: index === 0,
        source: AssetSource.CREATOR,
      }));

      logNativeImpressionEvent(EventName.AssetsFetched, {
        count: assetIds.length.toString(),
        flowType,
        universeId: universeId?.toString() || '',
      });

      // Reset Field will reset touched and dirty to false
      resetField(FormField.THUMBNAILS, {
        defaultValue: assetIds,
      });
      trigger(FormField.THUMBNAILS);
    }
    if (thumbnails && editMode) {
      const existingAssetIds = getValues(FormField.THUMBNAILS).map((creative) => creative.assetId);
      const newAssetIds = thumbnails.assetIds.filter(
        (assetId) => !existingAssetIds.includes(Number(assetId)),
      );

      const existingCreatives = getValues(FormField.THUMBNAILS).map((creative) => ({
        ...creative,
        source: thumbnails.assetIds.includes(creative.assetId.toString())
          ? AssetSource.CREATOR
          : AssetSource.ADS_MANAGER,
      }));

      const newAssets = newAssetIds.map((assetId) => ({
        assetId: Number(assetId),
        existing: false,
        isSelected: false,
        source: AssetSource.CREATOR,
      }));
      resetField(FormField.THUMBNAILS, {
        // call resetField so the form is not dirty
        defaultValue: [...existingCreatives, ...newAssets],
      });
      trigger(FormField.THUMBNAILS);
    }
  }, [
    thumbnails,
    resetField,
    createMode,
    universeId,
    flowType,
    trigger,
    editMode,
    getValues,
    setValue,
    isCreativeLibraryEnabled,
  ]);

  // Show (and count) every creative the user has selected on the form,
  // including existing ones that may be paused/stopped. This intentionally does
  // not consult the (async, date-filtered) ad list, so the section is stable
  // and instant. Active/paused awareness is being reworked in a follow-up PR.
  const selectedThumbnails = useMemo(
    () => (formThumbnails ?? []).filter((thumbnail) => thumbnail.isSelected),
    [formThumbnails],
  );

  const { error: thumbnailError } = getFieldState(FormField.THUMBNAILS);

  const { isImageUploadInProgress } = useCampaignBuilderStore();

  const hasThumbnailError = !!thumbnailError && !isImageUploadInProgress;

  const getAccordionDescription = () => {
    if (isExtendToOffPlatformEnabled) {
      return translate('Description.VideosUploaded', { count: String(videos.length) });
    }
    return translate('Description.ThumbnailsSelected', {
      count: String(selectedThumbnails.length),
    });
  };

  const renderCreativeSection = () => {
    if (goal === ServerCampaignObjectiveType.REACH) {
      return (
        <ReachCreativeSection
          formThumbnails={formThumbnails}
          selectedThumbnails={selectedThumbnails}
        />
      );
    }
    // isExtendToOffplatformEnabled is currently equal to Earnings objective selected
    if (isExtendToOffPlatformEnabled) {
      return <VideoCreativeSection videos={videos || []} />;
    }
    return (
      <ThumbnailCreativeSection
        formThumbnails={formThumbnails}
        selectedThumbnails={selectedThumbnails}
      />
    );
  };

  const renderRightContent = () => {
    if (goal === ServerCampaignObjectiveType.REACH) {
      // The 1x2 vertical (video) format has no preview yet.
      return creativeFormat === ReachAdFormat.VERTICAL_1X2 ? undefined : <ReachCreativePreview />;
    }

    if (!editMode) {
      if (isExtendToOffPlatformEnabled && goal === ServerCampaignObjectiveType.SPEND) {
        return (
          <div className={rightContentSubContainer}>
            <Typography variant='h5'>{translate('Label.VideoAssets')}</Typography>
            <Typography variant='body1'>
              {translate('Description.VideoAssetsDescription')}
            </Typography>
          </div>
        );
      }
      return (
        <div className={rightContentSubContainer}>
          <Typography variant='h5'>{translate('Label.CustomThumbnails')}</Typography>
          <Typography variant='body1'>
            {translate('Description.CustomThumbnailsDescription')}
          </Typography>
        </div>
      );
    }

    return undefined;
  };

  return (
    <FormAccordion
      description={getAccordionDescription()}
      hasError={hasThumbnailError || isEditingGaasCampaignWithNoCreatives}
      isOpen={isAccordionOpen && !isEditingGaasCampaignWithNoCreatives}
      onChange={setIsAccordionOpen}
      rightContent={renderRightContent()}
      title={translate('Heading.Creatives')}>
      <Grid container gap={2}>
        {renderCreativeSection()}
      </Grid>
    </FormAccordion>
  );
};

export default CreativeSection;
