import { AdIntegrationPlacement } from '@rbx/client-ads-management-api/v1';
import {
  Button,
  IconButton,
  ProgressCircle,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { AssetThumbnailSize, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Label, TextField, Typography } from '@rbx/ui';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useAdIntegrationStatusLabelStyles from '@components/adIntegrations/adIntegrationStatusLabel.styles';
import useAdIntegrationAssetsDrawerStyles from '@components/adIntegrations/assetsDrawer/AdIntegrationAssetsDrawer.styles';
import AdIntegrationAssetsTable, {
  PendingAsset,
} from '@components/adIntegrations/assetsDrawer/AdIntegrationAssetsTable';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import UniverseFilterAvatar from '@components/common/UniverseFilterAvatar';
import { isSupportedAdIntegrationAssetType } from '@constants/adIntegrations';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getAssetDetails } from '@services/ads/adIntegrationCampaignService';
import { getUniverses } from '@services/ads/getUniversesService';
import { AdIntegrationFormMode } from '@type/adIntegrations';
import { parseResponseErrorToAMAError } from '@type/errorResponse';
import { CaptureException } from '@utils/error';

interface AdIntegrationAssetsDrawerProps {
  campaignId?: string;
  campaignInfoHeader?: AdIntegrationAssetsDrawerCampaignInfoHeader;
  campaignStartTimestampMs?: number;
  disableSave?: boolean;
  mode?: AdIntegrationFormMode;
  onClose: () => void;
  onPendingAdditionsChange?: (assetIds: number[]) => void;
  onSavePlacements?: (additions: number[], removals: string[]) => Promise<void>;
  open: boolean;
  placements: AdIntegrationPlacement[];
  universeId?: number;
  userId?: number;
}

export interface AdIntegrationAssetsDrawerCampaignInfoHeader {
  advertiserName: string;
  campaignId: string;
  campaignName: string;
  /** Formatted weighted CPTV (e.g. "$0.49"). Undefined when revenue share is disabled/unavailable. */
  cptvDisplay?: string;
  endDate: string;
  experienceName: string;
  experienceThumbnailUrl?: string;
  /** Formatted maximum revenue share cost (e.g. "$6,837.00"). Undefined when revenue share is disabled/unavailable. */
  maxCostDisplay?: string;
  registrationDate: string;
  startDate: string;
  statusLabel: string;
  statusTone: 'active' | 'disabled' | 'important' | 'notice';
}

interface CreatorIdentity {
  id?: number;
  type?: string;
}

interface AssetPreview {
  assetId: number;
  assetType?: string;
  name: string;
}

const normalizeCreatorType = (type?: string): string | undefined => type?.trim().toLowerCase();

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

