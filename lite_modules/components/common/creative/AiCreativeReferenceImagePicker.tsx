import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Icon,
  IconButton,
  Media,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ProgressCircle,
  TextInput,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styles from '@components/common/creative/AiCreativeReferenceImagePicker.module.css';
import { FOUNDATION_TOOLTIP_BODY_SMALL_CLASS } from '@components/common/creative/tooltipStyles';
import {
  AI_CREATIVE_REFERENCE_IMAGE_TYPES,
  AI_CREATIVE_REFERENCE_MODEL_TYPES,
  isAiCreativeReferenceAssetLikelyApproved,
  isSupportedAiCreativeReferenceAssetType,
} from '@constants/aiCreatives';
import { TranslationNamespace } from '@constants/localization';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getAdCreatives } from '@services/ads/adCreativeAssetService';
import { getAssetDetails } from '@services/ads/adIntegrationCampaignService';
import { hasUsePermissionForAssets } from '@services/ads/assetPermissionService';
import { useAppStore } from '@stores/appStoreProvider';
import { useThumbnailStore } from '@stores/thumbnailStoreProvider';
import { type AppStoreStateType } from '@type/appStore';
import { CaptureException } from '@utils/error';

/** Maximum number of reference assets a user can select. */
const MAX_REFERENCE_ASSETS = 5;

const REFERENCE_APPROVED_STATUS = 'approved';

interface AiCreativeReferenceSelectionProps {
  disabled?: boolean;
  onChange: (assetIds: number[]) => void;
  selectedAssetIds: number[];
}

interface AiCreativeReferenceAddControlProps extends AiCreativeReferenceSelectionProps {
  error?: string;
  groupId?: number;
}

interface AssetIdPreview {
  assetId: number;
  name: string;
}

const parseAssetId = (input: string): number | null => {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const id = Number(trimmed);
  if (!Number.isFinite(id) || id <= 0 || !Number.isInteger(id)) {
    return null;
  }
  return id;
};

const REFERENCE_ALLOWED_TYPES: ReadonlySet<string> = new Set([
  ...AI_CREATIVE_REFERENCE_IMAGE_TYPES,
  ...AI_CREATIVE_REFERENCE_MODEL_TYPES,
]);

interface ReferenceThumbnailProps {
  assetId: number;
  /** Radius/extra classes for the square media container (e.g. `radius-medium`). */
  containerClassName?: string;
}

const ReferenceThumbnail: FC<ReferenceThumbnailProps> = ({ assetId, containerClassName = '' }) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const data = useThumbnailStore((state) => state.thumbnailsByAssetId[assetId]?.data);
  const isLoading = useThumbnailStore(
    (state) => state.thumbnailsByAssetId[assetId]?.isLoading ?? false,
  );
  const isError = useThumbnailStore(
    (state) => state.thumbnailsByAssetId[assetId]?.isError ?? false,
  );
  const getThumbnailByAssetId = useThumbnailStore((state) => state.getThumbnailByAssetId);

  useEffect(() => {
    getThumbnailByAssetId(assetId);
  }, [assetId, getThumbnailByAssetId]);

  const placeholderClassName =
    `aspect-1-1 clip flex items-center justify-center bg-surface-200 ${containerClassName}`.trim();

  if (isLoading) {
    return (
      <div className={placeholderClassName}>
        <ProgressCircle
          ariaLabel={translate('Description.LoadingLibrary')}
          size='Small'
          variant='Indeterminate'
        />
      </div>
    );
  }

  if (isError || !data?.imageUrl) {
    return (
      <div className={placeholderClassName}>
        <Icon className='content-muted' name='icon-regular-image-circle-slash' size='Small' />
      </div>
    );
  }

  return (
    <Media
      alt={translate('Label.Image')}
      aspectRatio='1:1'
      containerClassName={`bg-surface-200 ${containerClassName}`.trim()}
      src={data.imageUrl}
    />
  );
};

