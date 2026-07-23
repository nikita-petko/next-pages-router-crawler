import { AdIntegrationPlacement } from '@rbx/client-ads-management-api/v1';
import {
  Button,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@rbx/foundation-ui';
import { AssetThumbnailSize, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Label, Tooltip } from '@rbx/ui';
import { useState } from 'react';

import useAdIntegrationStatusLabelStyles from '@components/adIntegrations/adIntegrationStatusLabel.styles';
import useAdIntegrationAssetsDrawerStyles from '@components/adIntegrations/assetsDrawer/AdIntegrationAssetsDrawer.styles';
import useAdIntegrationAssetsTableStyles from '@components/adIntegrations/assetsDrawer/AdIntegrationAssetsTable.styles';
import { openStatementOfReasonsDialog } from '@components/common/dialogs/StatementOfReasonsDialog';
import { AdIntegrationsDocsUrl } from '@constants/adIntegrationsUrls';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getAssetModerationTooltipBodyKey } from '@utils/adIntegrationModerationTooltip';
import {
  AdIntegrationPlacementStatus,
  getNonApprovedLabels,
  getPlacementStatus,
} from '@utils/adIntegrationPlacementStatus';
import { GetSitetestBaseUrl } from '@utils/url';

export interface PendingAsset {
  assetId: number;
  assetType?: string;
  name: string;
  pendingId: string;
}

interface AdIntegrationAssetsTableProps {
  disableRemove?: boolean;
  onRemovePendingAddition?: (pendingId: string) => void;
  onRemovePlacement?: (placementId: string) => void;
  pendingAdditions?: PendingAsset[];
  placements: AdIntegrationPlacement[];
}

const MODEL_ASSET_TYPE = 'Model';

const getPlacementAppealUrl = (latestDecisionEventId?: string): string | undefined => {
  if (!latestDecisionEventId) {
    return undefined;
  }
  return `https://www.${GetSitetestBaseUrl()}/report-appeals#/v/${encodeURIComponent(
    latestDecisionEventId,
  )}`;
};

const PlacementActionMenu = ({
  disabled,
  onAppealStatus,
  onRemove,
  rowId,
}: {
  disabled?: boolean;
  onAppealStatus?: () => void;
  onRemove?: () => void;
  rowId: string;
}) => {
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateControls } = useNamespacedTranslation(
    TranslationNamespace.CreatorDashboardControls,
  );
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <IconButton
          ariaLabel={translateReport('Description.MoreOptions')}
          data-testid={`placement-action-menu-${rowId}`}
          icon='icon-regular-three-dots-vertical'
          isCircular
          size='Small'
          variant='Utility'
        />
      </PopoverTrigger>
      <PopoverContent
        align='start'
        ariaLabel={translateReport('Description.MoreOptions')}
        side='bottom'>
        <Menu>
          <MenuItem
            onSelect={() => {
              setOpen(false);
              navigator.clipboard.writeText(rowId);
            }}
            title={translateAccount('Action.CopyPlacementId')}
            value='copy-placement-id'
          />
          {onAppealStatus && (
            <MenuItem
              onSelect={() => {
                setOpen(false);
                onAppealStatus();
              }}
              title={translateAccount('Action.AppealStatus')}
              value='appeal-status'
            />
          )}
          {onRemove && (
            <MenuItem
              disabled={disabled}
              onSelect={() => {
                setOpen(false);
                onRemove();
              }}
              title={translateControls('Action.Remove')}
              value='remove'
            />
          )}
        </Menu>
      </PopoverContent>
    </Popover>
  );
};

const APPEAL_STATUSES = new Set<AdIntegrationPlacementStatus>([
  AdIntegrationPlacementStatus.Rejected,
  AdIntegrationPlacementStatus.Limited,
]);