const AdIntegrationAssetsDrawer = ({
  campaignId,
  campaignInfoHeader,
  campaignStartTimestampMs,
  disableSave = false,
  mode = 'edit',
  onClose,
  onPendingAdditionsChange,
  onSavePlacements,
  open,
  placements,
  universeId,
  userId,
}: AdIntegrationAssetsDrawerProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: {
      addAssetSection,
      campaignIdRow,
      campaignInfoColumn,
      campaignInfoExperienceName,
      campaignInfoExperienceValue,
      campaignInfoGrid,
      campaignInfoItem,
      campaignInfoLabel,
      campaignInfoStatusValue,
      campaignInfoValue,
      previewCard,
      previewCardDetails,
      previewCardText,
      previewCardThumbnail,
      previewCardThumbnailImage,
    },
  } = useAdIntegrationAssetsDrawerStyles();
  const {
    classes: {
      labelRoot,
      statusCircleActive,
      statusCircleDisabled,
      statusCircleImportant,
      statusCircleNotice,
    },
  } = useAdIntegrationStatusLabelStyles();

  const [assetIdInput, setAssetIdInput] = useState<string>('');
  const [pendingAdditions, setPendingAdditions] = useState<PendingAsset[]>([]);
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [assetPreview, setAssetPreview] = useState<AssetPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [universeCreator, setUniverseCreator] = useState<CreatorIdentity | undefined>(undefined);
  const pendingIdSequence = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    if (!universeId) {
      setUniverseCreator(undefined);
    } else {
      getUniverses([universeId])
        .then((response) => {
          if (!cancelled) {
            const creator = response.data?.[0]?.creator;
            setUniverseCreator(
              creator == null
                ? undefined
                : {
                    id: creator.id,
                    type: creator.type,
                  },
            );
          }
        })
        .catch(() => {
          // Universe creator lookup is best-effort; validation still works against userId
        });
    }

    return () => {
      cancelled = true;
    };
  }, [universeId]);

  const hasPendingChanges = pendingAdditions.length > 0 || pendingRemovals.size > 0;
  const canSave = hasPendingChanges && Boolean(campaignId) && Boolean(onSavePlacements);

  const visiblePlacements = useMemo(
    () =>
      placements.filter((p) => {
        if (!p.id || pendingRemovals.has(p.id)) {
          return false;
        }
        if (
          p.archived &&
          campaignStartTimestampMs != null &&
          p.createdTimestampMs != null &&
          p.createdTimestampMs < campaignStartTimestampMs
        ) {
          return false;
        }
        return true;
      }),
    [placements, pendingRemovals, campaignStartTimestampMs],
  );

  const fetchPreviewRef = useRef(
    debounce(
      async (
        id: number,
        translateFn: (key: string) => string,
        currentUserId: number | undefined,
        currentUniverseCreator: CreatorIdentity | undefined,
      ) => {
        setIsLoadingPreview(true);
        setPreviewError(null);
        setAssetPreview(null);
        try {
          const assets = await getAssetDetails([id]);
          if (assets.length === 0) {
            setPreviewError(translateFn('Message.AssetNotFound'));
          } else {
            const asset = assets[0];
            const assetCreatorId = asset.creator?.targetId;
            const assetCreatorType = normalizeCreatorType(asset.creator?.type);
            const universeCreatorType = normalizeCreatorType(currentUniverseCreator?.type);
            const matchesUser =
              currentUserId != null &&
              assetCreatorId === currentUserId &&
              (assetCreatorType == null || assetCreatorType === 'user');
            const matchesUniverseCreator =
              currentUniverseCreator?.id != null &&
              universeCreatorType != null &&
              assetCreatorType != null &&
              assetCreatorId === currentUniverseCreator.id &&
              assetCreatorType === universeCreatorType;

            if (assetCreatorId != null && !matchesUser && !matchesUniverseCreator) {
              setPreviewError(translateFn('Message.AssetCreatorMismatch'));
            } else if (!isSupportedAdIntegrationAssetType(asset.type)) {
              setPreviewError(translateFn('Message.UnsupportedAssetType'));
            } else {
              setAssetPreview({
                assetId: asset.id,
                assetType: asset.type,
                name: asset.name,
              });
            }
          }
        } catch (error) {
          CaptureException(error, { context: 'AdIntegrationAssetsDrawer fetch asset preview' });
          setPreviewError(translateFn('Message.AssetNotFound'));
        } finally {
          setIsLoadingPreview(false);
        }
      },
      500,
    ),
  );

  useEffect(() => {
    const id = parseAssetId(assetIdInput);
    if (id === null) {
      setAssetPreview(null);
      setPreviewError(null);
      setIsLoadingPreview(false);
      fetchPreviewRef.current.cancel();
      return;
    }

    fetchPreviewRef.current(id, translate, userId, universeCreator);
  }, [assetIdInput, translate, userId, universeCreator]);

  useEffect(
    () => () => {
      fetchPreviewRef.current.cancel();
    },
    [],
  );

  useEffect(() => {
    onPendingAdditionsChange?.(pendingAdditions.map((p) => p.assetId));
  }, [pendingAdditions, onPendingAdditionsChange]);

  const handleAddFromPreview = useCallback(() => {
    if (!assetPreview) {
      return;
    }

    pendingIdSequence.current += 1;
    setPendingAdditions((prev) => [
      ...prev,
      {
        ...assetPreview,
        pendingId: `pending-${pendingIdSequence.current}`,
      },
    ]);
    setAssetIdInput('');
    setAssetPreview(null);
    setPreviewError(null);
  }, [assetPreview]);

  const handleRemovePendingAddition = useCallback((pendingId: string) => {
    setPendingAdditions((prev) => prev.filter((pending) => pending.pendingId !== pendingId));
  }, []);

  const handleRemovePlacement = useCallback((placementId: string) => {
    setPendingRemovals((prev) => new Set(prev).add(placementId));
  }, []);

  const handleSave = useCallback(async () => {
    if (!onSavePlacements || !canSave) {
      return;
    }

    setIsSaving(true);
    try {
      await onSavePlacements(
        pendingAdditions.map((p) => p.assetId),
        Array.from(pendingRemovals),
      );
      setPendingAdditions([]);
      setPendingRemovals(new Set());
      setAssetIdInput('');
      setAssetPreview(null);
      setPreviewError(null);
    } catch (error) {
      CaptureException(error, { context: 'AdIntegrationAssetsDrawer save placements' });
      const amaError = await parseResponseErrorToAMAError(error);
      openErrorDialog(amaError);
    } finally {
      setIsSaving(false);
    }
  }, [canSave, onSavePlacements, pendingAdditions, pendingRemovals]);

  const handleClose = useCallback(() => {
    if (mode !== 'create') {
      setPendingAdditions([]);
      setPendingRemovals(new Set());
    }
    setAssetIdInput('');
    setAssetPreview(null);
    setPreviewError(null);
    fetchPreviewRef.current.cancel();
    onClose();
  }, [mode, onClose]);

  const getStatusCircleClass = (
    statusTone: AdIntegrationAssetsDrawerCampaignInfoHeader['statusTone'],
  ) => {
    switch (statusTone) {
      case 'active':
        return statusCircleActive;
      case 'disabled':
        return statusCircleDisabled;
      case 'important':
        return statusCircleImportant;
      case 'notice':
      default:
        return statusCircleNotice;
    }
  };

  return (
    <SheetRoot
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
      open={open}>
      <SheetContent
        closeLabel={translateMisc('Action.Close')}
        largeScreenClassName='!max-width-[860px] width-full'
        largeScreenVariant='side'>
        <SheetTitle>
          {campaignInfoHeader ? campaignInfoHeader.campaignName : translate('Heading.ManageAssets')}
        </SheetTitle>
        <SheetBody className='flex flex-col gap-xlarge'>
          {campaignInfoHeader && (
            <div className={campaignIdRow}>
              <Typography color='secondary' variant='body2'>
                {translateReport('Label.CampaignId', { id: campaignInfoHeader.campaignId })}
              </Typography>
              <IconButton
                ariaLabel={translateReport('Description.CopyToClipboard')}
                icon='icon-regular-two-stacked-squares'
                onClick={() => {
                  navigator.clipboard.writeText(campaignInfoHeader.campaignId).catch(() => {});
                }}
                size='XSmall'
                variant='Utility'
              />
            </div>
          )}
          {campaignInfoHeader ? (
            <div className={campaignInfoGrid}>
              <div className={campaignInfoColumn}>
                <div className={campaignInfoItem}>
                  <Typography className={campaignInfoLabel} color='secondary' variant='captionBody'>
                    {translate('Label.AdvertiserName')}
                  </Typography>
                  <Typography className={campaignInfoValue} variant='body2'>
                    {campaignInfoHeader.advertiserName}
                  </Typography>
                </div>
                <div className={campaignInfoItem}>
                  <Typography className={campaignInfoLabel} color='secondary' variant='captionBody'>
                    {translateReport('Label.Experience')}
                  </Typography>
                  <div className={campaignInfoExperienceValue}>
                    <UniverseFilterAvatar src={campaignInfoHeader.experienceThumbnailUrl} />
                    <Typography className={campaignInfoExperienceName} variant='body2'>
                      {campaignInfoHeader.experienceName}
                    </Typography>
                  </div>
                </div>
                <div className={campaignInfoItem}>
                  <Typography className={campaignInfoLabel} color='secondary' variant='captionBody'>
                    {translateReport('Label.Status')}
                  </Typography>
                  <div className={campaignInfoStatusValue}>
                    <Label
                      classes={{ root: labelRoot }}
                      icon={<div className={getStatusCircleClass(campaignInfoHeader.statusTone)} />}
                      labelText={campaignInfoHeader.statusLabel}
                      severity='default'
                      variant='contained'
                    />
                  </div>
                </div>
              </div>
              <div className={campaignInfoColumn}>
                <div className={campaignInfoItem}>
                  <Typography className={campaignInfoLabel} color='secondary' variant='captionBody'>
                    {translate('Label.RegistrationDate')}
                  </Typography>
                  <Typography className={campaignInfoValue} variant='body2'>
                    {campaignInfoHeader.registrationDate}
                  </Typography>
                </div>
                <div className={campaignInfoItem}>
                  <Typography className={campaignInfoLabel} color='secondary' variant='captionBody'>
                    {translateCampaign('Label.CampaignStartDate')}
                  </Typography>
                  <Typography className={campaignInfoValue} variant='body2'>
                    {campaignInfoHeader.startDate}
                  </Typography>
                </div>
                <div className={campaignInfoItem}>
                  <Typography className={campaignInfoLabel} color='secondary' variant='captionBody'>
                    {translateCampaign('Label.EndDate')}
                  </Typography>
                  <Typography className={campaignInfoValue} variant='body2'>
                    {campaignInfoHeader.endDate}
                  </Typography>
                </div>
                {campaignInfoHeader.cptvDisplay !== undefined && (
                  <div className={campaignInfoItem}>
                    <Typography
                      className={campaignInfoLabel}
                      color='secondary'
                      variant='captionBody'>
                      {translateMisc('Label.Cptv')}
                    </Typography>
                    <Typography className={campaignInfoValue} variant='body2'>
                      {campaignInfoHeader.cptvDisplay}
                    </Typography>
                  </div>
                )}
                {campaignInfoHeader.maxCostDisplay !== undefined && (
                  <div className={campaignInfoItem}>
                    <Typography
                      className={campaignInfoLabel}
                      color='secondary'
                      variant='captionBody'>
                      {translateMisc('Label.RevenueShare')}
                    </Typography>
                    <Typography className={campaignInfoValue} variant='body2'>
                      {campaignInfoHeader.maxCostDisplay}
                    </Typography>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Typography color='secondary' variant='body1'>
              {translate('Description.ManageAssetsHelpText')}
            </Typography>
          )}
          {!disableSave && (mode === 'create' || Boolean(campaignId)) && (
            <div className={addAssetSection}>
              <TextField
                data-testid='addAssetIdInput'
                error={Boolean(previewError)}
                fullWidth
                helperText={previewError ?? translate('Description.AddAssetIDsHelperText')}
                id='add-asset-ids'
                label={translate('Label.AddAssetIDs')}
                onChange={(e) => setAssetIdInput(e.target.value)}
                placeholder={translate('Label.EnterAssetID')}
                value={assetIdInput}
              />
              {isLoadingPreview && (
                <ProgressCircle
                  ariaLabel={translateMisc('Label.Loading')}
                  data-testid='assetPreviewLoading'
                  size='Small'
                  variant='Indeterminate'
                />
              )}
              {assetPreview && (
                <div
                  className={previewCard}
                  data-testid='assetPreviewCard'
                  onClick={handleAddFromPreview}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleAddFromPreview();
                    }
                  }}
                  role='button'
                  tabIndex={0}>
                  <Thumbnail2d
                    alt={assetPreview.name}
                    containerClass={previewCardThumbnail}
                    imgClassName={previewCardThumbnailImage}
                    size={AssetThumbnailSize['_250x250']}
                    targetId={assetPreview.assetId}
                    type={ThumbnailTypes.assetThumbnail}
                  />
                  <div className={previewCardDetails}>
                    <Typography className={previewCardText} variant='body2'>
                      {assetPreview.name}
                    </Typography>
                    <Typography className={previewCardText} color='secondary' variant='caption'>
                      {assetPreview.assetId.toString()}
                    </Typography>
                  </div>
                </div>
              )}
            </div>
          )}
          <AdIntegrationAssetsTable
            disableRemove={disableSave}
            onRemovePendingAddition={
              mode === 'create' || campaignId ? handleRemovePendingAddition : undefined
            }
            onRemovePlacement={campaignId ? handleRemovePlacement : undefined}
            pendingAdditions={pendingAdditions}
            placements={visiblePlacements}
          />
        </SheetBody>
        <SheetActions className='flex flex-row items-center gap-small'>
          {mode !== 'create' && (
            <Button
              isDisabled={disableSave || !canSave || isSaving}
              isLoading={isSaving}
              onClick={handleSave}
              size='Medium'
              variant='Emphasis'>
              {translateMisc('Action.Save')}
            </Button>
          )}
          <Button onClick={handleClose} size='Medium' variant='Standard'>
            {translateMisc('Action.Close')}
          </Button>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default AdIntegrationAssetsDrawer;
