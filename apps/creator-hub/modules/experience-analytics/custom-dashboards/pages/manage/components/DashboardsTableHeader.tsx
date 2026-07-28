import type { FC } from 'react';
import { TableHeader, TableHeaderCell, TableRow } from '@rbx/foundation-ui';
import { useManagePageTranslations } from '../useManagePageTranslations';
import { MANAGE_TABLE_COLUMNS } from './manageTableColumns';
import PinToSidebarColumnHeader from './PinToSidebarColumnHeader';
import styles from './DashboardsTable.module.css';

/**
 * Column-header row for the dashboards table. The final column is the
 * hover-only chrome slot and intentionally renders an unlabeled `<th>`
 * with `aria-hidden` semantics so screen readers don't announce it.
 */
const DashboardsTableHeader: FC = () => {
  const t = useManagePageTranslations();
  return (
    <TableHeader className={styles.tableHeader}>
      <TableRow>
        {MANAGE_TABLE_COLUMNS.map((columnKey) => {
          if (columnKey === 'name') {
            return <TableHeaderCell key={columnKey}>{t.columnName}</TableHeaderCell>;
          }
          if (columnKey === 'createdBy') {
            return <TableHeaderCell key={columnKey}>{t.columnCreatedBy}</TableHeaderCell>;
          }
          if (columnKey === 'modifiedBy') {
            return <TableHeaderCell key={columnKey}>{t.columnModifiedBy}</TableHeaderCell>;
          }
          if (columnKey === 'lastModified') {
            return <TableHeaderCell key={columnKey}>{t.columnLastModified}</TableHeaderCell>;
          }
          if (columnKey === 'pinToSidebar') {
            return (
              <TableHeaderCell key={columnKey}>
                <PinToSidebarColumnHeader />
              </TableHeaderCell>
            );
          }
          return (
            <TableHeaderCell
              key={columnKey}
              className={styles.desktopActionsColumn}
              aria-hidden='true'>
              {null}
            </TableHeaderCell>
          );
        })}
      </TableRow>
    </TableHeader>
  );
};

export default DashboardsTableHeader;
