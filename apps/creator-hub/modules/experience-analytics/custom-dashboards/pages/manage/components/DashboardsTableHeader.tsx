import type { CSSProperties, FC } from 'react';
import { useManagePageTranslations } from '../useManagePageTranslations';
import { MANAGE_TABLE_COLUMNS } from './manageTableColumns';
import PinToSidebarColumnHeader from './PinToSidebarColumnHeader';

const DIVIDER_STYLE: CSSProperties = {
  borderBottom: 'var(--stroke-standard) solid var(--color-stroke-default)',
};

/**
 * Column-header row for the dashboards table. The final column is the
 * hover-only chrome slot and intentionally renders an unlabeled `<th>`
 * with `aria-hidden` semantics so screen readers don't announce it.
 */
const DashboardsTableHeader: FC = () => {
  const t = useManagePageTranslations();
  return (
    <thead style={DIVIDER_STYLE}>
      <tr className='text-caption-medium content-muted'>
        {MANAGE_TABLE_COLUMNS.map((columnKey) => {
          if (columnKey === 'name') {
            return (
              <th
                key={columnKey}
                scope='col'
                className='text-align-x-left padding-x-medium padding-y-small'>
                {t.columnName}
              </th>
            );
          }
          if (columnKey === 'createdBy') {
            return (
              <th
                key={columnKey}
                scope='col'
                className='text-align-x-left padding-x-medium padding-y-small'>
                {t.columnCreatedBy}
              </th>
            );
          }
          if (columnKey === 'modifiedBy') {
            return (
              <th
                key={columnKey}
                scope='col'
                className='text-align-x-left padding-x-medium padding-y-small'>
                {t.columnModifiedBy}
              </th>
            );
          }
          if (columnKey === 'lastModified') {
            return (
              <th
                key={columnKey}
                scope='col'
                className='text-align-x-left padding-x-medium padding-y-small'>
                {t.columnLastModified}
              </th>
            );
          }
          if (columnKey === 'pinToSidebar') {
            return (
              <th
                key={columnKey}
                scope='col'
                className='text-align-x-left padding-x-medium padding-y-small'>
                <PinToSidebarColumnHeader />
              </th>
            );
          }
          return <th key={columnKey} scope='col' className='width-[120px]' aria-hidden='true' />;
        })}
      </tr>
    </thead>
  );
};

export default DashboardsTableHeader;
