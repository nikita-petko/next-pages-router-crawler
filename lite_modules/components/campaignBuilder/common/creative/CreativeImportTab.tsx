import {
  AdAssetType,
  AdCreativeAssetSource,
  type ContentModerationStatus,
} from '@rbx/client-ads-management-api/v1';
import { Button, Divider, ProgressCircle, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { ThumbnailResponseState } from '@rbx/thumbnails';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import AssetTileImage from '@components/campaignBuilder/common/creative/AssetTileImage';
import tileStyles from '@components/campaignBuilder/common/creative/CreativeImportTab.module.css';
import CreativeLockBadge from '@components/campaignBuilder/common/creative/CreativeLockBadge';
import { FOUNDATION_TOOLTIP_BODY_SMALL_CLASS } from '@components/common/creative/tooltipStyles';
import { AssetSource, FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  batchRegisterAdCreativeAssets,
  getAdCreatives,
  getImageDimensionsFromUrl,
} from '@services/ads/adCreativeAssetService';
import { getThumbnailsByUniverseId } from '@services/games/getGameInfoService';
import { getThumbnailByAssetId as fetchThumbnailByAssetId } from '@services/thumbnails/getThumbnailService';
import { useAppStore } from '@stores/appStoreProvider';
import { useThumbnailStore } from '@stores/thumbnailStoreProvider';
import { getHttpStatusFromError } from '@type/errorResponse';
import { countSelectedCreatives } from '@utils/campaignBuilder';
import { bucketLogoAspectRatio, isCompatibleWithLogoPlacement } from '@utils/creativeFormat';
import { CaptureException } from '@utils/error';

type SupportedFormField = typeof FormField.THUMBNAILS | typeof FormField.LOGO_ASSETS;

interface CreativeImportTabProps {
  /** THUMBNAILS or LOGO_ASSETS — appended to with imported library items. */
  formField: SupportedFormField;
  /** Cap on per-drawer selections so we don't push the draft past its limit. */
  maxAllowedSelections: number;
  /**
   * Optional footer action bridge for sheet wrappers that render action buttons
   * in a sticky footer instead of in-tab headers.
   */
  onFooterActionChange?: (action: CreativeImportFooterAction | null) => void;
  /**
   * Reports this tab's net pending change (new tiles staged + on-draft
   * tiles toggled) up to the parent so the upload tab's "X / max" header
   * and cap gate stay in lockstep with what the user has clicked here.
   */
  onPendingDeltaChange?: (delta: number) => void;
  /**
   * Count of upload-tab rows that aren't yet committed to the form
   * (staged / uploading / failed). Folded into this tab's displayed
   * count + cap check so both tabs share a single "X / max" total.
   */
  pendingUploadCount?: number;
}

export interface CreativeImportFooterAction {
  isDisabled: boolean;
  label: string;
  onClick: () => void;
}

// Approved + in-review are pickable so users can keep building while
// moderation completes; rejected (and any unknown future state) is excluded.
const PICKABLE_MODERATION_STATES: ReadonlyArray<ContentModerationStatus> = [
  'approved',
  'pending_review',
];

// Locked tiles render published-asset-dimmed; unselected tiles render
// max-reached-dimmed; otherwise no extra class. Kept as a helper so JSX
// stays a single expression.
const getTileImageClass = ({
  isLocked,
  isMaxSelectionDisabled,
}: {
  isLocked: boolean;
  isMaxSelectionDisabled: boolean;
}): string => {
  if (isLocked) {
    return 'opacity-[0.4]';
  }
  if (isMaxSelectionDisabled) {
    return 'opacity-[0.6]';
  }
  return '';
};

// "Select from library" tab for the campaign-builder drawers. Scoped to the
// campaign's experience plus untagged (account-level) assets. Selecting
// only mutates the form; published campaign assets stay locked in-grid.
// Caller gates behind isCreativeLibraryEnabled.
const CreativeImportTab = ({
  formField,
  maxAllowedSelections,
  onFooterActionChange,
  onPendingDeltaChange,
  pendingUploadCount = 0,
}: CreativeImportTabProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const adAccountId = useAppStore((state) => state.appData.adAccountInfo?.id);
  const queryClient = useQueryClient();
  const { getValues, setValue, trigger } = useFormContext<FormType>();
  // `useWatch` can momentarily return `undefined` — on its first render before
  // it subscribes, and during a form reset. If we let that drive the universe
  // filter, it collapses to "untagged only" (and disables the auto-import
  // query), so the grid randomly drops the experience's creatives down to the
  // handful of account-level assets. Fall back to the committed form value so
  // the scope stays stable across those transient frames.
  const watchedExperience = useWatch<FormType, typeof FormField.EXPERIENCE>({
    name: FormField.EXPERIENCE,
  });
  const campaignUniverseId = (watchedExperience ?? getValues(FormField.EXPERIENCE))?.universe_id;
  // Auto-import only applies to the thumbnail drawer; the logo drawer has no
  // experience-preview analogue.
  const isThumbnailField = formField === FormField.THUMBNAILS;

  // Two staging buckets so every tile click is just a preview the user
  // confirms via Select; this keeps the drawer's "you have to submit"
  // contract instead of mutating the form on each click.
  //   - selectedAssetIds: new library tiles the user intends to add
  //     (will land on the form as isSelected: true).
  //   - pendingDraftToggleAssetIds: tiles already on the draft whose
  //     `isSelected` the user wants to flip on the next Select.
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<number>>(new Set());
  const [pendingDraftToggleAssetIds, setPendingDraftToggleAssetIds] = useState<Set<number>>(
    new Set(),
  );

  // Pending state is scoped to the current universe filter; clear on
  // experience change so we don't import stale selections on Select.
  useEffect(() => {
    setSelectedAssetIds(new Set());
    setPendingDraftToggleAssetIds(new Set());
  }, [campaignUniverseId]);

  const {
    data: libraryAssets,
    error: libraryLoadError,
    isError: isLibraryLoadError,
    isFetching: isFetchingLibrary,
  } = useQuery({
    enabled: adAccountId != null,
    queryFn: () => getAdCreatives(false),
    queryKey: ['adCreatives', adAccountId, false],
    select: (response) => response.assets,
    // Opt out of the global staleTime: Infinity (set in _app.tsx) so
    // pending_review creatives don't get pinned to the cache for the
    // whole session — each drawer mount re-fetches and gets the latest
    // moderation status. Shares its query key with the standalone
    // Creative Library page so the two stay in lockstep.
    staleTime: 0,
  });

  // Auto-imported EDP thumbnails: the campaign's experience exposes its own
  // preview images, which resolve to real catalog asset IDs — the same source
  // CreativeSection used to force-prepopulate before the library flag. We
  // surface them here as opt-in tiles instead, so the drawer is the single
  // place they enter the campaign. Shares the ['thumbnails', universeId]
  // cache key with CreativeSection so this is a cache hit, not a re-fetch.
  const { data: autoImportedAssetIds, isFetching: isFetchingAutoImported } = useQuery({
    enabled: isThumbnailField && campaignUniverseId != null,
    queryFn: () => getThumbnailsByUniverseId(campaignUniverseId as number),
    queryKey: ['thumbnails', campaignUniverseId],
    select: (response) => response.assetIds.map(Number),
  });
  const autoImportedAssetIdSet = useMemo(
    () => new Set(autoImportedAssetIds ?? []),
    [autoImportedAssetIds],
  );

  useEffect(() => {
    if (!isLibraryLoadError) {
      return;
    }
    logNativeImpressionEvent(EventName.CreativeLibraryLoadFailed, {
      context: 'campaign_builder',
      source: 'library_assets',
      statusCode: String(getHttpStatusFromError(libraryLoadError) ?? 'unknown'),
    });
  }, [isLibraryLoadError, libraryLoadError]);

  const draftItems = useWatch<FormType>({ name: formField }) as
    | Array<{ assetId: number; existing?: boolean; isSelected?: boolean }>
    | undefined;
  const draftItemByAssetId = useMemo(
    () => new Map((draftItems ?? []).map((item) => [item.assetId, item])),
    [draftItems],
  );
  // Every selected creative on the draft counts toward the "X / max" total,
  // including existing ones that may be paused. The count comes straight from
  // the form selection (not the async, date-filtered ad list), so it's stable
  // and instant. Active/paused awareness is being reworked in a follow-up PR.
  const existingDraftSelectedCount = useMemo(
    () => countSelectedCreatives(draftItems),
    [draftItems],
  );

  // Lookup keyed by numeric assetId so `handleAddSelected` can grab the
  // source asset's dimensions when stamping `aspectRatio` on logo additions.
  const libraryAssetById = useMemo(() => {
    type LibraryAsset = NonNullable<typeof libraryAssets>[number];
    const map = new Map<number, LibraryAsset>();
    (libraryAssets ?? []).forEach((asset) => {
      if (asset.assetId != null) {
        map.set(Number(asset.assetId), asset);
      }
    });
    return map;
  }, [libraryAssets]);

  const importableAssets = useMemo(() => {
    if (!libraryAssets) {
      return [];
    }
    return (
      libraryAssets
        .filter((asset) => {
          if (asset.isArchived) {
            return false;
          }
          // Image-only pool; logo + thumbnail drawers both register as IMAGE.
          if (asset.assetType !== AdAssetType.AdAssetTypeImage) {
            return false;
          }
          if (
            asset.contentModerationStatus != null &&
            !PICKABLE_MODERATION_STATES.includes(asset.contentModerationStatus)
          ) {
            return false;
          }
          // Per Figma: include the campaign's experience plus untagged assets.
          const universeOk =
            asset.universeId == null ||
            (campaignUniverseId != null && asset.universeId === campaignUniverseId);
          if (!universeOk) {
            return false;
          }
          // Logo drawer hides off-ratio images so the grid matches what
          // the upload tab would accept (logos render with object-fit:
          // contain, so off-ratio sources letterbox badly). Thumbnail
          // drawer keeps everything since tiles crop with object-fit:
          // cover.
          if (formField === FormField.LOGO_ASSETS && !isCompatibleWithLogoPlacement(asset)) {
            return false;
          }
          return true;
        })
        // Surface experience-specific assets ahead of generic (untagged)
        // ones so the campaign's own creatives are easy to find at the
        // top of the grid. Stable sort preserves the AMA-side createdAt
        // ordering within each bucket.
        .slice()
        .sort((a, b) => {
          const aIsExperienceSpecific =
            campaignUniverseId != null && a.universeId === campaignUniverseId;
          const bIsExperienceSpecific =
            campaignUniverseId != null && b.universeId === campaignUniverseId;
          if (aIsExperienceSpecific === bIsExperienceSpecific) {
            return 0;
          }
          return aIsExperienceSpecific ? -1 : 1;
        })
        // Skip assets without a numeric assetId; coercing to 0 would collide keys.
        .flatMap((asset) => {
          if (asset.assetId == null) {
            return [];
          }
          const assetId = Number(asset.assetId);
          const isOnDraft = draftItemByAssetId.has(assetId);
          return [
            {
              assetId,
              assetName: asset.assetName ?? '',
              isAlreadyOnDraft: isOnDraft,
              isAutoImported: false,
              // Existing campaign creatives (tracked on the form draft as
              // `existing`) lock so they can't be removed from this drawer.
              isLocked: Boolean(draftItemByAssetId.get(assetId)?.existing),
              // Show the post-Select state so users see a live preview of
              // their staged choice before committing. For on-draft tiles
              // that's the form value XOR the pending toggle; for new
              // tiles it's just whether they're staged to be added.
              isSelected: draftItemByAssetId.has(assetId)
                ? Boolean(draftItemByAssetId.get(assetId)?.isSelected) !==
                  pendingDraftToggleAssetIds.has(assetId)
                : selectedAssetIds.has(assetId),
            },
          ];
        })
    );
  }, [
    libraryAssets,
    campaignUniverseId,
    draftItemByAssetId,
    selectedAssetIds,
    pendingDraftToggleAssetIds,
    formField,
  ]);

  // Virtual tiles for the experience's auto-imported thumbnails, prepended so
  // they surface first (per Figma). Deduped against anything already
  // registered in the library or already on the draft, so they disappear once
  // "uploaded" — matching "show up first if not already uploaded; hidden once
  // they exist". Keyed by the same numeric assetId as library tiles so the
  // draft/selection plumbing below treats them identically.
  const autoImportedTiles = useMemo(() => {
    if (!isThumbnailField) {
      return [];
    }
    return (autoImportedAssetIds ?? []).flatMap((assetId) => {
      // Hide previews already registered in the library or already on the
      // draft so they disappear once added.
      if (libraryAssetById.has(assetId) || draftItemByAssetId.has(assetId)) {
        return [];
      }
      return [
        {
          assetId,
          assetName: '',
          isAlreadyOnDraft: false,
          isAutoImported: true,
          isLocked: false,
          isSelected: selectedAssetIds.has(assetId),
        },
      ];
    });
  }, [
    isThumbnailField,
    autoImportedAssetIds,
    libraryAssetById,
    draftItemByAssetId,
    selectedAssetIds,
  ]);

  // Every tile this tab stages onto the form is a normal library pick
  // (ADS_MANAGER). Auto-imported experience previews are no exception: by
  // the time they land here they've been registered into the library as
  // AD_CREATIVE_ASSET_SOURCE_UPLOAD assets (see handleAddSelected), so the
  // form item is identical to any other library tile.
  const buildAdditionItem = useCallback(
    (assetId: number) => {
      const sourceAsset = libraryAssetById.get(assetId);
      let aspectRatio: '1:1' | '3:1' | undefined;
      if (formField === FormField.LOGO_ASSETS) {
        // The transform hook reads `aspectRatio` from each logo item to
        // derive `logo_asset_aspect_width` (backend strict-checks 1 or 3).
        // Without it, library imports submit with width 0 and get rejected.
        const bucket = bucketLogoAspectRatio(sourceAsset?.width, sourceAsset?.height);
        if (bucket == null) {
          return null;
        }
        aspectRatio = bucket;
      }
      return {
        ...(aspectRatio != null && { aspectRatio }),
        assetId,
        creativeOrigin: 'library' as const,
        existing: false,
        isSelected: true,
        source: AssetSource.ADS_MANAGER,
      };
    },
    [formField, libraryAssetById],
  );

  // Net selected count after applying the pending toggles + new staged
  // additions. Used to gate further staging against `maxAllowedSelections`.
  const pendingNetDelta = useMemo(() => {
    let delta = selectedAssetIds.size;
    pendingDraftToggleAssetIds.forEach((id) => {
      delta += draftItemByAssetId.get(id)?.isSelected ? -1 : 1;
    });
    return delta;
  }, [selectedAssetIds, pendingDraftToggleAssetIds, draftItemByAssetId]);
  // Report the import-tab's pending contribution to the parent so the
  // upload tab can show the same "(X / max)" header total. Fire on every
  // shift; the parent batches it back into its own state.
  useEffect(() => {
    onPendingDeltaChange?.(pendingNetDelta);
  }, [pendingNetDelta, onPendingDeltaChange]);
  // The "X" in "X / max" — shared across both tabs and the gate for every
  // capacity check below. Combines committed form selections, this tab's
  // staged changes, and any in-flight uploads from the sibling tab.
  const unifiedSelectedCount = existingDraftSelectedCount + pendingNetDelta + pendingUploadCount;
  const hasPendingChanges = selectedAssetIds.size > 0 || pendingDraftToggleAssetIds.size > 0;
  // "Add creatives" understates the action when any staged toggle would flip a
  // currently-selected on-draft tile off — Select would remove that selection
  // from the campaign. Re-adding a previously deselected draft tile is still
  // additive, so it stays under "Add creatives".
  const hasPendingRemoval = useMemo(
    () =>
      Array.from(pendingDraftToggleAssetIds).some(
        (assetId) => draftItemByAssetId.get(assetId)?.isSelected,
      ),
    [pendingDraftToggleAssetIds, draftItemByAssetId],
  );

  const toggleSelection = (assetId: number) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
        return next;
      }
      if (unifiedSelectedCount >= maxAllowedSelections) {
        return prev;
      }
      next.add(assetId);
      return next;
    });
  };

  const toggleDraftSelection = (assetId: number) => {
    const draftItem = draftItemByAssetId.get(assetId);
    if (!draftItem) {
      return;
    }
    setPendingDraftToggleAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
        return next;
      }
      // Toggling a currently-deselected on-draft tile *adds* to the
      // selected count, so it has to respect the cap. Toggling a
      // currently-selected one only frees up a slot, so always allow it.
      const willBecomeSelected = !draftItem.isSelected;
      if (willBecomeSelected && unifiedSelectedCount >= maxAllowedSelections) {
        return prev;
      }
      next.add(assetId);
      return next;
    });
  };

  // Experience-preview tiles are live catalog IDs, not library assets yet. On
  // Add we register them (POST /v1/adCreatives) so they behave like any other
  // library pick: persist past this campaign, dedupe out of the auto-import row
  // next open, and back a real registered asset. Mirrors the upload tab's
  // add-time registration.
  //
  // Best-effort: a failure is logged but never blocks adding the asset to the
  // campaign (the catalog ID is valid on its own). Width/height come from the
  // decoded thumbnail bitmap — the 768x432 render the thumbnail service serves,
  // not the source's intrinsic size; AMA only requires real, non-fabricated
  // dimensions. Only Completed thumbnails are used; assets whose dimensions
  // can't be resolved are skipped rather than registered with placeholder dims.
  const registerAutoImportedSelections = useCallback(
    async (assetIds: number[]): Promise<void> => {
      if (assetIds.length === 0 || campaignUniverseId == null) {
        return;
      }
      try {
        const resolved = await Promise.all(
          assetIds.map(async (assetId) => {
            // A placeholder (returnPolicy=PlaceHolder) would decode to placeholder
            // dimensions, so gate on Completed in both the cache and the fallback.
            const cached = useThumbnailStore.getState().thumbnailsByAssetId[assetId]?.data;
            let imageUrl =
              cached?.state === ThumbnailResponseState.Completed ? cached.imageUrl : undefined;
            if (!imageUrl) {
              const { data } = await fetchThumbnailByAssetId(assetId);
              imageUrl = data.find(
                (thumbnail) =>
                  thumbnail.targetId === assetId &&
                  thumbnail.state === ThumbnailResponseState.Completed,
              )?.imageUrl;
            }
            const dimensions = imageUrl ? await getImageDimensionsFromUrl(imageUrl) : null;
            return dimensions == null ? null : { assetId, dimensions };
          }),
        );
        const registerable = resolved.flatMap((entry) =>
          entry == null
            ? []
            : [
                {
                  assetId: entry.assetId,
                  assetType: AdAssetType.AdAssetTypeImage,
                  height: entry.dimensions.height,
                  source: AdCreativeAssetSource.AdCreativeAssetSourceUpload,
                  width: entry.dimensions.width,
                  ...(campaignUniverseId > 0 && { universeId: campaignUniverseId }),
                },
              ],
        );
        if (registerable.length === 0) {
          return;
        }
        await batchRegisterAdCreativeAssets(registerable);
        // Refresh the library so the just-registered assets move out of the
        // auto-import row and render as ordinary (now-selected) library tiles.
        await queryClient.invalidateQueries({ queryKey: ['adCreatives'] });
      } catch (err) {
        CaptureException(err, {
          context: `registerAutoImportedSelections: failed to register ${assetIds.length} experience thumbnail(s)`,
        });
      }
    },
    [campaignUniverseId, queryClient],
  );

  const handleAddSelected = useCallback(() => {
    if (!hasPendingChanges) {
      return;
    }
    logNativeClickEvent(EventName.CampaignCreativeSourceSelected, {
      source: 'library',
    });
    const currentItems = getValues(formField) as Array<{
      aspectRatio?: string;
      assetId: number;
      creativeOrigin?: 'ai' | 'library' | 'upload';
      existing?: boolean;
      isSelected?: boolean;
      source?: AssetSource;
    }>;
    const itemsAfterToggles = currentItems.map((item) =>
      pendingDraftToggleAssetIds.has(item.assetId)
        ? { ...item, isSelected: !item.isSelected }
        : item,
    );
    // Dedup against the current draft so a staged tile can never re-add an
    // asset already on the form. Locked tiles can't be staged, so this is a
    // belt-and-suspenders guard.
    const existingAssetIds = new Set(currentItems.map((item) => item.assetId));
    const additions = Array.from(selectedAssetIds).flatMap((assetId) => {
      if (existingAssetIds.has(assetId)) {
        return [];
      }
      const item = buildAdditionItem(assetId);
      return item ? [item] : [];
    });
    logNativeClickEvent(EventName.CreativeLibraryAddToCampaign, {
      addedCount: String(additions.length),
      context: 'campaign_builder',
      selectedCount: String(selectedAssetIds.size),
      toggledCount: String(pendingDraftToggleAssetIds.size),
    });
    // Persist any newly-added experience previews to the library in the
    // background; this no-ops for ordinary library picks (already registered).
    // The helper swallows its own errors, so the trailing catch only guards
    // against an unexpected throw and keeps the promise from floating.
    const autoImportedToRegister = Array.from(selectedAssetIds).filter(
      (assetId) =>
        !existingAssetIds.has(assetId) &&
        autoImportedAssetIdSet.has(assetId) &&
        !libraryAssetById.has(assetId),
    );
    registerAutoImportedSelections(autoImportedToRegister).catch(CaptureException);
    // `as never` escapes RHF's narrowing on union-typed formField; element
    // shape above is compatible with both schemas.
    setValue(formField, [...itemsAfterToggles, ...additions] as never, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    trigger(formField);
    setSelectedAssetIds(new Set());
    setPendingDraftToggleAssetIds(new Set());
  }, [
    autoImportedAssetIdSet,
    buildAdditionItem,
    formField,
    getValues,
    hasPendingChanges,
    libraryAssetById,
    pendingDraftToggleAssetIds,
    registerAutoImportedSelections,
    selectedAssetIds,
    setValue,
    trigger,
  ]);

  const isAtSelectionLimit = unifiedSelectedCount >= maxAllowedSelections;
  const footerLabel = hasPendingRemoval
    ? translateCampaign('Action.Update')
    : translate('Action.AddCreatives');
  const shouldRenderInFooter = onFooterActionChange != null;

  useEffect(() => {
    if (!onFooterActionChange) {
      return;
    }
    onFooterActionChange({
      isDisabled: !hasPendingChanges,
      label: footerLabel,
      onClick: handleAddSelected,
    });
  }, [footerLabel, handleAddSelected, hasPendingChanges, onFooterActionChange]);

  useEffect(
    () => () => {
      onFooterActionChange?.(null);
    },
    [onFooterActionChange],
  );

  // Auto-imported experience previews lead the grid, followed by the library
  // pool. Both share the same tile shape so the renderer treats them alike.
  const allTiles = [...autoImportedTiles, ...importableAssets];

  const renderAssetGrid = () => {
    if (isFetchingLibrary || isFetchingAutoImported) {
      return (
        <div
          className='flex items-center justify-center padding-y-large'
          data-testid='import-tab-loading'>
          <ProgressCircle
            ariaLabel={translate('Description.LoadingLibrary')}
            size='Medium'
            variant='Indeterminate'
          />
        </div>
      );
    }
    if (allTiles.length === 0) {
      return (
        <p className='text-body-medium content-muted'>{translate('Description.NoLibraryAssets')}</p>
      );
    }
    return (
      <div className={`${tileStyles.tileGrid} grid gap-large`}>
        {allTiles.map(
          ({ assetId, assetName, isAlreadyOnDraft, isAutoImported, isLocked, isSelected }) => {
            // Already-selected (or staged-as-selected) tiles stay clickable
            // so the user can un-stage; only at-cap unstaged tiles disable.
            const isMaxSelectionDisabled =
              !isSelected && !isLocked && unifiedSelectedCount >= maxAllowedSelections;
            const isInteractionDisabled = isLocked || isMaxSelectionDisabled;
            // Locked tiles explain why they can't be removed; auto-imported
            // tiles get the "Auto-imported thumbnail" hover label from Figma.
            let tooltipTitle: string | null = null;
            if (isLocked) {
              // These lock messages live in the Campaign namespace, not
              // CreativeLibrary, so they must resolve via translateCampaign.
              tooltipTitle = translateCampaign(
                formField === FormField.THUMBNAILS
                  ? 'Description.CreativeCannotRemovePublished'
                  : 'Description.LogoCannotRemovePublished',
              );
            } else if (isMaxSelectionDisabled) {
              tooltipTitle =
                formField === FormField.THUMBNAILS
                  ? translateCampaign('Description.MaxThumbnailReached')
                  : translate('Description.LogoDeselectFirst');
            } else if (isAutoImported) {
              tooltipTitle = translate('Description.AutoImportedThumbnail');
            }

            // aria-disabled + guarded handlers (instead of native `disabled`)
            // so TooltipTrigger still receives hover events on locked tiles.
            const tile = (
              <button
                aria-disabled={isInteractionDisabled || undefined}
                aria-label={assetName || translate('Label.Image')}
                aria-pressed={isSelected}
                className={`${tileStyles.tileButton} width-full relative radius-medium transition-colors ${
                  isInteractionDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${isSelected ? tileStyles.selectedRing : ''}`}
                onClick={() => {
                  if (isInteractionDisabled) {
                    return;
                  }
                  if (isAlreadyOnDraft) {
                    toggleDraftSelection(assetId);
                  } else {
                    toggleSelection(assetId);
                  }
                }}
                tabIndex={isInteractionDisabled ? -1 : 0}
                type='button'>
                <AssetTileImage
                  alt={assetName}
                  assetId={assetId}
                  containerClassName={getTileImageClass({ isLocked, isMaxSelectionDisabled })}
                />
                <div aria-hidden className={tileStyles.hoverOverlay} />
                {isLocked && <CreativeLockBadge />}
              </button>
            );

            // Always render the same `<div>` grid cell so tooltip and
            // non-tooltip tiles size identically — `Tooltip.Root` emits no DOM
            // and `TooltipTrigger asChild` merges onto the button, so a bare
            // tooltip tile would otherwise become a different-shaped grid item
            // than the div-wrapped plain tiles and misalign in the grid.
            return (
              <div key={assetId}>
                {tooltipTitle != null ? (
                  <Tooltip
                    contentClassName={FOUNDATION_TOOLTIP_BODY_SMALL_CLASS}
                    position='top-center'
                    title={tooltipTitle}>
                    <TooltipTrigger asChild>{tile}</TooltipTrigger>
                  </Tooltip>
                ) : (
                  tile
                )}
              </div>
            );
          },
        )}
      </div>
    );
  };

  return (
    <div className='flex flex-col gap-large'>
      <div className='flex flex-col gap-xsmall'>
        <h2 className='margin-[0px] text-heading-small content-emphasis'>
          {translate('Heading.AssetLibrary')}
        </h2>
        <p className='margin-[0px] text-body-medium content-default'>
          {translate('Description.AssetLibraryHelper')}
        </p>
      </div>

      <div className='flex flex-col width-full'>
        <div className='flex items-center justify-between padding-y-medium gap-medium width-full'>
          <p className='text-label-medium content-emphasis margin-[0px]'>
            {translate('Label.MediaWithCount', {
              max: String(maxAllowedSelections),
              selected: String(unifiedSelectedCount),
            })}
          </p>
          {!shouldRenderInFooter ? (
            <Button
              isDisabled={!hasPendingChanges}
              onClick={handleAddSelected}
              size='Medium'
              variant='Standard'>
              {footerLabel}
            </Button>
          ) : null}
        </div>
        <Divider />
        <div className='padding-top-medium'>{renderAssetGrid()}</div>
      </div>

      {isAtSelectionLimit && (
        <p className='text-body-small content-muted margin-[0px]'>
          {formField === FormField.THUMBNAILS
            ? translateCampaign('Description.MaxThumbnailReached')
            : translate('Description.LogoDeselectFirst')}
        </p>
      )}
    </div>
  );
};

export default CreativeImportTab;
