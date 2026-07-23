import type { FC, ReactNode } from 'react';
import type { UserDisplayNamesById } from '../../../hooks/useUserDisplayNamesQuery';
import type { CustomDashboardListItem } from '../../../types';
import type { DashboardActionHandlers } from '../hooks/useDashboardActions';
import DashboardsTableHeader from './DashboardsTableHeader';
import DashboardsTableRow from './DashboardsTableRow';
import DashboardsTableSkeletonRow from './DashboardsTableSkeletonRow';
import { MANAGE_TABLE_COLUMN_COUNT } from './manageTableColumns';

/** Manage-page table chrome. Three render modes drive `<tbody>`. */
type DashboardsTableMode =
  | { readonly kind: 'loading'; readonly skeletonRowCount: number }
  | {
      readonly kind: 'populated';
      readonly items: ReadonlyArray<CustomDashboardListItem>;
      readonly handlers: DashboardActionHandlers;
      readonly canMutateDashboards: boolean;
      readonly userDisplayNamesById: UserDisplayNamesById;
    }
  | { readonly kind: 'custom'; readonly content: ReactNode };

type DashboardsTableProps = {
  readonly mode: DashboardsTableMode;
};

const DashboardsTable: FC<DashboardsTableProps> = ({ mode }) => {
  return (
    <div className='width-full scroll-x radius-medium stroke-standard stroke-default'>
      <table className='width-full [border-collapse:collapse]'>
        <DashboardsTableHeader />
        <tbody>
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
                onOpen={mode.handlers.onOpen}
                onEdit={mode.handlers.onEdit}
                onRename={mode.handlers.onRename}
                onDuplicate={mode.handlers.onDuplicate}
                onDelete={mode.handlers.onDelete}
                onPinToggle={mode.handlers.onPinToggle}
              />
            ))}
          {mode.kind === 'custom' && (
            <tr>
              <td colSpan={MANAGE_TABLE_COLUMN_COUNT} className='padding-x-medium'>
                {mode.content}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardsTable;
