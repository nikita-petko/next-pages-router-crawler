import { TableCell, TableRow } from '@rbx/foundation-ui';
import { cloneElement, ReactNode, useMemo } from 'react';

import {
  openStatementOfReasonsDialog,
  shouldShowStatementOfReasons,
} from '@components/common/dialogs/StatementOfReasonsDialog';
import { openVideoPlayerDialog } from '@components/common/dialogs/VideoPlayerDialog';
import useGenericTableRowStyles from '@components/reporting/GenericTableRow.styles';
import ReachTableCreativeCell from '@components/reporting/ReachTableCreativeCell';
import SharedTableCells from '@components/reporting/SharedTableCells';
import TableCreativeCell from '@components/reporting/TableCreativeCell';
import TableStatusCell from '@components/reporting/TableStatusCell';
import TableToggleCell from '@components/reporting/TableToggleCell';
import {
  getStatusTooltipLinkTags,
  StatusText,
  statusTextToTooltipKey,
} from '@constants/campaignStatus';
import { EntityType } from '@constants/entity';
import { AdTableColumnId } from '@constants/headCells';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  GenericTableRowProps,
  RowCell,
  SortableHeadCell,
  UnsortableHeadCell,
} from '@type/genericManagementTable';
import { IsOffPlatformAd } from '@utils/offPlatformAdUtils';

type LinkTagDef = {
  closing: string;
  content: (chunks: ReactNode) => ReactNode;
  opening: string;
};

