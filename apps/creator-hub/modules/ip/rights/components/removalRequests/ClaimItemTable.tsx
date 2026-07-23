import React, { FunctionComponent, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  makeStyles,
  TableFooter,
  TablePagination,
} from '@rbx/ui';
import { RightsClaim } from '@modules/clients';
import { PageLoading } from '@modules/miscellaneous/common';
import { ClaimItemDiscoveredFromEnum } from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getDoc from '../../helpers/getDoc';
import useClaimItems from '../../hooks/useClaimItems';
import { ClaimContentRole } from '../../types/types';
import ClaimItemContentGrid from '../common/ClaimItemContentGrid';
import FileDisplay from '../createRemovalRequest/FileDisplay';
import ExpandableText from './ExpandableText';
import RemovalRequestStatus from './RemovalRequestStatus';
import SnapshotClaimContentGrid from '../common/SnapshotContentGrid';

interface ClaimItemTableProps {
  accountId: string;
  claim: RightsClaim;
}

const useStyles = makeStyles()((theme) => ({
  claimItemTable: {
    backgroundColor: theme.palette.surface[200],
    tableLayout: 'fixed',
  },

  claimItemDescription: {
    width: '21%',
  },
  statusColumn: {
    width: '16%',
  },
}));

const ClaimItemTable: FunctionComponent<React.PropsWithChildren<ClaimItemTableProps>> = ({
  accountId,
  claim,
}) => {
  const { isPending, error, claimItems } = useClaimItems(accountId, claim.id);
  const {
    classes: { claimItemTable, claimItemDescription, statusColumn },
  } = useStyles();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { ready, translate } = useTranslation();

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  let tableRows = [<React.Fragment key='default' />];
  if (isPending || !ready) {
    tableRows = [
      <TableRow key='loading'>
        <TableCell>
          <PageLoading />
        </TableCell>
      </TableRow>,
    ];
  } else if (error) {
    tableRows = [
      <TableRow key='error'>
        <TableCell colSpan={5} align='center'>
          <Typography color='error'>{translate('Error.SomethingWentWrong')}</Typography>
        </TableCell>
      </TableRow>,
    ];
  } else if (claimItems) {
    const currentPageItems = claimItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    tableRows = currentPageItems.map((claimItem) => {
      const docs = claimItem.originalDocuments?.map((d) => getDoc(d)) ?? [];
      const isFromSnapshot = claimItem.discoveredFrom === ClaimItemDiscoveredFromEnum.Snapshot;

      return (
        <TableRow key={claimItem.id ?? ''}>
          <TableCell className={claimItemDescription}>
            {isFromSnapshot ? (
              <SnapshotClaimContentGrid claim={claimItem} />
            ) : (
              <ClaimItemContentGrid claimItem={claimItem} role={ClaimContentRole.Infringing} />
            )}
          </TableCell>
          <TableCell className={claimItemDescription}>
            {claimItem.content ? (
              <ClaimItemContentGrid
                claimItem={claimItem}
                role={ClaimContentRole.Original}
                isMyCreation
              />
            ) : (
              <Typography variant='body2'>{translate('Label.NoOriginalContent')}</Typography>
            )}
          </TableCell>
          <TableCell className={statusColumn}>
            <RemovalRequestStatus claimItem={claimItem} />
          </TableCell>
          <TableCell className={claimItemDescription}>
            <ExpandableText>{claimItem.notes}</ExpandableText>
          </TableCell>
          <TableCell className={claimItemDescription}>
            <FileDisplay docs={docs} />
          </TableCell>
        </TableRow>
      );
    });
  }

  return (
    <TableContainer>
      <Table className={claimItemTable}>
        <TableHead>
          <TableRow>
            <TableCell className={claimItemDescription}>
              {translate('Label.ReportedCreation')}
            </TableCell>
            <TableCell className={claimItemDescription}>{translate('Label.MyCreation')}</TableCell>
            <TableCell className={statusColumn}>{translate('Label.Status')}</TableCell>
            <TableCell className={claimItemDescription}>{translate('Label.Description')}</TableCell>
            <TableCell className={claimItemDescription}>{translate('Label.Files')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{tableRows}</TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              style={{ borderBottom: 'none' }}
              rowsPerPageOptions={[5, 10, 25]}
              count={claimItems.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default withTranslation(ClaimItemTable, [TranslationNamespace.RightsPortal]);
