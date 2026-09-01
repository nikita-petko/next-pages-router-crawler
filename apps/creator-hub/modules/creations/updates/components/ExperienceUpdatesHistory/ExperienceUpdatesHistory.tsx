import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameUpdateMessageModel } from '@rbx/client-game-update-notifications/v1';
import { useLocalization, useTranslation, Locale } from '@rbx/intl';
import {
  Grid,
  InfoOutlinedIcon,
  OpenInNewIcon,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@rbx/ui';
import type { CreatorType } from '@modules/miscellaneous/common';
import { www } from '@modules/miscellaneous/urls';
import useExperienceUpdatesHistoryStyles from './ExperienceUpdatesHistory.styles';

export interface ExperienceUpdatesHistoryProps {
  experienceUpdatesList: GameUpdateMessageModel[];
}

const ExperienceUpdatesHistory: FunctionComponent<
  React.PropsWithChildren<ExperienceUpdatesHistoryProps>
> = ({ experienceUpdatesList }) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const {
    classes: { historyTitle, tooltipIcon, tableHeadTitle, linkIcon, paginationStyle },
  } = useExperienceUpdatesHistoryStyles();
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const displayUpdatesList = useMemo(() => {
    return rowsPerPage > 0
      ? experienceUpdatesList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : experienceUpdatesList;
  }, [experienceUpdatesList, page, rowsPerPage]);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const formatDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return formatter.format;
  }, [locale]);

  const formatSender = useCallback(
    (senderName?: string, senderId?: number, senderType?: string) => {
      if (!senderName || !senderId || !senderType) {
        return '';
      }
      const url = www.getCreatorUrl(senderType as CreatorType, senderId);
      if (!url) {
        return senderName;
      }
      return (
        <Link href={url} target='_blank'>
          <span>{senderName}</span>
          <OpenInNewIcon classes={{ root: linkIcon }} />
        </Link>
      );
    },
    [linkIcon],
  );

  const calculateRatio = useCallback((numerator?: number, denominator?: number) => {
    if (numerator && denominator && numerator > 0 && denominator > 0) {
      return `${((numerator / denominator) * 100).toFixed(1)}%`;
    }
    return '--';
  }, []);

  const resetPage = useCallback(() => setPage(0), []);

  useEffect(() => {
    resetPage();
  }, [experienceUpdatesList, resetPage]);

  return (
    <Grid container>
      <Grid item XSmall={12} classes={{ root: historyTitle }}>
        <Typography variant='h2' component='h2'>
          {translate('Heading.UpdatesHistory')}
        </Typography>
      </Grid>
      <Grid item XSmall={12}>
        {experienceUpdatesList.length === 0 ? (
          <Typography variant='body1' color='secondary'>
            {translate('Message.NoUpdatesHistory')}
          </Typography>
        ) : (
          <TableContainer>
            <Table size='medium' stickyHeader>
              <TableHead classes={{ root: tableHeadTitle }}>
                <TableRow>
                  <TableCell>{translate('Label.Date')}</TableCell>
                  <TableCell>{translate('Label.Sender')}</TableCell>
                  <TableCell>{translate('Label.Message')}</TableCell>
                  <TableCell>
                    <span>{translate('Label.Views')}</span>
                    <Tooltip title={translate('Tooltips.Views')} arrow>
                      <InfoOutlinedIcon classes={{ root: tooltipIcon }} />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <span>{translate('Label.VisitRate')}</span>
                    <Tooltip title={translate('Tooltips.VisitRate')} arrow>
                      <InfoOutlinedIcon classes={{ root: tooltipIcon }} />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <span>{translate('Label.UnfollowRate')}</span>
                    <Tooltip title={translate('Tooltips.UnfollowRate')} arrow>
                      <InfoOutlinedIcon classes={{ root: tooltipIcon }} />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayUpdatesList.map((update) => (
                  <TableRow key={update.createdOnKey}>
                    <TableCell>{update.createdOn ? formatDate(update.createdOn) : ''}</TableCell>
                    <TableCell>
                      {formatSender(update.creatorName!, update.creatorId, update.creatorType!)}
                    </TableCell>
                    <TableCell>{update.content}</TableCell>
                    <TableCell>
                      {update.impressions && update.impressions > 0 ? update.impressions : '--'}
                    </TableCell>
                    <TableCell>{calculateRatio(update.plays, update.impressions)}</TableCell>
                    <TableCell>{calculateRatio(update.unfollows, update.impressions)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    classes={{ root: paginationStyle }}
                    count={experienceUpdatesList.length}
                    page={page}
                    rowsPerPageOptions={[5, 10, 25, { label: translate('Label.All'), value: -1 }]}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(e, pageNum) => setPage(pageNum)}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={translate('Label.RowsPerPage')}
                    labelDisplayedRows={({ from, to, count }) =>
                      translate('Label.PageRange', {
                        pageRange: `${from}-${
                          rowsPerPage === -1 ? experienceUpdatesList.length : to
                        }`,
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

export default ExperienceUpdatesHistory;
