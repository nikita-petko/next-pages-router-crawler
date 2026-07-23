import { AssetConsumerAction } from '@rbx/clients/assetPermissionsApi';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@rbx/ui';
import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import usePermissionDeveloperItemTableStyles from './PermissionDeveloperItemTable.styles';

export enum SubjectModification {
  Added,
  Removed,
}

export type SharedSubjectDetails = {
  access: AssetConsumerAction;
  canRemoved?: boolean;
  subjectId: number;
  subjectModification?: SubjectModification;
  subjectName: string;
  thumbnail: React.ReactNode;
};

export interface MediaPermissionManagerStateCardProps {
  onItemRemove: (itemId: number) => void;
  sharedSubjectDetailsList: Map<number, SharedSubjectDetails>;
  subject: string;
}

const PermissionDeveloperItemTable: FunctionComponent<
  React.PropsWithChildren<MediaPermissionManagerStateCardProps>
> = ({ onItemRemove, sharedSubjectDetailsList, subject }) => {
  const { translate } = useTranslation();
  const {
    classes: { avatarCell, buttonText, paginationStyle },
  } = usePermissionDeveloperItemTableStyles();
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const handlePageChange = useCallback(
    (_: React.MouseEvent<HTMLButtonElement> | null, pageNum: number) => setPage(pageNum),
    [],
  );
  const permissionTranslationMap = {
    [AssetConsumerAction.Use]: translate('Message.Use'),
  };

  const displayDetailsList = useMemo(() => {
    const detailsList = Array.from(sharedSubjectDetailsList.values());
    return rowsPerPage > 0
      ? detailsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : detailsList;
  }, [sharedSubjectDetailsList, page, rowsPerPage]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const displayLabelRows = useCallback(
    ({ from, to, count }: { from: number; to: number; count: number }) =>
      translate('Label.PageRange', {
        pageRange: `${from}-${to}`,
        totalPageCount: `${count}`,
      }),
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sharedSubjectDetailsList, rowsPerPage, translate],
  );

  return (
    <Grid container item XSmall={12}>
      <Grid item XSmall={12}>
        <TableContainer>
          <Table size='medium' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>{subject}</TableCell>
                <TableCell>{translate('Label.Access')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {displayDetailsList.map((experienceDetail) => (
                <TableRow key={experienceDetail.subjectId}>
                  <TableCell>
                    <Grid container classes={{ root: avatarCell }}>
                      <Grid item>{experienceDetail.thumbnail}</Grid>
                      <Grid item>
                        <Grid item>
                          <Typography variant='h6'>{experienceDetail.subjectName}</Typography>
                        </Grid>
                        <Grid item>
                          <Typography variant='body1'>{experienceDetail.subjectId}</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </TableCell>
                  <TableCell>
                    {experienceDetail.access in permissionTranslationMap
                      ? permissionTranslationMap[
                          experienceDetail.access as keyof typeof permissionTranslationMap // We check that the access level translation does exist in the translation map
                        ]
                      : translate('Message.Use')}
                  </TableCell>
                  <TableCell align='right'>
                    {experienceDetail.canRemoved ? (
                      <Button
                        classes={{ root: buttonText }}
                        color='destructive'
                        onClick={() => onItemRemove(experienceDetail.subjectId)}
                        variant='text'>
                        {translate('Action.Remove')}
                      </Button>
                    ) : (
                      <Button
                        classes={{ root: buttonText }}
                        color='primary'
                        disabled
                        variant='text'>
                        {translate('Action.Added')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  classes={{ root: paginationStyle }}
                  count={sharedSubjectDetailsList.size}
                  labelDisplayedRows={displayLabelRows}
                  labelRowsPerPage={translate('Label.RowsPerPage')}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default React.memo(PermissionDeveloperItemTable);
