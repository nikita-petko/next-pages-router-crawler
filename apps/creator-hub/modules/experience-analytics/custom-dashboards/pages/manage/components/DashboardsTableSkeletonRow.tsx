import type { FC, ReactNode } from 'react';
import { TableCell, TableRow } from '@rbx/foundation-ui';
import { useManagePageTranslations } from '../useManagePageTranslations';
import { MANAGE_TABLE_COLUMNS } from './manageTableColumns';
import styles from './DashboardsTable.module.css';

/**
 * Skeleton row for the dashboards table during the Loading state. Cell
 * shapes mirror the shapes the populated row renders so the table's
 * column widths and overall vertical extent match.
 */
const ShimmerBar: FC<{ readonly widthClass: string }> = ({ widthClass }) => (
  <div className={`height-200 radius-small bg-surface-200 ${widthClass}`} />
);

const DashboardsTableSkeletonRow: FC = () => {
  const t = useManagePageTranslations();
  const cellContentByColumn: Record<(typeof MANAGE_TABLE_COLUMNS)[number], ReactNode> = {
    name: <ShimmerBar widthClass='width-[60%]' />,
    createdBy: <ShimmerBar widthClass='width-[70%]' />,
    modifiedBy: <ShimmerBar widthClass='width-[50%]' />,
    lastModified: <ShimmerBar widthClass='width-[60%]' />,
    permissions: <ShimmerBar widthClass='width-[40%]' />,
    pinToSidebar: <div className='height-300 width-[36px] radius-circle bg-surface-200' />,
    actions: null,
  };

  const mobileLabelsByColumn: Partial<Record<(typeof MANAGE_TABLE_COLUMNS)[number], ReactNode>> = {
    createdBy: t.columnCreatedBy,
    modifiedBy: t.columnModifiedBy,
    lastModified: t.columnLastModified,
    permissions: t.columnPermissions,
    pinToSidebar: t.columnPinToSidebar,
  };

  const cellClassesByColumn: Record<(typeof MANAGE_TABLE_COLUMNS)[number], string> = {
    name: styles.nameCell,
    createdBy: styles.createdByCell,
    modifiedBy: styles.modifiedByCell,
    lastModified: styles.lastModifiedCell,
    permissions: styles.permissionsCell,
    pinToSidebar: styles.pinToSidebarCell,
    actions: styles.actionsCell,
  };

  return (
    <TableRow className={`${styles.tableRow} ${styles.skeletonRow}`} aria-hidden='true'>
      {MANAGE_TABLE_COLUMNS.map((columnKey) => {
        const mobileLabel = mobileLabelsByColumn[columnKey];
        return (
          <TableCell
            key={columnKey}
            className={`${styles.tableCell} ${cellClassesByColumn[columnKey]}`}>
            {mobileLabel ? (
              <span className={`${styles.mobileCellLabel} text-title-small content-muted`}>
                {mobileLabel}
              </span>
            ) : null}
            <div className={mobileLabel ? styles.mobileCellContent : undefined}>
              {cellContentByColumn[columnKey]}
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
};

export default DashboardsTableSkeletonRow;