/** Inline row of selected reference thumbnails — render above the prompt textarea. */
export const AiCreativeReferenceThumbnailsRow: FC<AiCreativeReferenceSelectionProps> = ({
  disabled = false,
  onChange,
  selectedAssetIds,
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);

  if (selectedAssetIds.length === 0) {
    return null;
  }

  return (
    <div
      className='flex wrap gap-small margin-bottom-medium width-full'
      data-testid='ai-reference-thumbnails-row'>
      {selectedAssetIds.map((assetId) => (
        <div className={`${styles.referenceThumbnail} shrink-0 width-[48px]`} key={assetId}>
          <ReferenceThumbnail assetId={assetId} containerClassName='radius-medium' />
          <div className={`${styles.referenceThumbnailRemove} absolute top-[2px] right-[2px]`}>
            <IconButton
              ariaLabel={translate('Action.Remove')}
              icon='icon-regular-x-small'
              isCircular
              isDisabled={disabled}
              onClick={() => onChange(selectedAssetIds.filter((id) => id !== assetId))}
              size='XSmall'
              variant='OverMedia'
            />
          </div>
        </div>
      ))}
    </div>
  );
};

interface LibraryTileImageProps {
  assetId: number;
}

const LibraryTileImage: FC<LibraryTileImageProps> = ({ assetId }) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const data = useThumbnailStore((state) => state.thumbnailsByAssetId[assetId]?.data);
  const isLoading = useThumbnailStore(
    (state) => state.thumbnailsByAssetId[assetId]?.isLoading ?? false,
  );
  const isError = useThumbnailStore(
    (state) => state.thumbnailsByAssetId[assetId]?.isError ?? false,
  );
  const getThumbnailByAssetId = useThumbnailStore((state) => state.getThumbnailByAssetId);

  useEffect(() => {
    getThumbnailByAssetId(assetId);
  }, [assetId, getThumbnailByAssetId]);

  if (isLoading) {
    return (
      <div className='aspect-16-9 radius-medium clip flex items-center justify-center bg-surface-200'>
        <ProgressCircle
          ariaLabel={translate('Description.LoadingLibrary')}
          size='Small'
          variant='Indeterminate'
        />
      </div>
    );
  }

  if (isError || !data?.imageUrl) {
    return (
      <div className='aspect-16-9 radius-medium clip flex items-center justify-center bg-surface-200'>
        <Icon className='content-muted' name='icon-regular-image' size='Large' />
      </div>
    );
  }

  return (
    <Media
      alt={translate('Label.Image')}
      aspectRatio='16:9'
      containerClassName='radius-medium bg-surface-200'
      src={data.imageUrl}
    />
  );
};

/**
 * "+" affordance, popover menu, and the library / asset-ID dialogs.
 * Render in the prompt card footer (left side per Figma).
 */
