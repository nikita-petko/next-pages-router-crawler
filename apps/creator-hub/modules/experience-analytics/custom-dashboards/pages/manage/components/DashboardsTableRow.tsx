import { type CSSProperties, type FC, type ReactNode, useCallback } from 'react';
import { Button, Toggle, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import LocalCopyBadge from '../../../components/LocalCopyBadge';
import type { UserDisplayNamesById } from '../../../hooks/useUserDisplayNamesQuery';
import type { CustomDashboardListItem } from '../../../types';
import type { DashboardActionHandlers } from '../hooks/useDashboardActions';
import { useManagePageTranslations } from '../useManagePageTranslations';
import { formatLastModifiedDate } from '../utils/customDashboardFormatting';
import DashboardRowOverflowMenu from './DashboardRowOverflowMenu';
import { MANAGE_TABLE_COLUMNS } from './manageTableColumns';
import styles from './DashboardsTableRow.module.css';

const DIVIDER_STYLE: CSSProperties = {
  borderBottom: 'var(--stroke-standard) solid var(--color-stroke-default)',
};

/**
 * One populated row. The final `<td>` reserves width unconditionally so
 * column widths don't reflow when the trailing controls fade in on hover /
 * focus-within.
 */
type DashboardsTableRowProps = {
  readonly dashboard: CustomDashboardListItem;
  readonly canMutateDashboards: boolean;
  readonly userDisplayNamesById: UserDisplayNamesById;
} & DashboardActionHandlers;

const DashboardsTableRow: FC<DashboardsTableRowProps> = ({
  dashboard,
  canMutateDashboards,
  userDisplayNamesById,
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
  const pinToggle = (
    <Toggle
      size='Medium'
      placement='Start'
      isChecked={dashboard.isPinned}
      onCheckedChange={handlePinChange}
      isDisabled={isPinDisabled}
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
    pinToSidebar: isHybridLocalCopy ? (
      <Tooltip title={t.pinToggleLocalCopyDisabledTooltip} position='top-center'>
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

  return (
    <tr
      style={DIVIDER_STYLE}
      className={`${styles.customDashboardManageTableRow} hover:bg-surface-100 focus-within:bg-surface-100`}>
      {MANAGE_TABLE_COLUMNS.map((columnKey) => (
        <td
          key={columnKey}
          className={
            columnKey === 'actions'
              ? 'padding-x-medium padding-y-small width-[120px]'
              : columnKey === 'name'
                ? 'padding-x-medium padding-y-small min-width-0'
                : columnKey === 'lastModified'
                  ? 'padding-x-medium padding-y-small'
                  : 'padding-x-medium padding-y-small'
          }>
          {cellsByColumn[columnKey]}
        </td>
      ))}
    </tr>
  );
};

export default DashboardsTableRow;
