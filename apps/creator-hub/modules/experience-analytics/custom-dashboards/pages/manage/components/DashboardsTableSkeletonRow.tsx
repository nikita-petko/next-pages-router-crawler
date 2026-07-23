import type { CSSProperties, FC, ReactNode } from 'react';
import { MANAGE_TABLE_COLUMNS } from './manageTableColumns';

/**
 * Skeleton row for the dashboards table during the Loading state. Cell
 * shapes mirror the shapes the populated row renders so the table's
 * column widths and overall vertical extent match.
 */
const ShimmerBar: FC<{ readonly widthClass: string }> = ({ widthClass }) => (
  <div className={`height-200 radius-small bg-surface-200 ${widthClass}`} />
);

const DIVIDER_STYLE: CSSProperties = {
  borderBottom: 'var(--stroke-standard) solid var(--color-stroke-default)',
};

const DashboardsTableSkeletonRow: FC = () => {
  const cellContentByColumn: Record<(typeof MANAGE_TABLE_COLUMNS)[number], ReactNode> = {
    name: <ShimmerBar widthClass='width-[60%]' />,
    createdBy: <ShimmerBar widthClass='width-[70%]' />,
    modifiedBy: <ShimmerBar widthClass='width-[50%]' />,
    lastModified: <ShimmerBar widthClass='width-[60%]' />,
    pinToSidebar: <div className='height-300 width-[36px] radius-circle bg-surface-200' />,
    actions: null,
  };

  return (
    <tr style={DIVIDER_STYLE} aria-hidden='true'>
      {MANAGE_TABLE_COLUMNS.map((columnKey) => (
        <td
          key={columnKey}
          className={
            columnKey === 'actions'
              ? 'padding-x-medium padding-y-medium width-[120px]'
              : 'padding-x-medium padding-y-medium'
          }>
          {cellContentByColumn[columnKey]}
        </td>
      ))}
    </tr>
  );
};

export default DashboardsTableSkeletonRow;
