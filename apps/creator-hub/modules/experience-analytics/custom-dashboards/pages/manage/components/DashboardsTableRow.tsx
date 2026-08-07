import { type FC, type ReactNode, useCallback } from 'react';
import { Button, TableCell, TableRow, Toggle, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import LocalCopyBadge from '../../../components/LocalCopyBadge';
import type { UserDisplayNamesById } from '../../../hooks/useUserDisplayNamesQuery';
import type { CustomDashboardListItem } from '../../../types';
import type { DashboardActionHandlers } from '../hooks/useDashboardActions';
import { useManagePageTranslations } from '../useManagePageTranslations';
import { formatLastModifiedDate } from '../utils/customDashboardFormatting';
import DashboardRowOverflowMenu from './DashboardRowOverflowMenu';
import { MANAGE_TABLE_COLUMNS } from './manageTableColumns';
import tableStyles from './DashboardsTable.module.css';
import styles from './DashboardsTableRow.module.css';

/**
 * One populated row. On wide viewports, the final `<td>` reserves width so
 * the columns don't reflow when its controls appear. On narrow viewports,
 * CSS moves that cell beside the name to form the row-section header.
 */
type DashboardsTableRowProps = {
  readonly dashboard: CustomDashboardListItem;
  readonly canMutateDashboards: boolean;
  readonly userDisplayNamesById: UserDisplayNamesById;
  readonly pinnedCount: number;
  readonly maxPinnedDashboards: number;
} & DashboardActionHandlers;

const DashboardsTableRow: FC<DashboardsTableRowProps> = ({
  dashboard,
  canMutateDashboards,
  userDisplayNamesById,
  pinnedCount,
  maxPinnedDashboards,
  onOpen,
  onEdit,
  onRename,
  onDuplicate,
  onDelete,
  onPinToggle,
}) => {
  const t = useManagePageTranslations();

  const handleNameClick = () => {
    onOpen(dashboard);
  };

  const handleViewClick = useCallback(() => {
    onOpen(dashboard);
  }, [dashboard, onOpen]);

  const handlePinChange = useCallback(
    (nextChecked: boolean) => {
      onPinToggle(dashboard, nextChecked);
    },
    [dashboard, onPinToggle],
  );

  const lastModified = formatLastModifiedDate(dashboard.updatedAt);
  const createdByFallback = dashboard.createdByUsername || t.unknownCreatorLabel;
  const createdByDisplay = userDisplayNamesById.get(dashboard.createdByUserId) ?? createdByFallback;
  const modifiedByUserId = dashboard.updatedByUserId ?? dashboard.createdByUserId;
  const modifiedByFallback =
    (dashboard.updatedByUsername ?? dashboard.createdByUsername) || t.unknownCreatorLabel;
  const modifiedByDisplay = userDisplayNamesById.get(modifiedByUserId) ?? modifiedByFallback;
  const isHybridServerRow = dashboard.hybridOrigin === 'server';
  const isHybridLocalCopy = dashboard.hybridOrigin === 'localCopy';
  // Sidebar nav only consumes server list items; hybrid local pins never appear there.
  const isPinDisabled = !canMutateDashboards || isHybridServerRow || isHybridLocalCopy;
  // Cap-reached disables pinning an *unpinned* row. Already-pinned rows stay
  // enabled so the user can unpin to make room. This is computed separately
  // from `isPinDisabled` because it has its own tooltip copy.
  const isPinCapReached = !dashboard.isPinned && pinnedCount >= maxPinnedDashboards;
  const pinDisabledTooltip = isHybridLocalCopy
    ? t.pinToggleLocalCopyDisabledTooltip
    : isPinCapReached
      ? t.pinToggleCapReachedTooltip
      : null;
  const pinToggle = (
    <Toggle
      size='Medium'
      placement='Start'
      isChecked={dashboard.isPinned}
      onCheckedChange={handlePinChange}
      isDisabled={isPinDisabled || isPinCapReached}
      aria-label={t.pinToggleAriaLabel({ name: dashboard.name })}
    />
  );

  const cellsByColumn: Record<(typeof MANAGE_TABLE_COLUMNS)[number], ReactNode> = {
    name: (
      <div className='flex items-center gap-small min-width-0'>
        <button
          type='button'
          onClick={handleNameClick}
          className='text-body-medium content-emphasis hover:underline focus-visible:underline text-truncate-end inline-block max-width-full text-align-x-left bg-none stroke-none padding-none cursor-pointer'>
          {dashboard.name}
        </button>
        {isHybridLocalCopy ? <LocalCopyBadge /> : null}
      </div>
    ),
    createdBy: <span className='text-body-medium content-default'>{createdByDisplay}</span>,
    modifiedBy: <span className='text-body-medium content-default'>{modifiedByDisplay}</span>,
    lastModified: (
      <span className='text-body-medium content-muted text-no-wrap'>{lastModified}</span>
    ),
    pinToSidebar: pinDisabledTooltip ? (
      <Tooltip title={pinDisabledTooltip} position='top-center'>
        <TooltipTrigger asChild>
          <span className='inline-flex'>{pinToggle}</span>
        </TooltipTrigger>
      </Tooltip>
    ) : (
      pinToggle
    ),
    actions: (
      <div
        className={`${styles.customDashboardManageTableRowActions} flex items-center justify-end gap-small`}>
        <Button variant='Standard' size='Small' onClick={handleViewClick}>
          {t.rowViewButton}
        </Button>
        {canMutateDashboards ? (
          <DashboardRowOverflowMenu
            dashboard={dashboard}
            onEdit={onEdit}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ) : null}
      </div>
    ),
  };

  const mobileLabelsByColumn: Partial<Record<(typeof MANAGE_TABLE_COLUMNS)[number], ReactNode>> = {
    createdBy: t.columnCreatedBy,
    modifiedBy: t.columnModifiedBy,
    lastModified: t.columnLastModified,
    pinToSidebar: t.columnPinToSidebar,
  };

  const cellClassesByColumn: Record<(typeof MANAGE_TABLE_COLUMNS)[number], string> = {
    name: tableStyles.nameCell,
    createdBy: tableStyles.createdByCell,
    modifiedBy: tableStyles.modifiedByCell,
    lastModified: tableStyles.lastModifiedCell,
    pinToSidebar: tableStyles.pinToSidebarCell,
    actions: tableStyles.actionsCell,
  };

  return (
    <TableRow
      isHoverable
      className={`${tableStyles.tableRow} ${styles.customDashboardManageTableRow}`}>
      {MANAGE_TABLE_COLUMNS.map((columnKey) => {
        const mobileLabel = mobileLabelsByColumn[columnKey];
        return (
          <TableCell
            key={columnKey}
            className={`${tableStyles.tableCell} ${cellClassesByColumn[columnKey]}`}>
            {mobileLabel ? (
              <span className={`${tableStyles.mobileCellLabel} text-title-small content-muted`}>
                {mobileLabel}
              </span>
            ) : null}
            <div className={mobileLabel ? tableStyles.mobileCellContent : undefined}>
              {cellsByColumn[columnKey]}
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
};

export default DashboardsTableRow;
