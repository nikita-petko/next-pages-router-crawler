import { useState } from 'react';
import type { ClaimItem } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ClaimByMeRow from './ClaimByMeRow';

enum Order {
  Asc = 'asc',
  Desc = 'desc',
}

enum OrderBy {
  None = 'none',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
}

const useStyles = makeStyles()(() => ({
  table: {
    tableLayout: 'fixed',
  },
  description: {
    width: '21%',
  },
  statusColumn: {
    width: '20%',
  },
  shortColumn: {
    width: '15%',
  },
}));

/**
 *  ClaimsByMeTable displays a table of claims that I filed
 */
const ClaimsByMeTable = ({ claimItems }: { claimItems: ClaimItem[] }) => {
  const { ready, translate } = useTranslation();

  const {
    classes: { table, description, statusColumn, shortColumn },
  } = useStyles();

  const sortableCells = [
    { id: OrderBy.CreatedAt, label: 'Label.CreatedDate' },
    { id: OrderBy.UpdatedAt, label: 'Label.UpdatedDate' },
  ];

  const [order, setOrder] = useState<Order>(Order.Asc);
  const [orderBy, setOrderBy] = useState<OrderBy>(OrderBy.None);

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === Order.Asc;
    setOrder(isAsc ? Order.Desc : Order.Asc);
    setOrderBy(property);
  };

  if (!ready) {
    return <PageLoading />;
  }

  const rows = claimItems
    .sort((a, b) => {
      const multiplier = order === Order.Asc ? 1 : -1;
      switch (orderBy) {
        case OrderBy.CreatedAt:
          if (!a.createdAt || !b.createdAt) {
            return 0;
          }
          return multiplier * (a.createdAt.getTime() - b.createdAt.getTime());
        case OrderBy.UpdatedAt:
          if (!a.updatedAt || !b.updatedAt) {
            return 0;
          }
          return multiplier * (a.updatedAt.getTime() - b.updatedAt.getTime());
        default:
          return 0;
      }
    })
    .map((claimItem) => <ClaimByMeRow key={claimItem.id} claim={claimItem} />);

  return (
    <TableContainer>
      <Table className={table}>
        <TableHead>
          <TableRow>
            <TableCell className={description}>{translate('Label.ClaimedCreation')}</TableCell>
            <TableCell className={description}>{translate('Label.MyCreation')}</TableCell>
            <TableCell className={statusColumn}>{translate('Label.Status')}</TableCell>
            <TableCell className={shortColumn}>{translate('Label.ID')}</TableCell>
            {sortableCells.map((row) => (
              <TableCell className={shortColumn} key={row.id}>
                <TableSortLabel
                  active={orderBy === row.id}
                  direction={orderBy === row.id ? order : 'asc'}
                  onClick={() => handleRequestSort(row.id)}>
                  {translate(row.label)}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default withTranslation(ClaimsByMeTable, [
  TranslationNamespace.GameLocalizationTranslators,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Error,
  TranslationNamespace.RightsPortal,
]);
