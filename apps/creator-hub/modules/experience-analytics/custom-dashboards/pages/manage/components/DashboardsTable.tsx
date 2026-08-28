import type { FC, ReactNode } from 'react';
import { Table, TableBody, TableCell, TableRow } from '@rbx/foundation-ui';
import type { UserDisplayNamesById } from '../../../hooks/useUserDisplayNamesQuery';
import type { CustomDashboardListItem } from '../../../types';
import type { DashboardActionHandlers } from '../hooks/useDashboardActions';
import DashboardsTableHeader from './DashboardsTableHeader';
import DashboardsTableRow from './DashboardsTableRow';
import DashboardsTableSkeletonRow from './DashboardsTableSkeletonRow';
import { MANAGE_TABLE_COLUMN_COUNT } from './manageTableColumns';
import styles from './DashboardsTable.module.css';

/** Manage-page table chrome. Three render modes drive `<tbody>`. */
type DashboardsTableMode =
  | { readonly kind: 'loading'; readonly skeletonRowCount: number }
  | {
      readonly kind: 'populated';
      readonly items: ReadonlyArray<CustomDashboardListItem>;
      readonly handlers: DashboardActionHandlers;
      readonly canMutateDashboards: boolean;
      readonly userDisplayNamesById: UserDisplayNamesById;
      readonly isUserDisplayNamesPending: boolean;
      readonly pinnedCount: number;
      readonly maxPinnedDashboards: number;
    }
  | { readonly kind: 'custom'; readonly content: ReactNode };

type DashboardsTableProps = {
  readonly mode: DashboardsTableMode;
};

const DashboardsTable: FC<DashboardsTableProps> = ({ mode }) => {
  return (
    <div className={`${styles.tableScroller} width-full`}>
      <Table variant='Framed' size='Small' className={styles.table}>
        <DashboardsTableHeader />
        <TableBody className={styles.tableBody}>
          {mode.kind === 'loading' &&
            Array.from({ length: mode.skeletonRowCount }, (_, idx) => (
              <DashboardsTableSkeletonRow key={`dashboards-skeleton-${idx}`} />
            ))}
          {mode.kind === 'populated' &&
            mode.items.map((item) => (
              <DashboardsTableRow
                key={item.id}
                dashboard={item}
                canMutateDashboards={mode.canMutateDashboards}
                userDisplayNamesById={mode.userDisplayNamesById}
                isUserDisplayNamesPending={mode.isUserDisplayNamesPending}
                pinnedCount={mode.pinnedCount}
                maxPinnedDashboards={mode.maxPinnedDashboards}
                onOpen={mode.handlers.onOpen}
                onEdit={mode.handlers.onEdit}
                onRename={mode.handlers.onRename}
                onDuplicate={mode.handlers.onDuplicate}
                onDelete={mode.handlers.onDelete}
                onPinToggle={mode.handlers.onPinToggle}
              />
            ))}
          {mode.kind === 'custom' && (
            <TableRow className={styles.customRow}>
              <TableCell
                colSpan={MANAGE_TABLE_COLUMN_COUNT}
                className={`${styles.customCell} padding-x-medium`}>
                {mode.content}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DashboardsTable;
