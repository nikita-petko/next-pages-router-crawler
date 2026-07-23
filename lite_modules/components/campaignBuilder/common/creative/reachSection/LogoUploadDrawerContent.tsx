import { Icon, SheetBody, SheetTitle } from '@rbx/foundation-ui';
import { Tooltip } from '@rbx/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import CreativeLibrarySheetBody from '@components/campaignBuilder/common/creative/CreativeLibrarySheetBody';
import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import CreativeLogo from '@components/campaignBuilder/common/creative/reachSection/CreativeLogo';
import ImageUploadDragAndDropZone from '@components/campaignBuilder/common/creative/thumbnailSection/ImageUploadDragAndDropZone';
import { type CreativeUploadPersistedEntry } from '@components/common/creative/CreativeUploadTab';
import { ServerAdStatusType } from '@constants/ad';
import { AssetSource, FlowTypes, FormField, MAX_LOGO_SELECTIONS } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import {
  CampaignBuilderStoreType,
  useCampaignBuilderStore,
} from '@stores/campaignBuilderStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { ServerAdAssetCompositeReviewDecisionType } from '@type/ad';
import { SetUploadedImageParams } from '@type/fileUpload';
import { LOGO_ASPECT_RATIO_VALIDATION } from '@utils/creativeFormat';

interface LogoUploadDrawerContentProps {
  onPersistedUploadEntriesChange?: (entries: CreativeUploadPersistedEntry[]) => void;
  persistedUploadEntries?: CreativeUploadPersistedEntry[];
}

