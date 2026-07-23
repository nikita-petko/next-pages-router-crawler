import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GetDeveloperSubscriptionsAnalyticsResponse } from '@rbx/client-developer-subscriptions-api/v1';
import {
  DeveloperSubscriptionsAnalyticsDimension,
  DeveloperSubscriptionsAnalyticsMetric,
  MetricGranularity,
  ProductStatusType,
} from '@rbx/client-developer-subscriptions-api/v1';
import { numberFormatter } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import {
  RobuxIcon,
  Table,
  TableCell,
  TableSortLabel,
  TableRow,
  TableHead,
  TableContainer,
  Tooltip,
  InfoOutlinedIcon,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatSingleDate } from '@modules/charts-generic/charts/formatters/timeFormatters';
import useLocale from '@modules/charts-generic/context/useLocale';
import GenericTableBodyWrapper from '@modules/charts-generic/tables/GenericTableBodyWrapper';
import { validateResponse } from '@modules/charts-generic/types/RAQIValidator';
import type { RAQIResponse } from '@modules/clients/analytics';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useExperienceSubscriptionsClientProvider } from '../context/ExperienceSubscriptionsClientProvider';
import type { ExperienceSubscriptionsTableRowSpec } from '../types/ExperienceSubscriptionsTableTypes';
import useRoundedTableStyles from './common/roundedTable.styles';
import useExperienceSubscriptionsHistoryTableStyles from './ExperienceSubscriptionsHistoryTable.styles';

const productStatusToTranslationKey = (status?: ProductStatusType) => {
  switch (status) {
    case ProductStatusType.Active:
      return translationKey('ProductStatus.Active', TranslationNamespace.ExperienceSubscriptions);
    case ProductStatusType.OffSale:
    case ProductStatusType.Inactive:
    case ProductStatusType.ToBeActivated:
    case ProductStatusType.ToBeDeactivated:
      return translationKey('ProductStatus.Inactive', TranslationNamespace.ExperienceSubscriptions);
    case ProductStatusType.ToBeDeleted:
    case ProductStatusType.Deleted:
      return translationKey('ProductStatus.Deleted', TranslationNamespace.ExperienceSubscriptions);
    default: {
      const exhaustiveCheck: never | undefined = status;
      throw new Error(`Unrecognized product status ${exhaustiveCheck}.`);
    }
  }
};

