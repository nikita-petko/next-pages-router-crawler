import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { dateTimeFormatter } from '@rbx/core';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import { Grid, InfoOutlinedIcon, makeStyles, Tooltip, Typography } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  formatNumberWithSpec,
  NumberContext,
} from '@modules/charts-generic/charts/numberFormatters';
import { TableCellBackgroundColor } from '@modules/charts-generic/charts/options';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import useLocale from '@modules/charts-generic/context/useLocale';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import {
  CellBackgroundType,
  ColumnType,
  type TableColumnConfig,
} from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  CellDataType,
  TableConfig,
  TableValueTypes,
} from '@modules/charts-generic/tables/types/GenericTableType';
import { getComparisonChipSpec } from '@modules/charts-generic/utils/comparisonChipUtils';
import getAnalyticsMetricDisplayConfig from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { generateAnalyticsNumberFormattingSpec } from '@modules/experience-analytics-shared/utils/analyticsNumberFormattingSpec';
import type { RAQIV2QueryResponses } from '@modules/experience-analytics-shared/utils/combineRAQIV2QueryResponses';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import { ExperimentMetric } from '../../api/universeExperimentationClientEnums';
import type {
  ValidExperimentConfiguration,
  ValidExperimentVariantsResults,
} from '../../api/validExperimentationTypes';
import ConfidenceIntervalDialog from './ConfidenceIntervalDialog';
import type {
  CellDataWithConfidenceInterval,
  ConfidenceIntervalTableProps,
} from './ConfidenceIntervalTable';

const emptyArray: never[] = [];
const tableConfig: TableConfig<string> = {
  tableBorder: false,
  hover: true,
  stickyLastColumn: true,
};
const MetricColumnKey = 'metric';
const ActionColumnKey = 'action';

const useStyles = makeStyles()(() => ({
  tooltipIcon: {
    verticalAlign: 'middle',
    marginBottom: '4px',
    marginLeft: '4px',
  },
}));

type ExperimentMetricsResultTableProps = {
  orderedExperimentVariants: ValidExperimentConfiguration['variants'];
  state: GenericChartState;
  titleKey: TranslationKey;
  tooltipKey?: TranslationKey;
  raqiResponseByMetric: Map<ExperimentMetric, RAQIV2QueryResponses | null>;
  experimentVariantsResults?: ValidExperimentVariantsResults;
  /** Metrics will be sorted alphabetically unless a custom sort order is provided */
  metricsSortOrder?: Array<ExperimentMetric>;
  showResultsUpdatedAt?: boolean;
  isSRMDetected?: boolean;
};

