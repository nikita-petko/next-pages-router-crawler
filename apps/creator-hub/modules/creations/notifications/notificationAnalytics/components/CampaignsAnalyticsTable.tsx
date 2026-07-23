import type { ReactElement } from 'react';
import React, { useCallback, useState } from 'react';
import { ChartStyleMode } from '@rbx/analytics-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  CircularProgress,
  InfoOutlinedIcon,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ChartHeader from '@modules/charts-generic/charts/ChartHeader';
import GenericChartWrapper from '@modules/charts-generic/charts/GenericChartWrapper';
import HorizontalScrollWrapper from '@modules/experience-analytics-shared/components/HorizontalScrollWrapper';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { NotificationsContentCampaignAnalyticsTableRow } from '../../types/notificationAnalytics';
import { useNotificationsAnalyticsContext } from '../provider/NotificationsAnalyticsProvider';
import useCampaignAnalyticsTableStyles from '../styles/useCampaignAnalyticsTableStyles';

enum CampaignAnalyticsColumn {
  Name = 'campaignName',
  FirstImpressionDate = 'firstImpressionDate',
  Impressions = 'impressions',
  Clicks = 'clicks',
  ClickthroughRate = 'clickthroughRate',
  TurnoffRate = 'turnoffRate',
  DismissRate = 'dismissRate',
}

const CampaignAnalyticsColumns: Array<CampaignAnalyticsColumn> = [
  CampaignAnalyticsColumn.Name,
  CampaignAnalyticsColumn.FirstImpressionDate,
  CampaignAnalyticsColumn.Impressions,
  CampaignAnalyticsColumn.Clicks,
  CampaignAnalyticsColumn.ClickthroughRate,
  CampaignAnalyticsColumn.DismissRate,
  CampaignAnalyticsColumn.TurnoffRate,
];

const ColumnHeaders: Record<CampaignAnalyticsColumn, { title: string; tooltip: string }> = {
  [CampaignAnalyticsColumn.Name]: {
    title: 'Label.Name',
    tooltip: 'Tooltip.Table.CampaignAnalytics.Name',
  },
  [CampaignAnalyticsColumn.FirstImpressionDate]: {
    title: 'Label.Table.FirstImpressionDate',
    tooltip: 'Tooltip.Table.CampaignAnalytics.FirstImpressionDate',
  },
  [CampaignAnalyticsColumn.Impressions]: {
    title: 'Label.Impressions',
    tooltip: 'Tooltip.Table.CampaignAnalytics.Impressions',
  },
  [CampaignAnalyticsColumn.Clicks]: {
    title: 'Label.Clicks',
    tooltip: 'Tooltip.Table.CampaignAnalytics.Clicks',
  },
  [CampaignAnalyticsColumn.ClickthroughRate]: {
    title: 'Label.CTR',
    tooltip: 'Tooltip.Table.CampaignAnalytics.ClickthroughRate',
  },
  [CampaignAnalyticsColumn.TurnoffRate]: {
    title: 'Label.TurnoffRate',
    tooltip: 'Tooltip.Table.CampaignAnalytics.TurnoffRate',
  },
  [CampaignAnalyticsColumn.DismissRate]: {
    title: 'Label.DismissRate',
    tooltip: 'Tooltip.Table.CampaignAnalytics.DismissRate',
  },
};

type CampaignsAnalyticsTableProps = {
  isDataLoading: boolean;
  isUserForbidden: boolean;
  isResponseFailed: boolean;
};

type CampaignsAnalyticsTableBodyProps = {
  campaignList: NotificationsContentCampaignAnalyticsTableRow[];
  isFetchingData: boolean;
};

type CampaignsAnalyticsTableFooterProps = {
  rowsPerPage: number;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  page: number;
  handlePageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  totalRows: number;
};

const getFilteredCampaignList = (
  campaignList: NotificationsContentCampaignAnalyticsTableRow[],
  page: number,
  rowsPerPage: number,
) => {
  const startIndex = page * rowsPerPage;
  const endIndex = page * rowsPerPage + rowsPerPage;
  if (campaignList.length === 0 || startIndex >= campaignList.length) {
    return [];
  }
  return campaignList.slice(startIndex, endIndex);
};

