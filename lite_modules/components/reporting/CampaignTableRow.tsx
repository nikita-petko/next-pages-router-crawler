import { Avatar, TableCell, TableRow } from '@rbx/foundation-ui';
import { Tooltip } from '@rbx/ui';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cloneElement, ReactNode } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import DismissibleTooltip from '@components/common/DismissibleTooltip';
import useGenericTableRowStyles from '@components/reporting/GenericTableRow.styles';
import SharedTableCells from '@components/reporting/SharedTableCells';
import TableActionMenuCell from '@components/reporting/TableActionMenuCell';
import TableNameCell from '@components/reporting/TableNameCell';
import TableStatusCell from '@components/reporting/TableStatusCell';
import TableToggleCell from '@components/reporting/TableToggleCell';
import TwoLineTableCellContent from '@components/reporting/TwoLineTableCellContent';
import { PaymentMethodActionEnum } from '@constants/billing';
import { ServerDetailedTargetingMatchType } from '@constants/campaign';
import {
  getStatusTooltipLinkTags,
  StatusText,
  statusTextToTooltipKey,
} from '@constants/campaignStatus';
import { EntityType } from '@constants/entity';
import { HeadCellName } from '@constants/headCells';
import { TranslationNamespace } from '@constants/localization';
import ReportingViewType from '@constants/reportingViewType';
import Routes from '@constants/routes';
import { Tooltips } from '@constants/tooltips';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { GenericTableRowProps, RowCell, SortableHeadCell } from '@type/genericManagementTable';
import { GetAudienceLabelKey, GetEndUserObjectiveString } from '@utils/campaignDetails';
import { IsCompletedStatus } from '@utils/displayStatus';
import { GetLocalStorage } from '@utils/localStorage';
import { GetUrlWithParams } from '@utils/url';