export const AiCreativeReferenceAddControl: FC<AiCreativeReferenceAddControlProps> = ({
  disabled = false,
  error,
  groupId,
  onChange,
  selectedAssetIds,
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const adAccountId = useAppStore((state: AppStoreStateType) => state.appData.adAccountInfo?.id);
  const authenticatedUser = useAuthenticatedUser();
  // Matches the generate flow: ads-management-api checks USE against the
  // authenticated user (SUBJECT_TYPE_USER), never the group, so the fail-fast
  // ownership check here uses the same subject regardless of group context.
  const userId = authenticatedUser?.id ?? null;

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isAssetIdOpen, setIsAssetIdOpen] = useState<boolean>(false);
  const [librarySearch, setLibrarySearch] = useState<string>('');
  const [stagedAssetIds, setStagedAssetIds] = useState<Set<number>>(
    () => new Set(selectedAssetIds),
  );
  const [assetIdSearchInput, setAssetIdSearchInput] = useState<string>('');
  const [assetIdPreview, setAssetIdPreview] = useState<AssetIdPreview | null>(null);
  const [assetIdPreviewError, setAssetIdPreviewError] = useState<string | null>(null);
  const [isLoadingAssetIdPreview, setIsLoadingAssetIdPreview] = useState<boolean>(false);
  const [stagedAssetIdEntries, setStagedAssetIdEntries] = useState<AssetIdPreview[]>([]);
  const latestPreviewRequestIdRef = useRef(0);

  const fetchAssetIdPreviewRef = useRef(
    debounce(
      async (
        id: number,
        requestId: number,
        translateCreativeFn: (key: string) => string,
        translateAccountFn: (key: string) => string,
        checkPermissionUserId: number | null,
      ) => {
        setIsLoadingAssetIdPreview(true);
        setAssetIdPreviewError(null);
        setAssetIdPreview(null);
        const isStale = () => requestId !== latestPreviewRequestIdRef.current;
        try {
          const assets = await getAssetDetails([id]);
          if (isStale()) {
            return;
          }
          if (assets.length === 0) {
            setAssetIdPreviewError(translateAccountFn('Message.AssetNotFound'));
          } else {
            const asset = assets[0];
            if (!isSupportedAiCreativeReferenceAssetType(asset.type)) {
              setAssetIdPreviewError(translateCreativeFn('Message.UnsupportedReferenceAssetType'));
            } else if (!isAiCreativeReferenceAssetLikelyApproved(asset)) {
              // Fail-open moderation pre-check mirroring AMA's IsApproved gate:
              // block only on a clear not-approved signal so the user sees it here
              // instead of a generate-time 400. Uses the already-fetched asset
              // details, so no extra request.
              setAssetIdPreviewError(translateCreativeFn('Message.ReferenceAssetNotApproved'));
            } else {
              // Fail-fast USE-permission check against the same authority the
              // generate call uses. Skipped only when we don't know the user
              // (unauthenticated render) — the generate call remains the
              // backstop. Any thrown RPC failure lands in the catch below and
              // surfaces the same ownership message.
              let hasUsePermission = true;
              if (checkPermissionUserId != null) {
                hasUsePermission = await hasUsePermissionForAssets(checkPermissionUserId, [
                  asset.id,
                ]);
                if (isStale()) {
                  return;
                }
              }
              if (hasUsePermission) {
                setAssetIdPreview({
                  assetId: asset.id,
                  name: asset.name,
                });
              } else {
                setAssetIdPreviewError(translateCreativeFn('Message.AssetLoadErrorCheckOwnership'));
              }
            }
          }
        } catch (fetchError) {
          if (isStale()) {
            return;
          }
          CaptureException(fetchError, {
            context: 'AiCreativeReferenceAddControl fetch asset preview',
          });
          setAssetIdPreviewError(translateCreativeFn('Message.AssetLoadErrorCheckOwnership'));
        } finally {
          if (!isStale()) {
            setIsLoadingAssetIdPreview(false);
          }
        }
      },
      500,
    ),
  );

  useEffect(() => {
    if (!isAssetIdOpen) {
      return;
    }

    const id = parseAssetId(assetIdSearchInput);
    if (id === null) {
      latestPreviewRequestIdRef.current += 1;
      setAssetIdPreview(null);
      setAssetIdPreviewError(null);
      setIsLoadingAssetIdPreview(false);
      fetchAssetIdPreviewRef.current.cancel();
      return;
    }

    const requestId = latestPreviewRequestIdRef.current + 1;
    latestPreviewRequestIdRef.current = requestId;
    fetchAssetIdPreviewRef.current(id, requestId, translate, translateAccount, userId);
  }, [assetIdSearchInput, isAssetIdOpen, translate, translateAccount, userId]);

  useEffect(
    () => () => {
      fetchAssetIdPreviewRef.current.cancel();
    },
    [],
  );

  const isAtLimit = selectedAssetIds.length >= MAX_REFERENCE_ASSETS;

  const {
    data: libraryResponse,
    isError: isLibraryError,
    isFetching: isFetchingLibrary,
  } = useQuery({
    enabled: isLibraryOpen && adAccountId != null,
    queryFn: () =>
      groupId === undefined ? getAdCreatives(false) : getAdCreatives(false, { groupId }),
    queryKey: ['adCreatives', adAccountId, groupId, false],
    select: (response) => response.assets,
    staleTime: 0,
  });

  const referenceAssets = useMemo(() => {
    if (!libraryResponse) {
      return [];
    }
    return libraryResponse.filter((asset) => {
      if (asset.isArchived) {
        return false;
      }
      if (!asset.assetType || !REFERENCE_ALLOWED_TYPES.has(asset.assetType)) {
        return false;
      }
      if (asset.contentModerationStatus !== REFERENCE_APPROVED_STATUS) {
        return false;
      }
      if (asset.assetId == null) {
        return false;
      }
      return true;
    });
  }, [libraryResponse]);

  const filteredReferenceAssets = useMemo(() => {
    const query = librarySearch.trim().toLowerCase();
    if (query === '') {
      return referenceAssets;
    }
    return referenceAssets.filter((asset) => {
      const assetId = String(asset.assetId ?? '');
      const assetName = (asset.assetName ?? '').toLowerCase();
      return assetName.includes(query) || assetId.includes(query);
    });
  }, [librarySearch, referenceAssets]);

  const openLibraryDialog = useCallback(() => {
    setLibrarySearch('');
    setStagedAssetIds(new Set(selectedAssetIds));
    setIsLibraryOpen(true);
  }, [selectedAssetIds]);

  const openAssetIdDialog = useCallback(() => {
    setAssetIdSearchInput('');
    setAssetIdPreview(null);
    setAssetIdPreviewError(null);
    setIsLoadingAssetIdPreview(false);
    setStagedAssetIdEntries([]);
    latestPreviewRequestIdRef.current += 1;
    fetchAssetIdPreviewRef.current.cancel();
    setIsAssetIdOpen(true);
  }, []);

  // Total reference slots consumed = already-selected (outside the dialog) plus
  // what the user has staged in this dialog session. The 5-asset cap is shared.
  const stagedTotalCount = selectedAssetIds.length + stagedAssetIdEntries.length;
  const isPreviewAlreadyChosen =
    assetIdPreview != null &&
    (selectedAssetIds.includes(assetIdPreview.assetId) ||
      stagedAssetIdEntries.some((entry) => entry.assetId === assetIdPreview.assetId));

  const canStagePreview =
    assetIdPreview != null && !isPreviewAlreadyChosen && stagedTotalCount < MAX_REFERENCE_ASSETS;

  const handleStagePreview = useCallback(() => {
    if (disabled || assetIdPreview == null) {
      return;
    }
    const previewToStage = assetIdPreview;
    const isAlreadyChosen =
      selectedAssetIds.includes(previewToStage.assetId) ||
      stagedAssetIdEntries.some((entry) => entry.assetId === previewToStage.assetId);
    if (isAlreadyChosen) {
      return;
    }
    if (selectedAssetIds.length + stagedAssetIdEntries.length >= MAX_REFERENCE_ASSETS) {
      return;
    }
    setStagedAssetIdEntries((prev) => [...prev, previewToStage]);
    // Clearing the input resets the preview via the lookup effect.
    setAssetIdSearchInput('');
  }, [assetIdPreview, disabled, selectedAssetIds, stagedAssetIdEntries]);

  const handleRemoveStagedAsset = useCallback((assetId: number) => {
    setStagedAssetIdEntries((prev) => prev.filter((entry) => entry.assetId !== assetId));
  }, []);

  const handleClearStagedAssets = useCallback(() => {
    setStagedAssetIdEntries([]);
  }, []);

  const handleAssetIdConfirm = useCallback(() => {
    if (stagedAssetIdEntries.length === 0) {
      return;
    }
    onChange([...selectedAssetIds, ...stagedAssetIdEntries.map((entry) => entry.assetId)]);
    setIsAssetIdOpen(false);
  }, [onChange, selectedAssetIds, stagedAssetIdEntries]);

  const handleLibraryToggle = (assetId: number) => {
    setStagedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
        return next;
      }
      if (next.size >= MAX_REFERENCE_ASSETS) {
        return prev;
      }
      next.add(assetId);
      return next;
    });
  };

  const handleLibraryConfirm = () => {
    onChange(Array.from(stagedAssetIds));
    setIsLibraryOpen(false);
  };

  const renderLibraryGrid = () => {
    if (isFetchingLibrary) {
      return (
        <div className='flex items-center justify-center padding-y-large'>
          <ProgressCircle
            ariaLabel={translate('Description.LoadingLibrary')}
            size='Medium'
            variant='Indeterminate'
          />
        </div>
      );
    }
    if (isLibraryError) {
      return (
        <p className='text-body-medium content-system-alert margin-[0px]' role='alert'>
          {translate('Message.GenericError')}
        </p>
      );
    }
    if (filteredReferenceAssets.length === 0) {
      return (
        <p className='text-body-medium content-muted margin-[0px]'>
          {translate('Description.NoLibraryAssets')}
        </p>
      );
    }

    return (
      <div className={styles.libraryTileGrid}>
        {filteredReferenceAssets.map((asset) => {
          const assetId = Number(asset.assetId);
          const isSelected = stagedAssetIds.has(assetId);
          const isTileDisabled = !isSelected && stagedAssetIds.size >= MAX_REFERENCE_ASSETS;
          return (
            <button
              aria-disabled={isTileDisabled || undefined}
              aria-label={asset.assetName ?? translate('Label.Image')}
              aria-pressed={isSelected}
              className={`${styles.libraryTileButton} width-full transition-colors ${
                isSelected ? styles.libraryTileSelectedRing : ''
              } ${isTileDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={isTileDisabled}
              key={assetId}
              onClick={() => handleLibraryToggle(assetId)}
              type='button'>
              <div className='relative width-full'>
                <LibraryTileImage assetId={assetId} />
                <div aria-hidden className={styles.libraryTileHoverOverlay} />
              </div>
              <div className='flex flex-col gap-xxsmall min-width-0 padding-top-small width-full'>
                <span className={`${styles.libraryTileLabel} text-title-small content-emphasis`}>
                  {asset.assetName ?? translate('Label.Image')}
                </span>
                <span className={`${styles.libraryTileLabel} text-body-small content-muted`}>
                  {String(assetId)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderAddReferenceControl = () => {
    const addReferenceButton = (
      <IconButton
        ariaLabel={translate('Action.AddReference')}
        icon='icon-regular-plus-large'
        isCircular
        isDisabled={disabled || isAtLimit}
        size='Medium'
        variant='Standard'
      />
    );

    if (isAtLimit) {
      return (
        <Tooltip
          contentClassName={FOUNDATION_TOOLTIP_BODY_SMALL_CLASS}
          position='top-center'
          title={translate('Description.ReferenceLimitReached')}>
          <TooltipTrigger asChild>
            <span className='inline-flex shrink-0'>{addReferenceButton}</span>
          </TooltipTrigger>
        </Tooltip>
      );
    }

    return (
      <Popover onOpenChange={setMenuOpen} open={menuOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          {addReferenceButton}
        </PopoverTrigger>
        <PopoverContent
          align='start'
          ariaLabel={translate('Label.AddReferenceOptions')}
          side='bottom'
          sideOffset={8}>
          <Menu className='flex flex-col gap-xxsmall padding-small'>
            <MenuItem
              onSelect={() => {
                setMenuOpen(false);
                openLibraryDialog();
              }}
              title={translate('Action.ImportFromLibrary')}
              value='import-from-library'
            />
            <MenuItem
              onSelect={() => {
                setMenuOpen(false);
                openAssetIdDialog();
              }}
              title={translate('Label.AddByAssetId')}
              value='add-asset-id'
            />
          </Menu>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <>
      <div className='flex flex-col gap-xsmall'>
        {renderAddReferenceControl()}

        {error != null && error !== '' ? (
          <p className='text-caption-small content-system-alert margin-[0px]' role='alert'>
            {error}
          </p>
        ) : null}
      </div>

      <Dialog
        closeLabel={translate('Action.Close')}
        hasCloseAffordance={false}
        hasMarginBottom={false}
        hasMarginTop={false}
        isModal
        onOpenChange={(open) => {
          if (!open) {
            setIsLibraryOpen(false);
          }
        }}
        open={isLibraryOpen}
        size='Large'>
        <DialogContent className={`${styles.libraryDialogContent} flex flex-col width-full`}>
          <div className={styles.libraryDialogHeader}>
            <DialogTitle className='margin-[0px] shrink text-heading-small content-emphasis'>
              {translate('Action.ImportFromLibrary')}
            </DialogTitle>
            <IconButton
              ariaLabel={translate('Action.Close')}
              icon='icon-regular-x'
              onClick={() => setIsLibraryOpen(false)}
              size='Medium'
              variant='Utility'
            />
          </div>
          <DialogBody
            className={`${styles.libraryDialogBody} flex flex-col fill min-height-0 clip`}>
            <div className='flex flex-col shrink-0 gap-medium padding-top-small padding-x-large padding-bottom-xsmall'>
              <TextInput
                aria-label={translate('Label.Search')}
                leadingIconName='icon-regular-magnifying-glass'
                onChange={(event) => setLibrarySearch(event.target.value)}
                placeholder={translate('Label.FindByNameOrId')}
                size='Medium'
                value={librarySearch}
              />
              <div className='flex shrink-0 items-center justify-between gap-medium width-full'>
                <p className='text-label-medium content-emphasis margin-[0px]'>
                  {translate('Label.MediaWithCount', {
                    max: String(MAX_REFERENCE_ASSETS),
                    selected: String(stagedAssetIds.size),
                  })}
                </p>
                <Button
                  isDisabled={stagedAssetIds.size === 0}
                  onClick={() => setStagedAssetIds(new Set())}
                  size='Medium'
                  variant='Utility'>
                  {translate('Action.ClearAll')}
                </Button>
              </div>
            </div>
            <div className='fill min-height-0 clip-x scroll-y padding-top-small padding-x-large padding-bottom-large'>
              {renderLibraryGrid()}
            </div>
          </DialogBody>
          <DialogFooter className={styles.libraryDialogFooter}>
            <div className='flex gap-small justify-end width-full'>
              <Button
                isDisabled={stagedAssetIds.size === 0}
                onClick={handleLibraryConfirm}
                size='Medium'
                variant='Emphasis'>
                {translate('Action.AddAssets')}
              </Button>
              <Button onClick={() => setIsLibraryOpen(false)} size='Medium' variant='Standard'>
                {translate('Action.Close')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        closeLabel={translate('Action.Close')}
        hasCloseAffordance={false}
        hasMarginBottom={false}
        hasMarginTop={false}
        isModal
        onOpenChange={(open) => {
          if (!open) {
            fetchAssetIdPreviewRef.current.cancel();
            latestPreviewRequestIdRef.current += 1;
            setIsAssetIdOpen(false);
          }
        }}
        open={isAssetIdOpen}
        size='Small'>
        <DialogContent className='flex flex-col !max-width-[480px] !min-width-[376px] width-full'>
          <div className={styles.assetIdDialogHeader}>
            <DialogTitle className='margin-[0px] shrink text-heading-small content-emphasis'>
              {translate('Heading.AddAssetId')}
            </DialogTitle>
            <IconButton
              ariaLabel={translate('Action.Close')}
              icon='icon-regular-x'
              onClick={() => setIsAssetIdOpen(false)}
              size='Medium'
              variant='Utility'
            />
          </div>
          <DialogBody className='flex flex-col gap-medium padding-top-xsmall padding-x-large padding-bottom-medium'>
            <p className='text-body-medium content-default margin-[0px]'>
              {translate('Description.AddAssetIdFromDevelopmentItems')}
            </p>
            <div className='relative flex flex-col gap-xsmall width-full'>
              <div className='flex flex-col gap-xsmall width-full'>
                <div className='relative width-full'>
                  <TextInput
                    aria-label={translate('Label.AssetId')}
                    className='width-full'
                    hasError={assetIdPreviewError != null}
                    helperText={assetIdPreviewError ?? undefined}
                    inputMode='numeric'
                    onChange={(event) => setAssetIdSearchInput(event.target.value)}
                    placeholder={translate('Label.AssetId')}
                    size='Medium'
                    value={assetIdSearchInput}
                  />
                  {isLoadingAssetIdPreview ? (
                    <div className='absolute top-0 bottom-0 right-[12px] height-[40px] flex items-center pointer-events-none'>
                      <ProgressCircle
                        ariaLabel={translate('Description.LoadingLibrary')}
                        size='Small'
                        variant='Indeterminate'
                      />
                    </div>
                  ) : null}
                </div>
              </div>
              {assetIdPreview != null && !isLoadingAssetIdPreview ? (
                <div className={styles.assetIdPreviewInline}>
                  <Menu
                    className='bg-surface-200 radius-medium'
                    data-testid='asset-id-preview-menu'>
                    <MenuSection>
                      <MenuItem
                        description={String(assetIdPreview.assetId)}
                        disabled={!canStagePreview}
                        leading={
                          <div className='shrink-0 width-[20px]'>
                            <ReferenceThumbnail
                              assetId={assetIdPreview.assetId}
                              containerClassName='radius-small'
                            />
                          </div>
                        }
                        onSelect={handleStagePreview}
                        title={assetIdPreview.name}
                        value={String(assetIdPreview.assetId)}
                      />
                    </MenuSection>
                  </Menu>
                </div>
              ) : null}
            </div>
            {stagedAssetIdEntries.length > 0 ? (
              <div className='flex flex-col gap-small width-full'>
                <div className='flex items-center justify-start gap-small width-full'>
                  <p className='text-label-small content-muted margin-[0px]'>
                    {translateCampaign('Description.SelectedCount', {
                      max: String(MAX_REFERENCE_ASSETS),
                      selected: String(stagedTotalCount),
                    })}
                  </p>
                  <Button onClick={handleClearStagedAssets} size='Small' variant='Utility'>
                    {translate('Action.ClearAll')}
                  </Button>
                </div>
                <div className={styles.stagedList}>
                  {stagedAssetIdEntries.map((entry) => (
                    <div className={styles.stagedRow} key={entry.assetId}>
                      <div className='shrink-0 width-[40px]'>
                        <ReferenceThumbnail
                          assetId={entry.assetId}
                          containerClassName='radius-medium'
                        />
                      </div>
                      <div className='flex flex-col gap-xxsmall min-width-0 grow'>
                        <span
                          className={`${styles.stagedRowLabel} text-body-medium content-default`}>
                          {entry.name}
                        </span>
                        <span className={`${styles.stagedRowLabel} text-body-small content-muted`}>
                          {String(entry.assetId)}
                        </span>
                      </div>
                      <button
                        aria-label={translate('Action.Remove')}
                        className={styles.stagedRowRemove}
                        onClick={() => handleRemoveStagedAsset(entry.assetId)}
                        type='button'>
                        <Icon
                          className='content-muted'
                          name='icon-regular-trash-can'
                          size='Medium'
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </DialogBody>
          <DialogFooter className={styles.assetIdDialogFooter}>
            <div className='flex gap-small justify-end width-full'>
              <Button
                isDisabled={stagedAssetIdEntries.length === 0}
                onClick={handleAssetIdConfirm}
                size='Medium'
                variant='Emphasis'>
                {translateMisc('Action.Add')}
              </Button>
              <Button onClick={() => setIsAssetIdOpen(false)} size='Medium' variant='Standard'>
                {translateMisc('Action.Cancel')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