const CampaignsAnalyticsTableTitle: React.FC<React.PropsWithChildren> = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  return (
    <ChartHeader
      title={translate(
        translationKey('Title.Table.CampaignAnalytics', TranslationNamespace.Notifications),
      )}
      definitionTooltip={translate(
        translationKey('Description.Table.CampaignAnalytics', TranslationNamespace.Notifications),
      )}
      exportButton={null}
    />
  );
};

const CampaignsAnalyticsTableHeader: React.FC<React.PropsWithChildren> = () => {
  const {
    classes: { tableHeaderCellContent },
  } = useCampaignAnalyticsTableStyles();
  const { translate } = useTranslation();

  return (
    <TableHead>
      <TableRow>
        {CampaignAnalyticsColumns.map((column): ReactElement<typeof TableCell> => {
          return (
            <TableCell key={column}>
              <div className={tableHeaderCellContent}>
                {translate(ColumnHeaders[column].title)}
                <Tooltip
                  title={translate(ColumnHeaders[column].tooltip)}
                  placement='bottom'
                  enterTouchDelay={0}
                  leaveTouchDelay={3000}>
                  <InfoOutlinedIcon fontSize='small' />
                </Tooltip>
              </div>
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
};

const CampaignsAnalyticsTableBody: React.FC<
  React.PropsWithChildren<CampaignsAnalyticsTableBodyProps>
> = ({ campaignList, isFetchingData }) => {
  return (
    <TableBody>
      {isFetchingData ? (
        <TableRow>
          <TableCell colSpan={CampaignAnalyticsColumns.length}>
            <EmptyGrid>
              <CircularProgress color='secondary' />
            </EmptyGrid>
          </TableCell>
        </TableRow>
      ) : (
        campaignList.map((campaign) => {
          return (
            <TableRow key={campaign.campaignName}>
              {CampaignAnalyticsColumns.map((column) => {
                return <TableCell key={column}>{campaign[column]}</TableCell>;
              })}
            </TableRow>
          );
        })
      )}
    </TableBody>
  );
};

const CampaignsAnalyticsTableFooter: React.FC<
  React.PropsWithChildren<CampaignsAnalyticsTableFooterProps>
> = ({ rowsPerPage, handleChangeRowsPerPage, page, handlePageChange, totalRows }) => {
  const { translate } = useTranslation();

  const displayLabelRows = useCallback(
    ({ from, to, count }: { from: number; to: number; count: number }) =>
      translate('Label.PageRange', {
        pageRange: `${from}-${to}`,
        totalPageCount: `${count}`,
      }),
    [translate],
  );
  return (
    <TableFooter>
      <TableRow>
        <TablePagination
          count={totalRows}
          page={page}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={translate('Label.RowsPerPage')}
          labelDisplayedRows={displayLabelRows}
        />
      </TableRow>
    </TableFooter>
  );
};

const CampaignsAnalyticsTable: React.FC<React.PropsWithChildren<CampaignsAnalyticsTableProps>> = ({
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
}) => {
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(0);
  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);
  const {
    notificationsContentAnalyticsSummary,
    notificationsContentAnalyticsList,
    isNotificationAnalyticsLoading,
  } = useNotificationsAnalyticsContext();

  const handlePageChange = useCallback(
    (_: React.MouseEvent<HTMLButtonElement> | null, pageNum: number) => {
      setPage(pageNum);
    },
    [],
  );

  const filteredCampaignList = getFilteredCampaignList(
    notificationsContentAnalyticsList,
    page,
    rowsPerPage,
  );

  return (
    <GenericChartWrapper
      header={<CampaignsAnalyticsTableTitle />}
      isDataLoading={isDataLoading}
      isResponseFailed={isResponseFailed}
      isUserForbidden={isUserForbidden}
      showNoDataMessage={!notificationsContentAnalyticsList.length}
      chartStyleMode={ChartStyleMode.Normal}>
      <HorizontalScrollWrapper>
        <Table>
          <CampaignsAnalyticsTableHeader />
          <CampaignsAnalyticsTableBody
            campaignList={filteredCampaignList}
            isFetchingData={isNotificationAnalyticsLoading}
          />
          <CampaignsAnalyticsTableFooter
            rowsPerPage={rowsPerPage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            page={page}
            handlePageChange={handlePageChange}
            totalRows={notificationsContentAnalyticsSummary.campaignCount}
          />
        </Table>
      </HorizontalScrollWrapper>
    </GenericChartWrapper>
  );
};

export default withTranslation(CampaignsAnalyticsTable, [
  TranslationNamespace.Notifications,
  TranslationNamespace.Analytics,
]);
