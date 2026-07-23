import { CategoryType, CreatorInsightBrackets } from '@rbx/clients/toolboxService';
import { useTranslation } from '@rbx/intl';
import { Grid, Card, CardContent, Typography } from '@rbx/ui';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { creatorHub } from '@modules/miscellaneous/common/urls';
import {
  ColumnType,
  GenericTableV2,
  CellDataType,
  TableColumnConfig,
  TableConfig,
  TableSortOrder,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { useFetchCreatorInsights } from '@modules/clients/ToolboxServiceQueries';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { UnifiedLogger } from '@rbx/unified-logger';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { eventStreamBaseUrl } from '@modules/eventStream/tracker';
import useCreatorInsightsTableStyles from './CreatorInsightsTable.styles';

export type CreatorInsightsTableProps = {
  assetType: CategoryType;
};

enum CreatorInsightsTableColumnKey {
  adoptionBracket = 'adoptionBracket',
  rank = 'rank',
  searchTerm = 'searchTerm',
  searchVolumeBracket = 'searchVolumeBracket',
}

const BracketNumberToTranslationKey: Record<CreatorInsightBrackets, string> = {
  [CreatorInsightBrackets.LOW]: 'Label.Low',
  [CreatorInsightBrackets.MEDIUM]: 'Label.Medium',
  [CreatorInsightBrackets.HIGH]: 'Label.High',
};

const pageSizeOptions = [10, 25, 50, 100];

const CreatorInsightsTable: FunctionComponent<CreatorInsightsTableProps> = ({ assetType }) => {
  const { translate } = useTranslation();
  const { classes: styles } = useCreatorInsightsTableStyles();
  const [sortOrder, setSortOrder] = useState<CreatorInsightsTableColumnKey>(
    CreatorInsightsTableColumnKey.rank,
  );
  const [order, setOrder] = React.useState<TableSortOrder>(TableSortOrder.desc);
  const unifiedLogger = useMemo(
    () =>
      new UnifiedLogger({
        product: 'CreatorDashboard',
        eventBaseUrl: eventStreamBaseUrl,
      }),
    [],
  );
  const {
    data: insightData,
    isPending: isInsightLoading,
    isError: isInsightError,
  } = useFetchCreatorInsights(assetType);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [assetType]);

  const handleLinkClick = useCallback(
    (text: string, rank: number, searchVolumeBracket: number, adoptionBracket: number) => {
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.ClickCreatorOpportunityTable,
        parameters: {
          adoptionBracket: adoptionBracket.toString(),
          assetType: assetType.toString(),
          rank: rank.toString(),
          searchTerm: text,
          searchVolumeBracket: searchVolumeBracket.toString(),
        },
      });
    },
    [assetType, unifiedLogger],
  );

  const handleSort = useCallback(
    (column: CreatorInsightsTableColumnKey) => {
      if (sortOrder !== column) {
        setSortOrder(column);
        setOrder(TableSortOrder.asc);
      } else {
        setOrder(order === TableSortOrder.asc ? TableSortOrder.desc : TableSortOrder.asc);
      }
      setPage(0);
    },
    [order, sortOrder],
  );

  const CreatorInsightsTableConfig: TableConfig<CreatorInsightsTableColumnKey> = {
    columnDivider: true,
    defaultActiveSort: CreatorInsightsTableColumnKey.rank,
    stickyFirstColumn: false,
    stickyHeader: false,
  };

  const CreatorInsightsTableColumnConfigs: Record<
    CreatorInsightsTableColumnKey,
    TableColumnConfig<CreatorInsightsTableColumnKey>
  > = {
    [CreatorInsightsTableColumnKey.searchTerm]: {
      columnKey: CreatorInsightsTableColumnKey.searchTerm,
      columnType: ColumnType.TextWithLink,
      titleKey: translationKey('Title.SearchTerm', TranslationNamespace.StoreAnalytics),
      widthWeight: 40,
    },
    [CreatorInsightsTableColumnKey.rank]: {
      columnKey: CreatorInsightsTableColumnKey.rank,
      columnType: ColumnType.Number,
      sort: {
        direction: order,
        onClick: (key: CreatorInsightsTableColumnKey) => {
          handleSort(key);
        },
      },
      titleKey: translationKey('Title.OpportunityRank', TranslationNamespace.StoreAnalytics),
      tooltipKey: translationKey(
        'Description.OpportunityRank',
        TranslationNamespace.StoreAnalytics,
      ),
      widthWeight: 15,
    },
    [CreatorInsightsTableColumnKey.searchVolumeBracket]: {
      columnKey: CreatorInsightsTableColumnKey.searchVolumeBracket,
      columnType: ColumnType.Text,
      titleKey: translationKey('Title.SearchVolume', TranslationNamespace.StoreAnalytics),
      tooltipKey: translationKey('Description.SearchVolume', TranslationNamespace.StoreAnalytics),
      sort: {
        direction: order,
        onClick: (key: CreatorInsightsTableColumnKey) => {
          handleSort(key);
        },
      },
      widthWeight: 15,
    },
    [CreatorInsightsTableColumnKey.adoptionBracket]: {
      columnKey: CreatorInsightsTableColumnKey.adoptionBracket,
      columnType: ColumnType.Text,
      titleKey: translationKey('Title.Adoption', TranslationNamespace.StoreAnalytics),
      tooltipKey: translationKey('Description.Adoption', TranslationNamespace.StoreAnalytics),
      sort: {
        direction: order,
        onClick: (key: CreatorInsightsTableColumnKey) => {
          handleSort(key);
        },
      },
      widthWeight: 15,
    },
  };

  const tableRowData = useMemo(() => {
    if (!insightData) {
      return [];
    }
    // Takes the enum value (0 - low, 1 - medium, 2 - high) or number (in opportunity rank) to provide the sorting
    // If the enum values are equal sort by the opportunity rank
    const orderedInsightData = insightData.sort((firstElement, secondElement) => {
      const sortOrderKey = sortOrder as keyof typeof CreatorInsightsTableColumnKey;
      const firstElementNumber = (firstElement[sortOrderKey] ?? -1) as number;
      const secondElementNumber = (secondElement[sortOrderKey] ?? -1) as number;
      if (
        sortOrder !== CreatorInsightsTableColumnKey.rank &&
        firstElementNumber === secondElementNumber
      ) {
        return (secondElement.rank ?? -1) - (firstElement.rank ?? -1);
      }
      return firstElementNumber - secondElementNumber;
    });
    if (order === TableSortOrder.asc) {
      orderedInsightData.reverse();
    }
    return insightData.map((data) => {
      if (
        !data.searchTerm ||
        data.rank === undefined ||
        data.searchVolumeBracket === undefined ||
        data.adoptionBracket === undefined
      ) {
        return new Map();
      }
      const rowData: Map<CreatorInsightsTableColumnKey, CellDataType> = new Map();
      const text = data.searchTerm.toLowerCase();
      rowData.set(CreatorInsightsTableColumnKey.searchTerm, {
        type: ColumnType.TextWithLink,
        href: creatorHub.creatorStore.getSearchUrl(assetType, text),
        newTab: true,
        onClick: () =>
          handleLinkClick(
            text,
            data.rank ?? -1,
            data.searchVolumeBracket ?? -1,
            data.adoptionBracket ?? -1,
          ),
        text,
      });
      rowData.set(CreatorInsightsTableColumnKey.rank, {
        type: ColumnType.Number,
        value: data.rank,
      });
      rowData.set(CreatorInsightsTableColumnKey.searchVolumeBracket, {
        type: ColumnType.Text,
        value: translate(BracketNumberToTranslationKey[data.searchVolumeBracket]),
      });
      rowData.set(CreatorInsightsTableColumnKey.adoptionBracket, {
        type: ColumnType.Text,
        value: translate(BracketNumberToTranslationKey[data.adoptionBracket]),
      });
      return rowData;
    });
  }, [assetType, handleLinkClick, insightData, order, sortOrder, translate]);

  const paginatedRows = useMemo(() => {
    const start = page * pageSize;
    const end = start + pageSize;
    return tableRowData.slice(start, end);
  }, [page, pageSize, tableRowData]);

  const total = useMemo(() => tableRowData.length, [tableRowData]);

  const onNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const onPreviousPage = useCallback(() => {
    setPage((prev) => prev - 1);
  }, []);

  const setPageSizeCallback = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      setPage((currentPage) => Math.floor((currentPage * pageSize) / newPageSize));
    },
    [pageSize],
  );

  const hasNext = useMemo(() => page * pageSize + pageSize < total, [page, pageSize, total]);

  const hasPrevious = useMemo(() => page > 0, [page]);

  if (!isInsightLoading && (!insightData || insightData.length === 0)) {
    return (
      <Card className={styles.noResultsContainer}>
        <CardContent>
          <Grid container direction='row' justifyContent='center' alignItems='center'>
            <Grid item>
              <Typography variant='body2'>{translate('Label.NoResults')}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <GenericTableV2
      columnConfigs={Object.values(CreatorInsightsTableColumnConfigs)}
      getRowKey={(_, index) => index.toString()}
      isDataLoading={isInsightLoading}
      isResponseFailed={isInsightError}
      isUserForbidden={false}
      rowData={paginatedRows}
      tableConfig={CreatorInsightsTableConfig}
      pagination={{
        page,
        total,
        pageSize,
        pageSizeOptions,
        setPageSize: setPageSizeCallback,
        onNextPage,
        onPreviousPage,
        hasNext,
        hasPrevious,
      }}
    />
  );
};

export default CreatorInsightsTable;