function ExperienceSubscriptionsHistoryTable() {
  const { translate } = useTranslationWrapper(useTranslation());
  const { experienceSubscriptionsClient } = useExperienceSubscriptionsClientProvider();
  const { classes: rounded } = useRoundedTableStyles();
  const { classes } = useExperienceSubscriptionsHistoryTableStyles();
  const { id: universeId } = useUniverseResource();

  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [isUserForbidden, setIsUserForbidden] = useState<boolean>(false);
  const [isResponseFailed, setIsResponseFailed] = useState<boolean>(false);
  const [noHistory, setNoHistory] = useState<boolean>(false);

  const [tableRows, setTableRows] = useState<ExperienceSubscriptionsTableRowSpec[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const locale = useLocale();

  // Sort function
  const sortRows = useCallback(
    (a: ExperienceSubscriptionsTableRowSpec, b: ExperienceSubscriptionsTableRowSpec) => {
      const isReversed = sortOrder === 'asc' ? 1 : -1;
      return a.name > b.name ? 1 * isReversed : -1 * isReversed;
    },
    [sortOrder],
  );

  const getProductNameToDataMappingForUniverse = useCallback(async (): Promise<
    Map<string, ExperienceSubscriptionsTableRowSpec>
  > => {
    try {
      setIsUserForbidden(false);
      const { priceTierPrices } = await experienceSubscriptionsClient.getPriceInfo(universeId);
      const subscriptionPriceMap = priceTierPrices ?? {};
      const { developerSubscriptions } =
        await experienceSubscriptionsClient.getExperienceSubscriptions(universeId, '');
      const productNameToRowMapping = new Map<string, ExperienceSubscriptionsTableRowSpec>(
        developerSubscriptions
          ?.filter(
            (product) =>
              product.initialActivationTimestampMs !== null &&
              product.initialActivationTimestampMs !== 0,
          )
          .map((product) => [
            product.name ?? '',
            {
              name: product.name ?? '',
              activationDate: formatSingleDate(
                locale,
                new Date(product.initialActivationTimestampMs ?? 0),
                'UTC',
              ),
              status: product.productStatusType,
              price: subscriptionPriceMap[product.basePriceId ?? ''],
              priceInRobux: product.priceInRobux ?? null,
            },
          ]),
      );
      return productNameToRowMapping;
    } catch (e) {
      const err = e as { status?: number };
      const errorCode = err?.status ?? 500;
      if (errorCode === HttpStatusCodes.FORBIDDEN) {
        setIsUserForbidden(true);
      }
      throw e;
    }
  }, [universeId, experienceSubscriptionsClient, locale]);

  const getExperienceSubscriptionsAnalyticsHistory = useCallback(
    async (
      metric: DeveloperSubscriptionsAnalyticsMetric,
    ): Promise<RAQIResponse<DeveloperSubscriptionsAnalyticsDimension>> => {
      let response: GetDeveloperSubscriptionsAnalyticsResponse;
      try {
        setIsUserForbidden(false);
        response = await experienceSubscriptionsClient.getAnalytics(
          metric,
          [DeveloperSubscriptionsAnalyticsDimension.DeveloperSubscriptionProduct],
          new Date(2023, 8, 1), // StartDate = 09/01/2023 i.e. just before the launch of experience subscriptions. This way we get the entire history of all products.
          new Date(Date.now()), // UtcToday
          universeId,
          null,
          MetricGranularity.None,
        );
      } catch (e) {
        const err = e as { status?: number };
        const errorCode = err?.status ?? 500;
        if (errorCode === HttpStatusCodes.FORBIDDEN) {
          setIsUserForbidden(true);
        }
        throw e;
      }

      // Asserts that the analytics returned from the RAQI-format API are valid
      return validateResponse(response, {
        dimensionEnum: DeveloperSubscriptionsAnalyticsDimension,
      });
    },
    [universeId, experienceSubscriptionsClient],
  );

  const getHistoryTableRows = useCallback(async () => {
    try {
      setIsDataLoading(true);
      setIsResponseFailed(false);
      setNoHistory(false);
      const productNameToRowMapping = await getProductNameToDataMappingForUniverse();
      const totalSubscriptionSaleBreakdown = await getExperienceSubscriptionsAnalyticsHistory(
        DeveloperSubscriptionsAnalyticsMetric.DeveloperSubscriptionSales,
      );
      const totalEstimatedRevenueBreakdown = await getExperienceSubscriptionsAnalyticsHistory(
        DeveloperSubscriptionsAnalyticsMetric.DeveloperSubscriptionRevenue,
      );

      totalSubscriptionSaleBreakdown?.values.forEach((metricValue) => {
        const productName = metricValue.breakdowns[0].value; // This is a one-dimensional breakdown by product Name
        const total = metricValue.datapoints[0].value ?? 0; // Only one datapoint is expected since this is a total over the history of the product
        const row = productNameToRowMapping.get(productName);
        if (row) {
          row.subscriptions = total;
        }
      });

      totalEstimatedRevenueBreakdown?.values.forEach((metricValue) => {
        const productName = metricValue.breakdowns[0].value; // This is a one-dimensional breakdown by product Name
        const total = metricValue.datapoints[0].value ?? 0; // Only one datapoint is expected since this is a total over the history of the product
        const row = productNameToRowMapping.get(productName);
        if (row) {
          row.revenue = total;
        }
      });

      const rows: ExperienceSubscriptionsTableRowSpec[] = Array.from(
        productNameToRowMapping.values(),
      );
      if (rows.length === 0) {
        setNoHistory(true);
      }
      setIsDataLoading(false);
      setTableRows(rows);
    } catch {
      setIsDataLoading(false);
      setIsResponseFailed(true);
      setTableRows([]);
    }
  }, [getProductNameToDataMappingForUniverse, getExperienceSubscriptionsAnalyticsHistory]);

  useEffect(() => {
    getHistoryTableRows();
  }, [getHistoryTableRows]);

  const formatPrice = useCallback((row: ExperienceSubscriptionsTableRowSpec) => {
    if (row.price) {
      return numberFormatter((row.price.units ?? 0) + (row.price.cents ?? 0) / 100, 'currency');
    }
    if (row.priceInRobux != null) {
      return `R$ ${row.priceInRobux.toLocaleString()}`;
    }
    return '—';
  }, []);

  // Recomputed whenever sort order or rows change
  const sortedRows = useMemo(() => {
    return [...tableRows].sort(sortRows);
  }, [tableRows, sortRows]);

  // Handle sort label click
  const handleSortClick = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <TableContainer className={classes.tableContainer}>
      <Table className={rounded.table}>
        <TableHead>
          <TableRow>
            <TableCell className={classes.nameCell}>
              <TableSortLabel direction={sortOrder} onClick={handleSortClick}>
                {translate(
                  translationKey(
                    'Label.SubscriptionName',
                    TranslationNamespace.ExperienceSubscriptions,
                  ),
                )}
              </TableSortLabel>
            </TableCell>
            <TableCell className={classes.dateCell}>
              {translate(
                translationKey(
                  'Label.ActivationDate',
                  TranslationNamespace.ExperienceSubscriptions,
                ),
              )}
            </TableCell>
            <TableCell className={classes.statusCell}>
              {translate(
                translationKey('Label.CurrentStatus', TranslationNamespace.ExperienceSubscriptions),
              )}
            </TableCell>
            <TableCell className={classes.priceCell}>
              {translate(
                translationKey('Label.Price', TranslationNamespace.ExperienceSubscriptions),
              )}
              <Tooltip
                title={translate(
                  translationKey('Description.Price', TranslationNamespace.ExperienceSubscriptions),
                )}
                placement='bottom'
                enterTouchDelay={0}
                leaveTouchDelay={3000}>
                <span className={classes.tooltipIcon}>
                  <InfoOutlinedIcon fontSize='small' />
                </span>
              </Tooltip>
            </TableCell>
            <TableCell className={classes.subscriptionsCell}>
              {translate(
                translationKey(
                  'Label.TotalSubscriptions',
                  TranslationNamespace.ExperienceSubscriptions,
                ),
              )}
              <Tooltip
                title={translate(
                  translationKey(
                    'Description.TotalSubscriptions',
                    TranslationNamespace.ExperienceSubscriptions,
                  ),
                )}
                placement='bottom'
                enterTouchDelay={0}
                leaveTouchDelay={3000}>
                <span className={classes.tooltipIcon}>
                  <InfoOutlinedIcon fontSize='small' />
                </span>
              </Tooltip>
            </TableCell>
            <TableCell className={classes.revenueCell}>
              {translate(
                translationKey(
                  'Label.EstimatedRevenue',
                  TranslationNamespace.ExperienceSubscriptions,
                ),
              )}
              <Tooltip
                title={translate(
                  translationKey(
                    'Description.Revenue',
                    TranslationNamespace.ExperienceSubscriptions,
                  ),
                )}
                placement='bottom'
                enterTouchDelay={0}
                leaveTouchDelay={3000}>
                <span className={classes.tooltipIcon}>
                  <InfoOutlinedIcon fontSize='small' />
                </span>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <GenericTableBodyWrapper
          isDataLoading={isDataLoading}
          isResponseFailed={isResponseFailed}
          isUserForbidden={isUserForbidden}
          showNoDataMessage={noHistory}>
          {sortedRows.map((row) => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.activationDate}</TableCell>
              <TableCell>{translate(productStatusToTranslationKey(row.status))}</TableCell>
              <TableCell>{formatPrice(row)}</TableCell>
              <TableCell>{row.subscriptions?.toLocaleString() ?? '0'}</TableCell>
              <TableCell>
                <div className={classes.revenueContent}>
                  <RobuxIcon fontSize='small' />
                  <span>{row.revenue?.toLocaleString() ?? 0}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </GenericTableBodyWrapper>
      </Table>
    </TableContainer>
  );
}

export default ExperienceSubscriptionsHistoryTable;