const LogoUploadDrawerContent = ({
  onPersistedUploadEntriesChange,
  persistedUploadEntries = [],
}: LogoUploadDrawerContentProps = {}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const isCreativeLibraryEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isCreativeLibraryEnabled ?? false,
  );
  // Used to invalidate the shared Creative Library cache after a fresh
  // batch-register so the standalone library page reflects new uploads
  // the next time it mounts, even if this drawer is the first place the
  // asset was created.
  const adAccountId = useAppStore((state) => state.appData.adAccountInfo?.id);
  const queryClient = useQueryClient();
  const setLogoDrawerOpen = useCampaignBuilderStore((state) => state.setLogoDrawerOpen);
  const setCreativeLibraryRegistrationInProgress = useCampaignBuilderStore(
    (state) => state.setCreativeLibraryRegistrationInProgress,
  );
  const logos = useWatch<FormType, typeof FormField.LOGO_ASSETS>({
    name: FormField.LOGO_ASSETS,
  });
  const adsState = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignDetailsState.adsState,
  );

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

  const isEditMode = useCampaignBuilderStore(
    (state: CampaignBuilderStoreType) => state.flowType === FlowTypes.EDIT,
  );

  const { getValues, setValue, trigger } = useFormContext<FormType>();

  const selected = logos.filter(({ isSelected }) => isSelected).length;

  const handleLogoUploaded = ({ aspectRatio, assetId }: SetUploadedImageParams) => {
    const currentLogos = getValues(FormField.LOGO_ASSETS);
    setValue(
      FormField.LOGO_ASSETS,
      [
        ...currentLogos,
        {
          aspectRatio,
          assetId,
          existing: false,
          isSelected: selected === 0, // Auto-select if no logo is currently selected
          source: AssetSource.ADS_MANAGER,
        },
      ],
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
    trigger();
  };

  const getCurrentUploadedCount = () => {
    const currentLogos = getValues(FormField.LOGO_ASSETS);
    return currentLogos.filter(({ source }) => source === AssetSource.ADS_MANAGER).length;
  };

  // Flagged-path-only: called by CreativeUploadTab after library registration;
  // appends new ids and auto-selects the first one if none selected (Reach
  // allows one logo). Aspect-ratio validation is deferred to the server.
  const handleNewlyRegisteredLogos = (registered: Array<{ assetId: number; file: File }>) => {
    if (registered.length === 0) {
      return;
    }
    const currentLogos = getValues(FormField.LOGO_ASSETS);
    const existingIds = new Set(currentLogos.map((logo) => logo.assetId));
    const newIds = registered.map(({ assetId }) => assetId).filter((id) => !existingIds.has(id));
    if (newIds.length === 0) {
      return;
    }
    let alreadySelected = currentLogos.some((logo) => logo.isSelected);
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
    setValue(FormField.LOGO_ASSETS, [...currentLogos, ...additions], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    trigger(FormField.LOGO_ASSETS);
    // Bust the shared Creative Library cache so the standalone library
    // page (and any sibling drawer) sees the freshly-registered logos
    // on its next mount instead of serving the pre-upload snapshot.
    if (adAccountId != null) {
      queryClient.invalidateQueries({ queryKey: ['adCreatives', adAccountId] });
    }
  };

  const handleRemoveUploadedLogo = useCallback(
    (assetId: number) => {
      const currentLogos = getValues(FormField.LOGO_ASSETS);
      const nextLogos = currentLogos.filter((logo) => logo.assetId !== assetId);
      if (nextLogos.length === currentLogos.length) {
        return;
      }
      setValue(FormField.LOGO_ASSETS, nextLogos, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      trigger(FormField.LOGO_ASSETS);
    },
    [getValues, setValue, trigger],
  );

  const getMatchingAd = useCallback(
    (existing: boolean, assetId: number) =>
      existing
        ? adsState.data?.find(
            (ad) => ad.sponsored_universe_ad_metadata.asset_metadata.asset_id === assetId,
          )
        : undefined,
    [adsState.data],
  );

  // Sort logos by ad status (rejected and disabled last)
  // Only show existing logos in the Published Logos section
  const publishedLogos = useMemo(
    () =>
      logos
        .filter(({ existing }) => existing)
        .map(({ assetId, existing, source }) => {
          const matchingAd = getMatchingAd(existing, assetId);
          const adRejected =
            matchingAd?.composite_review_decision ===
            ServerAdAssetCompositeReviewDecisionType.REJECTED;
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
        .map(({ adEnabled, adRejected, assetId, existing }) => (
          <CreativeLogo
            adEnabled={adEnabled}
            adRejected={adRejected}
            assetId={assetId}
            existing={!!existing}
            key={assetId}
          />
        )),
    [logos, getMatchingAd],
  );

  const availableLogos = useMemo(
    () =>
      logos
        .filter(({ existing }) => !existing)
        .map(({ assetId, existing }) => (
          <CreativeLogo
            adEnabled={false}
            adRejected={false}
            assetId={assetId}
            existing={!!existing}
            key={assetId}
          />
        )),
    [logos],
  );

  const maybeRenderAvailableLogosSection = () => {
    // Available logos section is shown if there are logos that have been uploaded in Ads Manager (in the current session).

    if (!availableLogos.length) {
      return null;
    }
    return (
      <div
        className={cx({
          [creativeUploadDrawerThumbnailsMarginTop]: publishedLogos.length > 0,
        })}>
        <span className={`text-body-large ${creativeUploadDrawerBold}`}>
          {translate('Heading.AvailableLogos')}
        </span>
        <div className={creativeSectionPreviewContainer}>{availableLogos}</div>
      </div>
    );
  };

  const maybeRenderPublishedLogosSection = () => {
    // Logos that have been published to the campaign are shown in this section. This section should only be shown in edit mode.

    if (!isEditMode) {
      return null;
    }

    if (!publishedLogos.length) {
      return null;
    }
    return (
      <div>
        <span className={`text-body-large ${creativeUploadDrawerBold}`}>
          {translate('Heading.PublishedLogo')}
        </span>
        <Tooltip placement='top' title={translate('Description.PublishedLogoSaved')}>
          <Icon
            className={`${creativeUploadDrawerInfoIcon} content-muted`}
            name='icon-regular-circle-i'
            size='Medium'
          />
        </Tooltip>
        <div className={creativeSectionPreviewContainer}>{publishedLogos}</div>
      </div>
    );
  };

  const maybeRenderCountSelected = () => {
    if (!publishedLogos.length && !availableLogos.length) {
      return null;
    }
    return (
      <span className={`text-body-large ${creativeUploadDrawerNumSelected}`}>
        {translate('Description.SelectedCount', { max: '1', selected: String(selected) })}
      </span>
    );
  };

  if (isCreativeLibraryEnabled) {
    return (
      <CreativeLibrarySheetBody
        // Gate the Upload tab on the same client-side validator the
        // legacy drag-and-drop zone uses (1:1 / 3:1 with shared
        // tolerance). Library imports are already filtered to compatible
        // ratios in `CreativeImportTab`, so the gate only matters on the
        // Upload tab — but it lives on the sheet body since that's
        // where CreativeUploadTab is mounted.
        aspectRatioValidation={LOGO_ASPECT_RATIO_VALIDATION}
        formField={FormField.LOGO_ASSETS}
        isSelectMediaDisabled={selected >= MAX_LOGO_SELECTIONS}
        maxAllowedSelections={MAX_LOGO_SELECTIONS}
        maxUploadFiles={MAX_LOGO_SELECTIONS}
        onClose={() => setLogoDrawerOpen(false, getValues(FormField.EXPERIENCE).universe_id)}
        onPersistedUploadEntriesChange={onPersistedUploadEntriesChange}
        onRegistered={handleNewlyRegisteredLogos}
        onRemoveUploadedAsset={handleRemoveUploadedLogo}
        onUploadInProgressChange={setCreativeLibraryRegistrationInProgress}
        persistedUploadEntries={persistedUploadEntries}
        testIdPrefix='logo'
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
      <SheetTitle>{translate('Heading.UploadLogo')}</SheetTitle>
      <SheetBody>
        <span className={`text-body-large ${creativeUploadDrawerBody}`}>
          {translate('Description.LogoUploadDescription')}
        </span>
        {maybeRenderCountSelected()}
        {maybeRenderPublishedLogosSection()}
        {maybeRenderAvailableLogosSection()}
        <ImageUploadDragAndDropZone
          aspectRatioValidation={LOGO_ASPECT_RATIO_VALIDATION}
          getCurrentUploadedCount={getCurrentUploadedCount}
          helperTextLines={[
            translate('Description.DragAndDropFiles'),
            translate('Description.LogoAspectRatio'),
          ]}
          onAssetUploaded={handleLogoUploaded}
          uploadButtonText={translate('Action.UploadLogos')}
          uploadingText={translate('Description.UploadingLogo')}
        />
      </SheetBody>
    </>
  );
};

export default LogoUploadDrawerContent;