const ExperimentMetricsResultTable: FC<ExperimentMetricsResultTableProps> = ({
  orderedExperimentVariants,
  state,
  titleKey,
  tooltipKey,
  raqiResponseByMetric,
  experimentVariantsResults,
  metricsSortOrder,
  showResultsUpdatedAt,
  isSRMDetected,
}) => {
  const {
    classes: { tooltipIcon },
  } = useStyles();
  const locale = useLocale();
  const { translate } = useTranslationWrapper(useTranslation());

  const baselineVariant = useMemo(
    () => orderedExperimentVariants.find((v) => v.isBaseline),
    [orderedExperimentVariants],
  );

  const shouldShowComparisonChip = useCallback(
    ({
      cellData,
      baselineValue,
    }: {
      cellData: TableValueTypes[ColumnType.Number];
      baselineValue: number;
    }) => {
      if (cellData.analyticsFormattingSpec) {
        const formattedVariantValue = formatNumberWithSpec(
          cellData.value,
          cellData.analyticsFormattingSpec,
          {
            locale,
            translate,
          },
        );
        const formattedBaselineValue = formatNumberWithSpec(
          baselineValue,
          cellData.analyticsFormattingSpec,
          {
            locale,
            translate,
          },
        );
        return formattedVariantValue !== formattedBaselineValue;
      }
      return true;
    },
    [locale, translate],
  );

  const [showConfidenceIntervalDialog, setShowConfidenceIntervalDialog] = useState<boolean>(false);
  const [confidenceIntervalDialogProps, setConfidenceIntervalDialogProps] =
    useState<ConfidenceIntervalTableProps>({
      metric: ExperimentMetric.AverageRevenuePerPayingUser,
      orderedCellDataWithConfidenceInterval: [],
    });
  const onShowConfidenceInterval = useCallback(
    ({ metric, orderedCellDataWithConfidenceInterval }: ConfidenceIntervalTableProps) => {
      setConfidenceIntervalDialogProps({
        metric,
        orderedCellDataWithConfidenceInterval,
      });
      setShowConfidenceIntervalDialog(true);
    },
    [],
  );
  const onCloseConfidenceIntervalDialog = useCallback(() => {
    setShowConfidenceIntervalDialog(false);
  }, [setShowConfidenceIntervalDialog]);

  const columnConfigs: Array<TableColumnConfig<string>> = useMemo(() => {
    const prefilteredColumnConfigs = [
      {
        columnKey: MetricColumnKey,
        columnTitleKey: translationKey(
          'Title.Column.Metric',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
        titleOverride: undefined,
        columnType: ColumnType.Text,
        endAdormentColumnKeyInCompactView: ActionColumnKey,
      },
      ...orderedExperimentVariants.map(({ variantId, label }) => ({
        columnKey: variantId,
        columnTitleKey: translationKey(
          'Title.Column.Metric',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
        // use titleOverride if column is a variant
        titleOverride: label,
        columnType: ColumnType.Number,
        endAdormentColumnKeyInCompactView: undefined,
      })),
      {
        columnKey: ActionColumnKey,
        columnTitleKey: translationKey(
          'Title.Column.Action',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
        titleOverride: undefined,
        columnType: ColumnType.Actions,
        endAdormentColumnKeyInCompactView: '',
      },
    ];

    return prefilteredColumnConfigs.map(
      ({
        columnKey,
        titleOverride,
        columnTitleKey,
        columnType,
        endAdormentColumnKeyInCompactView,
      }) => {
        return {
          titleKey: columnTitleKey,
          titleOverride,
          columnKey,
          columnType,
          endAdormentColumnKeyInCompactView: endAdormentColumnKeyInCompactView ?? undefined,
        };
      },
    );
  }, [orderedExperimentVariants]);

  const updateCellValue = useCallback(
    ({
      key,
      variant,
      variantValue,
      rows,
    }: {
      key: ExperimentMetric;
      variant: { variantId: string };
      variantValue: number;
      rows: Map<ExperimentMetric, { [variantId: string]: CellDataType }>;
    }) => {
      const raqiMetric = ExperimentMetricToRAQIV2Metric[key];
      const analyticsFormattingSpec = generateAnalyticsNumberFormattingSpec({
        metric: raqiMetric,
        context: NumberContext.TableDataPoint,
      });
      rows.set(key, {
        ...rows.get(key),
        [variant.variantId]: {
          type: ColumnType.Number,
          value: variantValue,
          analyticsFormattingSpec,
        },
      });
    },
    [],
  );

  const onViewConfidenceIntervalActionInvoked = useCallback(
    ({
      metric,
      cellDataWithVariantId,
    }: {
      metric: ExperimentMetric;
      cellDataWithVariantId: Array<readonly [string, CellDataType]>;
    }) => {
      const cellDataWithConfidenceInterval: Array<[string, CellDataWithConfidenceInterval]> = [];

      cellDataWithVariantId.forEach(([variantId, cellData]) => {
        const variant = orderedExperimentVariants.find((v) => v.variantId === variantId);
        const variantName = variant && !variant.isBaseline ? variant.label : '';

        // Determine confidence interval for lift value
        if (variantName && cellData.type === ColumnType.Number) {
          // Avoid [0, 0] intervals, since the lift label position is computed as:
          // 'lift label relative position' = lift value / (ci upper - ci lower)
          // If the interval bounds are zero, substitute with ±Number.EPSILON to ensure valid calculation
          let confidenceInterval: [number, number] = [-Number.EPSILON, Number.EPSILON];

          const metricResultForVariant = experimentVariantsResults?.variantResults
            .get(variantId)
            ?.get(metric);

          let liftPercentage = 0;
          if (cellData.comparisonChipSpec) {
            liftPercentage = cellData.comparisonChipSpec.isGood
              ? cellData.comparisonChipSpec.percentage
              : -cellData.comparisonChipSpec.percentage;
          }

          if (metricResultForVariant) {
            const ciUpper = metricResultForVariant.ciUpper / metricResultForVariant.controlMean;
            const ciLower = metricResultForVariant.ciLower / metricResultForVariant.controlMean;
            confidenceInterval = [
              ciLower === 0 ? -Number.EPSILON : ciLower,
              ciUpper === 0 ? Number.EPSILON : ciUpper,
            ];
          } else if (cellData.comparisonChipSpec) {
            confidenceInterval = [liftPercentage - Number.EPSILON, liftPercentage + Number.EPSILON];
          }

          cellDataWithConfidenceInterval.push([
            variantId,
            {
              cellData,
              variantName,
              confidenceInterval,
            },
          ]);
        }
      });

      cellDataWithConfidenceInterval.sort(([a], [b]) => {
        return (
          orderedExperimentVariants.findIndex((v) => v.variantId === a) -
          orderedExperimentVariants.findIndex((v) => v.variantId === b)
        );
      });

      onShowConfidenceInterval({
        metric,
        orderedCellDataWithConfidenceInterval: cellDataWithConfidenceInterval,
      });
    },
    [
      experimentVariantsResults?.variantResults,
      onShowConfidenceInterval,
      orderedExperimentVariants,
    ],
  );

  const adaptToRows = useCallback(
    (responses: Map<ExperimentMetric, RAQIV2QueryResponses | null>) => {
      if (!baselineVariant) {
        return emptyArray;
      }

      const columnsByMetric = new Map<ExperimentMetric, { [variantId: string]: CellDataType }>();
      responses.forEach((queryResponse, key) => {
        // Skip null responses completely
        if (!queryResponse) {
          return;
        }

        const responseValues = queryResponse.response?.values ?? emptyArray;
        if (responseValues.length === 0) {
          orderedExperimentVariants.forEach((variant) => {
            updateCellValue({ key, variant, variantValue: Number.NaN, rows: columnsByMetric });
          });
          return;
        }

        responseValues.forEach((metricValue) => {
          const breakdownValue = metricValue.breakdownValue?.find(
            ({ dimension }) => dimension === RAQIV2Dimension.ExperimentVariant,
          );

          const variant = orderedExperimentVariants.find(
            ({ label }) => label === breakdownValue?.value,
          );

          if (variant) {
            if (isSRMDetected) {
              // show N/A on all cells if srm detected
              updateCellValue({ key, variant, variantValue: Number.NaN, rows: columnsByMetric });
            } else {
              const variantValue = metricValue.dataPoints?.[0]?.value ?? Number.NaN;
              updateCellValue({ key, variant, variantValue, rows: columnsByMetric });
            }
          }
        });
      });

      return Array.from(columnsByMetric.entries())
        .sort(([rowA], [rowB]) => {
          if (metricsSortOrder) {
            return metricsSortOrder.indexOf(rowA) - metricsSortOrder.indexOf(rowB);
          }
          const { localizedName: localizedNameA } = getAnalyticsMetricDisplayConfig(
            ExperimentMetricToRAQIV2Metric[rowA],
          );
          const { localizedName: localizedNameB } = getAnalyticsMetricDisplayConfig(
            ExperimentMetricToRAQIV2Metric[rowB],
          );
          return translate(localizedNameA).localeCompare(translate(localizedNameB));
        })
        .map(([metric, variantCellData]) => {
          const raqiMetric = ExperimentMetricToRAQIV2Metric[metric];
          const { isPositiveGood } = getAnalyticsMetricDisplayConfig(raqiMetric);
          const baselineCellData = variantCellData[baselineVariant.variantId];
          const baselineValue =
            baselineCellData.type === ColumnType.Number ? baselineCellData.value : Number.NaN;

          const cellDataWithComparisonSpec = Object.entries(variantCellData).map(
            ([variantId, cellData]) => {
              if (cellData.type === ColumnType.Number && variantId !== baselineVariant.variantId) {
                const statsSig =
                  experimentVariantsResults?.variantResults.get(variantId)?.get(metric)
                    ?.isStatisticallySignificant ?? false;

                const comparisonChipSpec = shouldShowComparisonChip({
                  cellData,
                  baselineValue,
                })
                  ? getComparisonChipSpec({
                      isPositiveGood,
                      current: cellData.value,
                      previous: baselineValue,
                      dimmedLabel: !statsSig,
                      maximumDecimals: 2,
                      useWarningBackgroundWhenNotGood: statsSig,
                    })
                  : undefined;

                const cellBackground =
                  statsSig && !isSRMDetected
                    ? {
                        type: CellBackgroundType.ConstantFill,
                        color: comparisonChipSpec?.isGood
                          ? TableCellBackgroundColor.Positive
                          : TableCellBackgroundColor.Negative,
                      }
                    : undefined;
                const variantCellDataWithComparisonSpec: TableValueTypes[ColumnType.Number] = {
                  ...cellData,
                  comparisonChipSpec,
                  cellBackground,
                };
                return [variantId, variantCellDataWithComparisonSpec] as const;
              }
              return [variantId, cellData] as const;
            },
          );

          const row = new Map(cellDataWithComparisonSpec).set(MetricColumnKey, {
            type: ColumnType.Text,
            value: translate(
              translationKey(
                `Title.Chart.${raqiMetric}`,
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            ),
          });

          if (!isSRMDetected) {
            // only show confidence interval button if srm is NOT detected
            row.set(ActionColumnKey, {
              type: ColumnType.Actions,
              actions: [
                {
                  actionType: 'confidence-interval',
                  onActionInvoked: () => {
                    onViewConfidenceIntervalActionInvoked({
                      metric,
                      cellDataWithVariantId: cellDataWithComparisonSpec,
                    });
                  },
                  actionOn: metric,
                  renderedAsInNonCompactTable: 'dedicated-button',
                  displayLabel: translate(
                    translationKey(
                      'Label.ViewConfidenceInterval',
                      TranslationNamespace.UniverseConfigAndExperimentation,
                    ),
                  ),
                },
              ],
            });
          }
          return row;
        });
    },
    [
      baselineVariant,
      experimentVariantsResults,
      isSRMDetected,
      metricsSortOrder,
      onViewConfidenceIntervalActionInvoked,
      orderedExperimentVariants,
      shouldShowComparisonChip,
      translate,
      updateCellValue,
    ],
  );

  const rowsData = useMemo(
    () => adaptToRows(raqiResponseByMetric),
    [adaptToRows, raqiResponseByMetric],
  );

  return (
    <Grid container item>
      <Grid item XSmall={12} justifyContent='space-between' display='flex' marginBottom='8px'>
        <div>
          <Typography variant='h5'>{translate(titleKey)}</Typography>
          {tooltipKey && (
            <Tooltip title={translate(tooltipKey)} placement='top' arrow>
              <InfoOutlinedIcon fontSize='small' classes={{ root: tooltipIcon }} />
            </Tooltip>
          )}
        </div>
        {experimentVariantsResults && showResultsUpdatedAt && (
          <Typography variant='body2' component='div' alignContent='center'>
            {translate(
              translationKey(
                'Description.ExperimentResultTable.ResultsUpdatedAt',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
              {
                time: dateTimeFormatter(locale).getCustomDateTime(
                  experimentVariantsResults.resultsTime,
                  {
                    month: 'short',
                    day: 'numeric',
                    // resultsTime is a UTC instant and the chart buckets metrics
                    // by UTC reporting day; format in UTC so the "updated on" date
                    // matches the chart instead of shifting a day in local time.
                    timeZone: 'UTC',
                  },
                ),
              },
            )}
          </Typography>
        )}
      </Grid>
      <GenericTableV2
        {...state}
        rowData={rowsData}
        columnConfigs={columnConfigs}
        tableConfig={tableConfig}
      />
      <ConfidenceIntervalDialog
        open={showConfidenceIntervalDialog}
        {...confidenceIntervalDialogProps}
        onClose={onCloseConfidenceIntervalDialog}
      />
    </Grid>
  );
};

export default ExperimentMetricsResultTable;
