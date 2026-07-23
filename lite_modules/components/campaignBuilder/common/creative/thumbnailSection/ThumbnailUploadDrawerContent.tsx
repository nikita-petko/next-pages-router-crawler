import { Icon, SheetBody, SheetTitle } from '@rbx/foundation-ui';
import { Tooltip, Typography } from '@rbx/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import CreativeLibrarySheetBody from '@components/campaignBuilder/common/creative/CreativeLibrarySheetBody';
import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import CreativeThumbnail from '@components/campaignBuilder/common/creative/thumbnailSection/CreativeThumbnail';
import ImageUploadDragAndDropZone from '@components/campaignBuilder/common/creative/thumbnailSection/ImageUploadDragAndDropZone';
import { type CreativeUploadPersistedEntry } from '@components/common/creative/CreativeUploadTab';
import { ServerAdStatusType } from '@constants/ad';
import { ServerCampaignObjectiveType } from '@constants/campaign';
import {
  AssetSource,
  CreativeMarketingBlurb,
  FlowTypes,
  FormField,
  MAX_ALLOWED_CREATIVES,
  UPLOAD_BUFFER_COUNT,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  batchRegisterAdCreativeAssets,
  RegisterAdCreativeAssetParams,
} from '@services/ads/adCreativeAssetService';
import { useAppStore } from '@stores/appStoreProvider';
import {
  CampaignBuilderStoreType,
  useCampaignBuilderStore,
} from '@stores/campaignBuilderStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { ServerAdAssetCompositeReviewDecisionType } from '@type/ad';
import { SetUploadedImageParams } from '@type/fileUpload';
import { appendRegisteredThumbnailsToForm } from '@utils/appendRegisteredThumbnailsToForm';
import { countSelectedCreatives } from '@utils/campaignBuilder';

interface ThumbnailUploadDrawerContentProps {
  onPersistedUploadEntriesChange?: (entries: CreativeUploadPersistedEntry[]) => void;
  persistedUploadEntries?: CreativeUploadPersistedEntry[];
}

