import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Table, TableContainer, TableFooter, TablePagination, TableRow } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { ConfigureExperienceNotificationResponse } from '@modules/clients/notifications';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { notificationStringListLoaded } from '../../constants/notificationEventConstants';
import useNotificationContentListStyles from '../styles/notificationContentList';
import CreateNotificationContentButton from './CreateNotificationContentButton';
import NotificationsContentListBody from './NotificationsContentListBody';
import NotificationsContentListHeader from './NotificationsContentListHeader';

export type NotificationsContentListProps = {
  list: ConfigureExperienceNotificationResponse[];
  universeId: number;
};
const NotificationsContentList: FC<React.PropsWithChildren<NotificationsContentListProps>> = ({
  list,
  universeId,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const {
    classes: { createNotificationContentButton, paginationStyle },
  } = useNotificationContentListStyles();
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const handlePageChange = useCallback(
    (_: React.MouseEvent<HTMLButtonElement> | null, pageNum: number) => setPage(pageNum),
    [],
  );
  const { user } = useAuthentication();

  const displayUpdatesList = useMemo(() => {
    return rowsPerPage > 0
      ? list.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : list;
  }, [list, page, rowsPerPage]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const displayLabelRows = useCallback(
    ({ from, to, count }: { from: number; to: number; count: number }) =>
      translate('Label.PageRange', {
        pageRange: `${from}-${rowsPerPage === -1 ? list.length : to}`,
        totalPageCount: `${count}`,
      }),
    [list, rowsPerPage, translate],
  );

  useEffect(() => {
    trackerClient.sendEvent(notificationStringListLoaded(user?.id, universeId));
  }, [trackerClient, universeId, user?.id]);

  return (
    <Grid container>
      <Grid item XSmall={12} className={createNotificationContentButton}>
        <CreateNotificationContentButton universeId={universeId} />
      </Grid>
      <Grid item XSmall={12}>
        <TableContainer>
          <Table size='medium' stickyHeader>
            <NotificationsContentListHeader />
            <NotificationsContentListBody
              displayUpdatesList={displayUpdatesList}
              universeId={universeId}
            />
            <TableFooter>
              <TableRow>
                <TablePagination
                  classes={{ root: paginationStyle }}
                  count={list.length}
                  page={page}
                  rowsPerPageOptions={[5, 10, 25, 50, { label: translate('Label.All'), value: -1 }]}
                  rowsPerPage={rowsPerPage}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage={translate('Label.RowsPerPage')}
                  labelDisplayedRows={displayLabelRows}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default NotificationsContentList;