const CampaignTableRow = ({
  firstColumnMinWidthPx,
  headCells,
  isTooltipAnchor = false,
  row,
  unsortableData,
}: GenericTableRowProps) => {
  const { translate, translateHTML } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const router = useRouter();
  const {
    classes: {
      actionMenuButton,
      actionRow,
      campaignTypeRow,
      creatorAvatar,
      creatorCellContent,
      creatorRow,
      dateModifiedRow,
      fullRow,
      nameRow,
      statusRow,
      toggleRow,
      tooltipLinkUnderline,
    },
  } = useGenericTableRowStyles();

  const getAdsAndOpenDrawer = useNewFlowStore(
    (state: NewFlowStoreType) => state.getAdsAndOpenDrawer,
  );
  const currentReportingView = useNewFlowStore(
    (state: NewFlowStoreType) =>
      state.reportingViewState?.currentSelection ?? ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT,
  );
  const isRetentionCampaign =
    row.detailed_targeting_match_type ===
    ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_RETENTION;
  const isNotRecentUsersView =
    currentReportingView !== ReportingViewType.REPORTING_VIEW_TYPE_RECENT_USERS;
  const shouldShowRetentionTooltip = isRetentionCampaign && isNotRecentUsersView;

  let statusText = StatusText.DISPLAY_STATUS_INVALID;
  let toggleState = { isDisabled: true, isOn: false };
  let cancelDisabledTooltip: string | undefined;
  let editDisabledTooltip: string | undefined;
  let insufficientAdCreditTooltip: string | undefined;
  let toggleDisabledTooltip: string | undefined;
  if (unsortableData) {
    statusText = unsortableData.statusText;
    toggleState = unsortableData.toggleState;
    cancelDisabledTooltip = unsortableData.cancelDisabledTooltip;
    editDisabledTooltip = unsortableData.editDisabledTooltip;
    insufficientAdCreditTooltip = unsortableData.insufficientAdCreditTooltip;
    toggleDisabledTooltip = unsortableData.toggleDisabledTooltip;
  }

  let toggleTooltip: ReactNode = '';
  if (IsCompletedStatus(row.status_text)) {
    toggleTooltip = translate('Tooltip.CompletedCannotSwitchOn');
  } else if (row.status_text === StatusText.DISPLAY_STATUS_CANCELED) {
    toggleTooltip = translate('Tooltip.CanceledCannotSwitchOn');
  } else if (insufficientAdCreditTooltip) {
    toggleTooltip = translateHTML(
      'Tooltip.InsufficientAdCredit',
      [
        {
          closing: 'linkEnd',
          content: (chunks) => (
            <Link
              className={tooltipLinkUnderline}
              href={{
                pathname: Routes.ADD_PAYMENT,
                query: { action: PaymentMethodActionEnum.RELOAD_AD_CREDIT },
              }}>
              {chunks}
            </Link>
          ),
          opening: 'linkStart',
        },
      ],
      { credits: insufficientAdCreditTooltip },
    );
  } else if (toggleDisabledTooltip) {
    toggleTooltip = toggleDisabledTooltip;
  }

  const clipboardContent = translate('Label.CampaignId', { id: row.id });

  const isOffPlatformCampaign = !!row.is_off_platform_request;
  const objectiveLabelKey =
    row.objective !== undefined
      ? GetEndUserObjectiveString(row.objective, isOffPlatformCampaign)
      : '';
  const audienceLabelKey = GetAudienceLabelKey(row.detailed_targeting_match_type);
  const showCreatorColumn = headCells.some(
    (headCell) => (headCell as SortableHeadCell).sortKey === 'creator_username',
  );
  const showDateModifiedColumn = headCells.some(
    (headCell) => headCell.classNameKey === HeadCellName.CampaignDateModified,
  );

  const rowCells: RowCell[] = [
    {
      cell: (
        <TableNameCell
          align='start'
          className={nameRow}
          copyToClipboardContent={clipboardContent}
          isAutoReload={row.is_auto_reload_ad_credit_enabled}
          isOffPlatformRequest={row.is_off_platform_request}
          isReportingEnabled={row.is_reporting_enabled}
          minWidthPx={firstColumnMinWidthPx}
          name={row.name}
          onNameClicked={() => {
            router.push(GetUrlWithParams(Routes.MANAGE, { campaignId: row.id }), undefined, {
              scroll: false,
            });
            getAdsAndOpenDrawer(row.id);
            logNativeClickEvent(EventName.CampaignDetailsOpened);
          }}
        />
      ),
      id: 'name',
    },
    {
      cell: (
        <TableActionMenuCell
          cancelDisabledTooltip={cancelDisabledTooltip}
          className={actionRow}
          editDisabledTooltip={editDisabledTooltip}
          entityId={row.id}
          menuButtonClassName={actionMenuButton}
        />
      ),
      id: 'action_menu',
    },
    {
      cell: (
        <TableToggleCell
          align='start'
          className={toggleRow}
          entityId={row.id}
          entityOn={toggleState.isOn}
          entityType={EntityType.ENTITY_TYPE_CAMPAIGN}
          toggleDisabled={toggleState.isDisabled || !!toggleTooltip}
          toggleDisabledTooltip={toggleTooltip}
        />
      ),
      id: 'active',
    },
    {
      cell: (
        <TableStatusCell
          align='start'
          className={statusRow}
          status={statusText}
          tooltipContent={
            statusTextToTooltipKey.get(statusText)
              ? translateHTML(
                  statusTextToTooltipKey.get(statusText)!,
                  getStatusTooltipLinkTags(statusText, unsortableData?.universeId),
                )
              : ''
          }
        />
      ),
      id: 'status_text',
    },
    {
      cell: (
        <TableCell align='start' className={campaignTypeRow}>
          <TwoLineTableCellContent
            primary={objectiveLabelKey ? translateCampaign(objectiveLabelKey) : ''}
            secondary={translateCampaign(audienceLabelKey)}
          />
        </TableCell>
      ),
      id: 'campaign_type',
    },
  ];

  const creatorCell = showCreatorColumn ? (
    <TableCell align='start' className={creatorRow}>
      {row.creator_username ? (
        <div className={creatorCellContent}>
          <Avatar
            alt={row.creator_username}
            className={creatorAvatar}
            size='Small'
            src={row.creator_avatar_url}
          />
          <span>{row.creator_username}</span>
        </div>
      ) : (
        ''
      )}
    </TableCell>
  ) : null;
  const dateModifiedCell = showDateModifiedColumn ? (
    <TableCell align='start' className={dateModifiedRow}>
      {row.date_modified ?? ''}
    </TableCell>
  ) : null;

  // The parent nominates at most one retention row per page as the dismissible-tooltip anchor.
  // Until that coachmark has been dismissed, the anchor row shows the dismissible instead of the
  // hover hint. Once dismissed, the anchor row falls back to the hover hint so its behavior
  // matches every other retention row.
  const hasDismissedRetentionTooltip =
    shouldShowRetentionTooltip && Boolean(GetLocalStorage(Tooltips.RETENTION_CAMPAIGN.storageKey));
  const shouldShowDismissibleTooltip =
    shouldShowRetentionTooltip && isTooltipAnchor && !hasDismissedRetentionTooltip;

  const renderBodyCell = (rowCell: RowCell) => cloneElement(rowCell.cell, { key: rowCell.id });

  const tableRow = (
    <TableRow className={fullRow} key={row.name}>
      {shouldShowDismissibleTooltip ? (
        <DismissibleTooltip
          // Anchor the coachmark to the name cell so the popper tracks the row.
          anchorElement={renderBodyCell(rowCells[0])}
          tooltip={Tooltips.RETENTION_CAMPAIGN}
        />
      ) : (
        renderBodyCell(rowCells[0])
      )}
      {rowCells.slice(1).map((rowCell) => renderBodyCell(rowCell))}
      <SharedTableCells headCells={headCells} row={row} unsortableData={unsortableData} />
      {creatorCell}
      {dateModifiedCell}
    </TableRow>
  );

  if (!shouldShowRetentionTooltip) {
    return tableRow;
  }

  if (shouldShowDismissibleTooltip) {
    return tableRow;
  }

  return (
    <Tooltip title={translate('Description.RetentionCampaignViewRestriction')}>{tableRow}</Tooltip>
  );
};

export default CampaignTableRow;