const ThumbnailUploadDrawerContent = ({
  onPersistedUploadEntriesChange,
  persistedUploadEntries = [],
}: ThumbnailUploadDrawerContentProps = {}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  // Used to invalidate the shared Creative Library cache after a fresh
  // batch-register so the standalone library page reflects new uploads
  // the next time it mounts, even if this drawer is the first place the
  // asset was created.
  const queryClient = useQueryClient();
  const adAccountId = useAppStore((state) => state.appData.adAccountInfo?.id);
  const [registrationError, setRegistrationError] = useState<string>('');
  const pendingRegistrationsRef = useRef<RegisterAdCreativeAssetParams[]>([]);
  const isCreativeLibraryEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isCreativeLibraryEnabled ?? false,
  );
  const setThumbnailDrawerOpen = useCampaignBuilderStore((state) => state.setThumbnailDrawerOpen);
  const thumbnailDrawerOpen = useCampaignBuilderStore(
    (state: CampaignBuilderStoreType) => state.thumbnailDrawerOpen,
  );
  const creatives = useWatch<FormType, typeof FormField.THUMBNAILS>({
    name: FormField.THUMBNAILS,
  });
  const objective = useWatch<FormType, typeof FormField.GOAL>({
    name: FormField.GOAL,
  });
  const adsState = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignDetailsState.adsState,
  );
  const isReachObjective = objective === ServerCampaignObjectiveType.REACH;
  const {
    classes: {
      creativeSectionPreviewContainer,
      creativeUploadDrawerBody,
      creativeUploadDrawerBold,
      creativeUploadDrawerInfoIcon,
      creativeUploadDrawerNumSelected,
      creativeUploadDrawerThumbnailsMarginTop,
    },
    cx,
  } = useCreativesStyles();
  const maxAllowedCreatives = useAppStore(
    (state) =>
      state.appMetadataState.data?.maximumAdsPerTrafficDrivingCampaignCount ??
      MAX_ALLOWED_CREATIVES,
  );
  const isEditMode = useCampaignBuilderStore(
    (state: CampaignBuilderStoreType) => state.flowType === FlowTypes.EDIT,
  );
  const isImageUploadInProgress = useCampaignBuilderStore(
    (state: CampaignBuilderStoreType) => state.isImageUploadInProgress,
  );
  const setCreativeLibraryRegistrationInProgress = useCampaignBuilderStore(
    (state) => state.setCreativeLibraryRegistrationInProgress,
  );
  const selected = useMemo(() => countSelectedCreatives(creatives), [creatives]);

  const { getValues, setValue, trigger } = useFormContext<FormType>();

  const flushRegistrations = async () => {
    const toRegister = pendingRegistrationsRef.current;
    pendingRegistrationsRef.current = [];
    if (toRegister.length === 0) {
      return;
    }

    setCreativeLibraryRegistrationInProgress(true);
    setRegistrationError('');
    try {
      await batchRegisterAdCreativeAssets(toRegister);
    } catch {
      const failedAssetIds = new Set(toRegister.map((a) => a.assetId));
      setValue(
        FormField.THUMBNAILS,
        getValues(FormField.THUMBNAILS).filter((t) => !failedAssetIds.has(t.assetId)),
        { shouldDirty: true, shouldValidate: true },
      );
      trigger();
      setRegistrationError(translateMisc('Message.GenericError'));
    } finally {
      setCreativeLibraryRegistrationInProgress(false);
    }
  };

  // Flush pending registrations as a single batch once all file uploads are done.
  useEffect(() => {
    if (isImageUploadInProgress || pendingRegistrationsRef.current.length === 0) {
      return;
    }
    flushRegistrations();
  }, [isImageUploadInProgress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear stale registration errors when the drawer reopens.
  useEffect(() => {
    if (thumbnailDrawerOpen) {
      setRegistrationError('');
    }
  }, [thumbnailDrawerOpen]);

  const handleThumbnailUploaded = ({ assetId, image }: SetUploadedImageParams) => {
    const currentCreatives = getValues(FormField.THUMBNAILS);
    const activeCreativeCount = countSelectedCreatives(currentCreatives);
    setValue(
      FormField.THUMBNAILS,
      [
        ...currentCreatives,
        {
          assetId,
          creativeOrigin: 'upload',
          existing: false,
          isSelected: activeCreativeCount < maxAllowedCreatives,
          source: AssetSource.ADS_MANAGER,
        },
      ],
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
    trigger();

    if (!isCreativeLibraryEnabled) {
      return;
    }

    const universeId = getValues(FormField.EXPERIENCE)?.universe_id;
    pendingRegistrationsRef.current = [
      ...pendingRegistrationsRef.current,
      {
        assetId,
        assetType: 'AD_ASSET_TYPE_IMAGE',
        file: image,
        source: 'AD_CREATIVE_ASSET_SOURCE_UPLOAD',
        // `0` means the campaign isn't bound to an experience yet —
        // omit the field so the asset registers as untagged instead of
        // tripping `UNIVERSE_NOT_FOUND` on the wire.
        ...(universeId != null && universeId > 0 && { universeId }),
      },
    ];
  };

  const getCurrentUploadedCount = () => {
    const currentCreatives = getValues(FormField.THUMBNAILS);
    return currentCreatives.filter(({ source }) => source === AssetSource.ADS_MANAGER).length;
  };

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

  const getMatchingAd = (existing: boolean, assetId: number) =>
    existing
      ? adsState.data?.find(
          (ad) => ad.sponsored_universe_ad_metadata.asset_metadata.asset_id === assetId,
        )
      : undefined;

  // Sort thumbnails by ad status (rejected and disabled last)
  // Only show existing thumbnails in the Published Thumbnails section
  const publishedThumbnails = creatives
    .filter(({ existing }) => existing)
    .map(({ assetId, existing, source }) => {
      const matchingAd = getMatchingAd(existing, assetId);
      const adRejected =
        matchingAd?.composite_review_decision === ServerAdAssetCompositeReviewDecisionType.REJECTED;
      const adEnabled = matchingAd?.status === ServerAdStatusType.ENABLED;
      return { adEnabled, adRejected, assetId, existing, source };
    })
    .sort((a, b) => {
      if (a.adRejected !== b.adRejected) {
        return a.adRejected ? -1 : 1;
      }
      if (a.adEnabled !== b.adEnabled) {
        return a.adEnabled ? -1 : 1;
      }
      return 0;
    })
    .map(({ adEnabled, adRejected, assetId, existing, source }) => (
      <CreativeThumbnail
        adEnabled={adEnabled}
        adRejected={adRejected}
        assetId={assetId}
        assetSource={source ?? AssetSource.ADS_MANAGER}
        existing={!!existing}
        key={assetId}
        maxAllowedCreatives={maxAllowedCreatives}
      />
    ));

  const availableThumbnails = creatives
    .filter(({ existing }) => !existing)
    .map(({ assetId, existing, source }) => (
      <CreativeThumbnail
        adEnabled={false}
        adRejected={false}
        assetId={assetId}
        assetSource={source ?? AssetSource.ADS_MANAGER}
        existing={!!existing}
        key={assetId}
        maxAllowedCreatives={maxAllowedCreatives}
      />
    ));

  const maybeRenderAvailableThumbnailsSection = () => {
    // Available thumbnails section is shown if there are thumbnails imported from Creator Hub that are not already published,
    // or if there are thumbnails that have been uploaded in Ads Manager (in the current session).

    // Prevent the available thumbnails from jumping around when the user uploads their first thumbnail
    if (!availableThumbnails.length) {
      return null;
    }
    return (
      <div
        className={cx({
          [creativeUploadDrawerThumbnailsMarginTop]: publishedThumbnails.length > 0,
        })}>
        <Typography className={creativeUploadDrawerBold} variant='largeLabel1'>
          {isReachObjective
            ? translate('Heading.AvailableImageAssets')
            : translate('Heading.AvailableThumbnails')}
        </Typography>
        <Tooltip
          placement='top'
          title={
            isReachObjective
              ? translate('Description.ImageAssetsImported')
              : translate('Description.ThumbnailsImported')
          }>
          <Icon
            className={`${creativeUploadDrawerInfoIcon} content-muted`}
            name='icon-regular-circle-i'
            size='Medium'
          />
        </Tooltip>
        <div className={creativeSectionPreviewContainer}>{availableThumbnails}</div>
      </div>
    );
  };

  const maybeRenderPublishedThumbnailsSection = () => {
    // Thumbnails that have been published to the campaign are shown in this section. This section should only be shown in edit mode.

    if (!isEditMode) {
      return null;
    }

    if (!publishedThumbnails.length) {
      return null;
    }
    return (
      <div>
        <Typography className={creativeUploadDrawerBold} variant='largeLabel1'>
          {isReachObjective
            ? translate('Heading.PublishedImageAssets')
            : translate('Heading.PublishedThumbnails')}
        </Typography>
        <Tooltip
          placement='top'
          title={
            isReachObjective
              ? translate('Description.PublishedImageAssetsSaved')
              : translate('Description.PublishedThumbnailsSaved')
          }>
          <Icon
            className={`${creativeUploadDrawerInfoIcon} content-muted`}
            name='icon-regular-circle-i'
            size='Medium'
          />
        </Tooltip>
        <div className={creativeSectionPreviewContainer}>{publishedThumbnails}</div>
      </div>
    );
  };

  const maybeRenderCountSelected = () => {
    if (!publishedThumbnails.length && !availableThumbnails.length) {
      return null;
    }
    return (
      <Typography className={creativeUploadDrawerNumSelected} variant='body1'>
        {translate('Description.SelectedCount', {
          max: String(maxAllowedCreatives),
          selected: String(selected),
        })}
      </Typography>
    );
  };

  if (isCreativeLibraryEnabled) {
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
  }

  return (
    <>
      <SheetTitle>
        {isReachObjective
          ? translate('Heading.UploadImageAsset')
          : translate('Heading.UploadThumbnails')}
      </SheetTitle>
      <SheetBody>
        <Typography className={creativeUploadDrawerBody} variant='largeLabel1'>
          {translate(CreativeMarketingBlurb)}
        </Typography>
        {maybeRenderCountSelected()}
        {maybeRenderPublishedThumbnailsSection()}
        {maybeRenderAvailableThumbnailsSection()}
        <ImageUploadDragAndDropZone
          getCurrentUploadedCount={getCurrentUploadedCount}
          helperTextLines={[
            translate('Description.DragAndDropFiles'),
            translate('Description.ImageAspectRatio'),
          ]}
          maxAllowedUploads={maxAllowedCreatives + UPLOAD_BUFFER_COUNT}
          onAssetUploaded={handleThumbnailUploaded}
          uploadButtonText={
            isReachObjective
              ? translate('Action.UploadImageAsset')
              : translate('Action.UploadThumbnails')
          }
          uploadingText={translate('Description.UploadingImage')}
        />
        {registrationError && (
          <Typography color='error' variant='body1'>
            {registrationError}
          </Typography>
        )}
      </SheetBody>
    </>
  );
};

export default ThumbnailUploadDrawerContent;
