import { IconButton, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import AssetTileImage from '@components/campaignBuilder/common/creative/AssetTileImage';
import CreativeLockBadge from '@components/campaignBuilder/common/creative/CreativeLockBadge';
import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import ThumbnailAiCreateDrawer from '@components/campaignBuilder/common/creative/thumbnailSection/ThumbnailAiCreateDrawer';
import ThumbnailCreativeAddButton from '@components/campaignBuilder/common/creative/thumbnailSection/ThumbnailCreativeAddButton';
import ThumbnailUploadDrawer from '@components/campaignBuilder/common/creative/thumbnailSection/ThumbnailUploadDrawer';
import { FOUNDATION_TOOLTIP_BODY_SMALL_CLASS } from '@components/common/creative/tooltipStyles';
import Skeleton from '@components/common/Skeleton';
import { AssetSource, FlowTypes, FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { ThumbnailType } from '@type/campaignBuilder';
import { GetEditCampaignDisabledTooltipText } from '@utils/campaignBuilder';

interface ThumbnailCreativeSectionProps {
  formThumbnails: FormType[typeof FormField.THUMBNAILS];
  selectedThumbnails: ThumbnailType[];
}

const ThumbnailSection = ({
  formThumbnails,
  selectedThumbnails,
}: ThumbnailCreativeSectionProps) => {
  const { translate, translateHTML } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { getFieldState, getValues, setValue } = useFormContext<FormType>();
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const editMode = flowType === FlowTypes.EDIT;

  const {
    classes: {
      creativeSectionPreviewContainer,
      removableCreativeWrapper,
      removeButtonOverlay,
      thumbnailTile,
    },
  } = useCreativesStyles();

  const editCampaignDisabledTooltip = GetEditCampaignDisabledTooltipText(flowType, campaignStatus);
  // The X overlay is informational + lightweight; gate it behind the same
  // "edit is locked" condition the legacy drawer uses for its trash icon so
  // we don't surface a remove affordance when the rest of the form is
  // read-only (started / canceled / completed / published campaigns).
  const isFormReadOnly = editMode && !!editCampaignDisabledTooltip;

  // Mirrors the legacy CreativeThumbnail drawer logic so the main form-view
  // X stays consistent with the drawer's trash:
  //   - existing (published) thumbnails: locked, no remove affordance
  //     (managed via the drawer's selection UI)
  //   - ADS_MANAGER source (uploaded via Ads Manager): remove from the
  //     form array entirely so it can be re-uploaded if needed
  //   - CREATOR source (auto-imported from the Creator Hub thumbnail
  //     library for the experience): keep in the array but flip
  //     `isSelected: false` so the user can re-add it from the drawer
  //     without re-fetching the library
  const handleRemoveThumbnail = (assetId: number) => {
    const allThumbnails = getValues(FormField.THUMBNAILS);
    const target = allThumbnails.find((thumbnail) => thumbnail.assetId === assetId);
    if (!target) {
      return;
    }
    const next =
      target.source === AssetSource.ADS_MANAGER && !target.existing
        ? allThumbnails.filter((thumbnail) => thumbnail.assetId !== assetId)
        : allThumbnails.map((thumbnail) =>
            thumbnail.assetId === assetId ? { ...thumbnail, isSelected: false } : thumbnail,
          );
    setValue(FormField.THUMBNAILS, next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const { isImageUploadInProgress, setThumbnailDrawerOpen, thumbnailDrawerOpen } =
    useCampaignBuilderStore();

  const isCreativeLibraryEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isCreativeLibraryEnabled ?? false,
  );
  const isGenAiCreativesEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isGenAiCreativesEnabled ?? false,
  );
  const [aiCreateDrawerOpen, setAiCreateDrawerOpen] = useState<boolean>(false);

  const { maximumAdsPerTrafficDrivingCampaignCount: maxAllowedThumbnails } = useAppStore(
    (state) => state.appMetadataState.data,
  );

  const { error: thumbnailError, isTouched: thumbnailIsTouched } = getFieldState(
    FormField.THUMBNAILS,
  );

  const hasThumbnailError = !!thumbnailError && !isImageUploadInProgress;
  const shouldShowThumbnailErrorMessage = hasThumbnailError && !!thumbnailIsTouched;

  const maybeRenderThumbnailLoadingIndicator = () => {
    if (
      isImageUploadInProgress &&
      getValues(FormField.THUMBNAILS).length < maxAllowedThumbnails &&
      !thumbnailDrawerOpen
    ) {
      return (
        <Skeleton
          className='height-[90px] width-[160px]'
          data-testid='thumbnail-upload-skeleton'
          variant='rectangular'
        />
      );
    }
    return null;
  };

  const maybeRenderThumbnailReviewOrErrorCopy = () => {
    if (editMode || isImageUploadInProgress) {
      return null;
    }
    if (shouldShowThumbnailErrorMessage) {
      return (
        <div
          className='text-body-large content-system-alert [font-size:14px] [margin-top:8px]'
          data-testid='thumbnail-error-message'>
          {thumbnailError?.message}
        </div>
      );
    }
    return null;
  };

  // With both flags on, the add tile becomes a Popover menu (Add creative +
  // AI generate); otherwise it's a single-action tile. Same 160x90 styling
  // either way (per Figma 17315:135712).
  const showCreativeAddMenu = isCreativeLibraryEnabled && isGenAiCreativesEnabled;
  // No room left in the campaign for another thumbnail. Hides the add (+) tile
  // entirely so the user can't open a drawer they can't add from; the AI
  // generate menu item is gated on the same condition.
  const isThumbnailSpaceFull = selectedThumbnails.length >= maxAllowedThumbnails;
  const showAiGenerateMenuItem =
    isGenAiCreativesEnabled && isCreativeLibraryEnabled && !isThumbnailSpaceFull;

  const maybeRenderUploadThumbnailButton = () => {
    if (isFormReadOnly) {
      return null;
    }
    return (
      <>
        <ThumbnailUploadDrawer
          onClose={() =>
            setValue(FormField.THUMBNAILS, formThumbnails, { shouldDirty: true, shouldTouch: true })
          }
        />
        {showCreativeAddMenu ? (
          <ThumbnailAiCreateDrawer onOpenChange={setAiCreateDrawerOpen} open={aiCreateDrawerOpen} />
        ) : null}
        {!isThumbnailSpaceFull ? (
          <ThumbnailCreativeAddButton
            hasError={shouldShowThumbnailErrorMessage}
            onAddCreative={() => {
              setThumbnailDrawerOpen(true, getValues(FormField.EXPERIENCE).universe_id);
            }}
            onAiGenerate={() => setAiCreateDrawerOpen(true)}
            showAiGenerateMenuItem={showAiGenerateMenuItem}
            showCreativeAddMenu={showCreativeAddMenu}
          />
        ) : null}
        {maybeRenderThumbnailReviewOrErrorCopy()}
      </>
    );
  };

  return (
    <div className='flex flex-col gap-medium width-full'>
      {/* Bold "Image assets" via boldStart/boldEnd placeholders so the
          whole phrase is one translation key. Count reflects the committed
          form value, so it only updates after the user clicks Add. Sized
          one step above the Figma's 12px sub-header per product feedback —
          14px (body/label-medium) reads as a proper section label without
          competing with the parent accordion header. */}
      <p
        className='margin-[0px] text-body-medium content-default'
        data-testid='thumbnail-asset-count'>
        {translateHTML(
          'Label.ImageAssetsCount',
          [
            {
              closing: 'boldEnd',
              content: (chunks) => <span className='text-label-medium'>{chunks}</span>,
              opening: 'boldStart',
            },
          ],
          {
            max: String(maxAllowedThumbnails),
            selected: String(selectedThumbnails.length),
          },
        )}
      </p>
      <div className={creativeSectionPreviewContainer}>
        {selectedThumbnails.map(({ assetId, existing }: ThumbnailType) => {
          const canRemove = !existing && !isFormReadOnly;
          // Existing (published) creatives are locked on the form — they can't
          // be removed here, matching the pre-drawer behavior. Lock state comes
          // straight from the synchronous `existing` flag (not the async ad
          // list), so it's stable. Per-ad serving status is being reworked in a
          // follow-up PR.
          const isLocked = !!existing;
          const tooltipTitle = isLocked
            ? translateCampaign('Description.CreativeCannotRemovePublished')
            : null;

          const tile = (
            <>
              <AssetTileImage
                alt={translate('Label.Image')}
                assetId={assetId}
                containerClassName={isLocked ? `${thumbnailTile} opacity-[0.4]` : thumbnailTile}
              />
              {isLocked ? <CreativeLockBadge /> : null}
              {canRemove ? (
                <div className={removeButtonOverlay}>
                  <IconButton
                    ariaLabel={translate('Label.RemoveCreative')}
                    data-testid={`remove-thumbnail-${assetId}`}
                    icon='icon-regular-x'
                    isCircular
                    onClick={() => handleRemoveThumbnail(assetId)}
                    size='Small'
                    variant='OverMedia'
                  />
                </div>
              ) : null}
            </>
          );

          return (
            <div
              className={removableCreativeWrapper}
              data-testid={`form-thumbnail-${assetId}`}
              key={assetId}>
              {tooltipTitle != null ? (
                <Tooltip
                  contentClassName={FOUNDATION_TOOLTIP_BODY_SMALL_CLASS}
                  position='top-center'
                  title={tooltipTitle}>
                  <TooltipTrigger asChild>
                    <span className='flex width-full'>{tile}</span>
                  </TooltipTrigger>
                </Tooltip>
              ) : (
                tile
              )}
            </div>
          );
        })}
        {maybeRenderThumbnailLoadingIndicator()}
        {maybeRenderUploadThumbnailButton()}
      </div>
    </div>
  );
};

export default ThumbnailSection;