const AdTableRow = ({ headCells, row, unsortableData }: GenericTableRowProps) => {
  const { translate, translateHTML } = useNamespacedTranslation(TranslationNamespace.Report);
  const {
    classes: {
      buttonAsLink,
      centerAlignedStatusRow,
      centerAlignedToggleRow,
      creativeRow,
      creativeThumbnailContainer,
      creativeThumbnailImage,
      fullRow,
      gaasNoCreativePlaceholder,
      tooltipLinkUnderline,
    },
    cx,
  } = useGenericTableRowStyles();

  const {
    adPolicyReviewLabels = [],
    adPolicyReviewUpdatedTimestampMs = 0,
    assetId,
    campaignHasOffPlatformAds = false,
    offPlatformCreatives = [],
    platform,
    reachTablePreview,
    statusText = StatusText.DISPLAY_STATUS_INVALID,
    toggleDisabledTooltip,
    toggleState = { isDisabled: true, isOn: false },
  } = unsortableData || {};

  const clipboardContent = translate('Label.AdId', { id: row.id });

  const isCurrentAdOffPlatform = IsOffPlatformAd(platform);
  const platformName = platform || translate('Label.Roblox');

  const videoAssets = offPlatformCreatives.map((creative) => ({
    assetId: '',
    videoSrc: creative.asset_url || '',
  }));

  const handleCreativeClick = () => {
    if (videoAssets.length > 0) {
      openVideoPlayerDialog(videoAssets[0], videoAssets);
    }
  };

  // Helper function to find column alignment by column ID or sortKey
  const getColumnAlign = (identifier: string) => {
    const column = headCells.find(
      (col) =>
        (col as UnsortableHeadCell)?.id === identifier ||
        (col as SortableHeadCell)?.sortKey === identifier,
    );
    return (column as UnsortableHeadCell)?.align || 'start';
  };

  const viewDetailsLinkTag: LinkTagDef = useMemo(
    () => ({
      closing: 'linkEnd',
      content: (chunks: ReactNode) => (
        <button
          className={cx(buttonAsLink, tooltipLinkUnderline)}
          color='inherit'
          onClick={() => {
            openStatementOfReasonsDialog({
              adPolicyReviewLabels,
              adPolicyReviewUpdatedTimestampMs,
              assetId,
            });
          }}
          type='button'>
          {chunks}
        </button>
      ),
      opening: 'linkStart',
    }),
    [
      adPolicyReviewLabels,
      adPolicyReviewUpdatedTimestampMs,
      assetId,
      cx,
      buttonAsLink,
      tooltipLinkUnderline,
    ],
  );

  const statusTooltipContent: ReactNode = useMemo(() => {
    if (shouldShowStatementOfReasons(statusText, adPolicyReviewLabels)) {
      return (
        <span>{translateHTML('Description.AssetViolatedStandards', [viewDetailsLinkTag])}</span>
      );
    }
    const tooltipKey = statusTextToTooltipKey.get(statusText);
    return tooltipKey
      ? translateHTML(tooltipKey, getStatusTooltipLinkTags(statusText, unsortableData?.universeId))
      : undefined;
  }, [
    statusText,
    translateHTML,
    adPolicyReviewLabels,
    viewDetailsLinkTag,
    unsortableData?.universeId,
  ]);

  // Render creative cell based on ad type
  const renderCreativeCell = () => {
    if (isCurrentAdOffPlatform && offPlatformCreatives.length > 0) {
      return (
        <TableCell align={getColumnAlign(AdTableColumnId.CREATIVE)} className={creativeRow}>
          <div
            className={creativeThumbnailContainer}
            onClick={handleCreativeClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCreativeClick();
              }
            }}
            role='button'
            tabIndex={0}>
            {offPlatformCreatives[0].thumbnail && (
              <img
                alt={offPlatformCreatives[0].filename}
                className={creativeThumbnailImage}
                src={`data:image/jpeg;base64,${offPlatformCreatives[0].thumbnail}`}
              />
            )}
          </div>
        </TableCell>
      );
    }

    if (isCurrentAdOffPlatform) {
      return (
        <TableCell align={getColumnAlign(AdTableColumnId.CREATIVE)} className={creativeRow}>
          <div className={gaasNoCreativePlaceholder}>
            <span className='text-body-medium'>
              {translate('Label.PlatformCreative', { platformName })}
            </span>
          </div>
        </TableCell>
      );
    }

    if (reachTablePreview) {
      return (
        <ReachTableCreativeCell
          align={getColumnAlign(AdTableColumnId.CREATIVE)}
          className={creativeRow}
          copyToClipboardContent={clipboardContent}
          reachPreview={reachTablePreview}
        />
      );
    }

    return (
      <TableCreativeCell
        align={getColumnAlign(AdTableColumnId.CREATIVE)}
        assetId={assetId}
        className={creativeRow}
        copyToClipboardContent={clipboardContent}
      />
    );
  };

  const rowCells: RowCell[] = [
    {
      cell: renderCreativeCell(),
      id: AdTableColumnId.CREATIVE,
    },
  ];

  // Add toggle column for all ads, but disable it for off-platform ads
  rowCells.push({
    cell: (
      <TableToggleCell
        align={getColumnAlign(AdTableColumnId.ACTIVE)}
        className={centerAlignedToggleRow}
        entityId={row.id}
        entityOn={isCurrentAdOffPlatform ? true : toggleState.isOn} // Show as "on" for off-platform ads
        entityType={EntityType.ENTITY_TYPE_AD}
        toggleDisabled={isCurrentAdOffPlatform ? true : toggleState.isDisabled} // Always disabled for off-platform
        toggleDisabledTooltip={toggleDisabledTooltip}
      />
    ),
    id: AdTableColumnId.ACTIVE,
  });

  // Add status column
  rowCells.push({
    cell: (
      <TableStatusCell
        align={getColumnAlign(AdTableColumnId.STATUS_TEXT)}
        className={centerAlignedStatusRow}
        status={statusText}
        tooltipContent={statusTooltipContent}
      />
    ),
    id: AdTableColumnId.STATUS_TEXT,
  });

  // Add platform column when campaign has any off-platform ads
  if (campaignHasOffPlatformAds) {
    rowCells.push({
      cell: (
        <TableCell
          align={getColumnAlign(AdTableColumnId.PLATFORM)}
          className={centerAlignedStatusRow}>
          <span className='text-body-medium'>{platformName}</span>
        </TableCell>
      ),
      id: AdTableColumnId.PLATFORM,
    });
  }
  return (
    <TableRow className={fullRow} data-testid='ad-table-row' key={row.name}>
      {rowCells.map((rowCell) => cloneElement(rowCell.cell, { key: rowCell.id }))}
      <SharedTableCells headCells={headCells} row={row} unsortableData={unsortableData} />
    </TableRow>
  );
};

export default AdTableRow;
