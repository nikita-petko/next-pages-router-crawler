import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CircularProgress,
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
import { EmptyGrid } from '@modules/miscellaneous/common';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import AccountActivityInRowDate from '../AccountActivityInRowDate/AccountActivityInRowDate';
import AccountActivityStatementLink from '../AccountActivityStatementLink/AccountActivityStatementLink';
import { ActivityRowInfo, ActivityType } from '../../types';
import AccountActivityFilter from '../AccountActivityFilter/AccountActivityFilter';
import useAccountActivityStyles from './AccountActivity.styles';

export type AccountActivityProps = {
  data: ActivityRowInfo[];
  isLoading: boolean;
};

export const AccountActivity: FunctionComponent<AccountActivityProps> = ({ data, isLoading }) => {
  const {
    classes: { descriptionText },
  } = useAccountActivityStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const currentPageData = useMemo(() => {
    return rowsPerPage > 0
      ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : data;
  }, [data, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [data]);

  return (
    <Grid item container spacing='32px' direction='row' XSmall={12} XLarge={11}>
      <Grid item XSmall={12}>
        <Typography variant='h4' component='h4'>
          {translate(translationKey('Heading.BillingHistory', TranslationNamespace.CloudServices))}
        </Typography>
        <Typography variant='body2' color='secondary' component='div' className={descriptionText}>
          {translate(
            translationKey('Description.BillingHistory', TranslationNamespace.CloudServices),
          )}
        </Typography>
      </Grid>
      <AccountActivityFilter />
      <Grid item XSmall={12}>
        {isLoading ? (
          <EmptyGrid>
            <CircularProgress />
          </EmptyGrid>
        ) : (
          <TableContainer data-testid='activities-table'>
            <Table size='medium' stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    {translate(translationKey('Label.Date', TranslationNamespace.CloudServices))}
                  </TableCell>
                  <TableCell align='left'>
                    {translate(translationKey('Label.Amount', TranslationNamespace.CloudServices))}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {currentPageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} data-testid='no-activities-message'>
                      {translate(
                        translationKey('Message.NoActivity', TranslationNamespace.CloudServices),
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPageData.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <AccountActivityInRowDate type={ActivityType.Bill} date={activity.date} />
                      </TableCell>
                      <TableCell align='left'>{formatter.format(activity.amount)}</TableCell>
                      <TableCell align='right'>
                        <AccountActivityStatementLink
                          date={activity.date}
                          label={translate(
                            translationKey('Action.ViewBill', TranslationNamespace.CloudServices),
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow data-testid='pagination-row'>
                  <TablePagination
                    count={data.length}
                    page={page}
                    rowsPerPageOptions={[
                      5,
                      10,
                      25,
                      {
                        label: translate(translationKey('Label.All', TranslationNamespace.Table)),
                        value: -1,
                      },
                    ]}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(e, pageNum) => setPage(pageNum)}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={translate(
                      translationKey('Label.RowsPerPage', TranslationNamespace.Table),
                    )}
                    labelDisplayedRows={({ from, to, count }) =>
                      translate(translationKey('Label.PageRange', TranslationNamespace.Table), {
                        pageRange: `${from}-${rowsPerPage === -1 ? data.length : to}`,
                        totalPageCount: `${count}`,
                      })
                    }
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}
      </Grid>
    </Grid>
  );
};

export default withTranslation(AccountActivity, [TranslationNamespace.CloudServices]);