const AdIntegrationAssetsTable = ({
  disableRemove = false,
  onRemovePendingAddition,
  onRemovePlacement,
  pendingAdditions = [],
  placements,
}: AdIntegrationAssetsTableProps) => {
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateLanding } = useNamespacedTranslation(TranslationNamespace.Landing);
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const {
    classes: { table, tableColAction, tableColAssetId, tableColAssetName, tableColStatus },
  } = useAdIntegrationAssetsDrawerStyles();
  const {
    classes: {
      assetNameCell,
      assetNameText,
      emptyState,
      emptyStateDescription,
      emptyStateIcon,
      emptyStateIconContainer,
      emptyStateLink,
      emptyStateTitle,
      thumbnailContainerImageAndVideo,
      thumbnailContainerModel,
      thumbnailImage,
      tooltipContent,
      tooltipLink,
    },
  } = useAdIntegrationAssetsTableStyles();
  const {
    classes: {
      labelRoot,
      statusCircleActive,
      statusCircleDisabled,
      statusCircleImportant,
      statusCircleNotice,
    },
  } = useAdIntegrationStatusLabelStyles();

  const hasActions = placements.some((p) => Boolean(p.id)) || Boolean(onRemovePendingAddition);

  const getStatusText = (status: AdIntegrationPlacementStatus): string => {
    switch (status) {
      case AdIntegrationPlacementStatus.Approved:
        return translateAccount('Label.ModerationStatusApproved');
      case AdIntegrationPlacementStatus.Archived:
        return translateCreativeLibrary('Label.Archived');
      case AdIntegrationPlacementStatus.Limited:
        return translateAccount('Label.ModerationStatusLimited');
      case AdIntegrationPlacementStatus.Rejected:
        return translateCreativeLibrary('Label.Rejected');
      case AdIntegrationPlacementStatus.InReview:
      default:
        return translateCreativeLibrary('Label.InReview');
    }
  };

  const getStatusCircleClass = (status: AdIntegrationPlacementStatus) => {
    switch (status) {
      case AdIntegrationPlacementStatus.Approved:
      case AdIntegrationPlacementStatus.Limited:
        return statusCircleActive;
      case AdIntegrationPlacementStatus.Archived:
        return statusCircleDisabled;
      case AdIntegrationPlacementStatus.Rejected:
        return statusCircleImportant;
      case AdIntegrationPlacementStatus.InReview:
      default:
        return statusCircleNotice;
    }
  };

  const getThumbnailContainerClass = (assetType?: string) =>
    assetType === MODEL_ASSET_TYPE ? thumbnailContainerModel : thumbnailContainerImageAndVideo;

  if (placements.length === 0 && pendingAdditions.length === 0) {
    return (
      <div className={emptyState}>
        <div className={emptyStateIconContainer}>
          <Icon className={emptyStateIcon} name='icon-regular-studio' size='XLarge' />
        </div>
        <span className={`text-heading-medium ${emptyStateTitle}`}>
          {translateAccount('Label.NoAssets')}
        </span>
        <span className={`text-body-large content-default ${emptyStateDescription}`}>
          {translateAccount('Description.NoAssetsDrawerHelpText')}
        </span>
        <Button
          as='a'
          className={emptyStateLink}
          href={AdIntegrationsDocsUrl}
          rel='noopener noreferrer'
          size='Medium'
          target='_blank'
          variant='Utility'>
          {translateLanding('Action.LearnMore')}
        </Button>
      </div>
    );
  }

  return (
    <Table className={table}>
      <colgroup>
        <col className={tableColAssetName} />
        <col className={tableColAssetId} />
        <col className={tableColStatus} />
        {hasActions && <col className={tableColAction} />}
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>{translateAccount('Label.AssetName')}</TableHeaderCell>
          <TableHeaderCell>{translateAccount('Label.AdIntegrationAssetID')}</TableHeaderCell>
          <TableHeaderCell>{translateReport('Label.Status')}</TableHeaderCell>
          {hasActions && (
            <TableHeaderCell align='end' aria-label={translateReport('Description.MoreOptions')}>
              {null}
            </TableHeaderCell>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {pendingAdditions.map((pending) => (
          <TableRow key={pending.pendingId}>
            <TableCell>
              <div className={assetNameCell}>
                <Thumbnail2d
                  alt={pending.name}
                  containerClass={getThumbnailContainerClass(pending.assetType)}
                  imgClassName={thumbnailImage}
                  size={AssetThumbnailSize['_250x250']}
                  targetId={pending.assetId}
                  type={ThumbnailTypes.assetThumbnail}
                />
                <span className={`text-body-medium ${assetNameText}`}>{pending.name}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className='text-body-medium'>{pending.assetId.toString()}</span>
            </TableCell>
            <TableCell>
              <Label
                classes={{ root: labelRoot }}
                icon={<div className={statusCircleDisabled} />}
                labelText={translateAccount('Label.Pending')}
                severity='default'
                variant='contained'
              />
            </TableCell>
            {hasActions && (
              <TableCell align='end'>
                {onRemovePendingAddition && (
                  <PlacementActionMenu
                    disabled={disableRemove}
                    onRemove={() => onRemovePendingAddition(pending.pendingId)}
                    rowId={pending.pendingId}
                  />
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
        {placements.map((placement) => {
          const status = getPlacementStatus(placement.labels, placement.archived);
          const assetTooltipBodyKey = getAssetModerationTooltipBodyKey(status);
          const canAppeal = APPEAL_STATUSES.has(status);

          const handleOpenAppealModal = canAppeal
            ? () => {
                const adPolicyReviewLabels = getNonApprovedLabels(placement.labels);
                if (adPolicyReviewLabels.length > 0) {
                  openStatementOfReasonsDialog({
                    adPolicyReviewLabels,
                    adPolicyReviewUpdatedTimestampMs: placement.updateTimestampMs ?? 0,
                    appealUrl: getPlacementAppealUrl(placement.latestDecisionEventId),
                    assetId: placement.assetId,
                    headingKey:
                      status === AdIntegrationPlacementStatus.Rejected
                        ? 'Heading.AssetRejected'
                        : 'Heading.AssetLimited',
                    isLabelRejected: status === AdIntegrationPlacementStatus.Rejected,
                  });
                }
              }
            : undefined;

          return (
            <TableRow key={placement.id ?? placement.assetId}>
              <TableCell>
                <div className={assetNameCell}>
                  {placement.assetId != null && (
                    <Thumbnail2d
                      alt={placement.assetName ?? ''}
                      containerClass={getThumbnailContainerClass(placement.assetType)}
                      imgClassName={thumbnailImage}
                      size={AssetThumbnailSize['_250x250']}
                      targetId={placement.assetId}
                      type={ThumbnailTypes.assetThumbnail}
                    />
                  )}
                  <span className={`text-body-medium ${assetNameText}`}>
                    {placement.assetName ?? ''}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className='text-body-medium'>{placement.assetId?.toString() ?? ''}</span>
              </TableCell>
              <TableCell>
                <Tooltip
                  placement='top'
                  title={
                    assetTooltipBodyKey ? (
                      <div className={tooltipContent}>
                        <span className='text-title-large'>{getStatusText(status)}</span>
                        <span className='text-body-medium'>
                          {translateAccount(assetTooltipBodyKey)}
                        </span>
                        {handleOpenAppealModal && (
                          <button
                            className={tooltipLink}
                            onClick={handleOpenAppealModal}
                            type='button'>
                            {translateAccount('Action.ViewDetails')}
                          </button>
                        )}
                      </div>
                    ) : (
                      ''
                    )
                  }>
                  <div>
                    <Label
                      classes={{ root: labelRoot }}
                      icon={<div className={getStatusCircleClass(status)} />}
                      labelText={getStatusText(status)}
                      severity='default'
                      variant='contained'
                    />
                  </div>
                </Tooltip>
              </TableCell>
              {hasActions && (
                <TableCell align='end'>
                  {placement.id && (
                    <PlacementActionMenu
                      disabled={disableRemove || status === AdIntegrationPlacementStatus.Archived}
                      onAppealStatus={handleOpenAppealModal}
                      onRemove={
                        onRemovePlacement
                          ? () => onRemovePlacement(placement.id as string)
                          : undefined
                      }
                      rowId={placement.id}
                    />
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default AdIntegrationAssetsTable;
