import type { FC } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useLocale from '@modules/charts-generic/context/useLocale';
import formatCellContent from '@modules/charts-generic/tables/formatCellContent';
import { formatCellBackgroundStyle } from '@modules/charts-generic/tables/formatCellStyles';
import {
  ColumnType,
  type TableColumnConfig,
} from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TableValueTypes } from '@modules/charts-generic/tables/types/GenericTableType';
import getAnalyticsMetricDisplayConfig from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import type { ExperimentMetric } from '../../api/universeExperimentationClientEnums';
import { ConfidenceIntervalCellContent, ConfidenceIntervalCellHeader } from './ConfidenceInterval';

enum ColumnKey {
  Variant = 'variant',
  Metric = 'metric',
  ConfidenceInterval = 'confidenceInterval',
}

const MetricColumnConfig: TableColumnConfig<ColumnKey> = {
  columnKey: ColumnKey.Metric,
  columnType: ColumnType.Number,
  titleKey: translationKey(
    'Title.Column.Metric',
    TranslationNamespace.UniverseConfigAndExperimentation,
  ),
};

export type CellDataWithConfidenceInterval = {
  cellData: TableValueTypes[ColumnType.Number];
  variantName: string;
  confidenceInterval: [number, number];
};

export type ConfidenceIntervalTableProps = {
  metric: ExperimentMetric;
  statSigThreshold: number;
  orderedCellDataWithConfidenceInterval: Array<[string, CellDataWithConfidenceInterval]>;
};

const confidenceIntervalPadding = '56px';

const useStyles = makeStyles()((theme) => ({
  tableHeaderCell: {
    paddingTop: '0',
    paddingBottom: '0',
  },
  tableHeaderRow: {
    borderTop: '1px solid',
    borderTopColor: theme.palette.components.divider,
  },
  confidenceIntervalCell: {
    width: '80%',
    minWidth: '300px',
    position: 'relative',
    paddingLeft: confidenceIntervalPadding,
    paddingRight: confidenceIntervalPadding,
  },
  confidenceIntervalCellZeroIndicatorTrack: {
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: confidenceIntervalPadding,
    right: confidenceIntervalPadding,
    pointerEvents: 'none',
  },
  confidenceIntervalCellZeroIndicator: {
    position: 'absolute',
    top: '0',
    height: '100%',
    borderLeft: `1px dotted ${theme.palette.content.disabled}`,
  },
}));

const ConfidenceIntervalTable: FC<ConfidenceIntervalTableProps> = ({
  metric,
  statSigThreshold,
  orderedCellDataWithConfidenceInterval,
}) => {
  const {
    classes: {
      tableHeaderCell,
      confidenceIntervalCell,
      tableHeaderRow,
      confidenceIntervalCellZeroIndicator,
      confidenceIntervalCellZeroIndicatorTrack,
    },
    cx,
  } = useStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();
  const theme = useTheme();

  const marks = useMemo(() => {
    let globalMax = Math.max(statSigThreshold, 0);
    let globalMin = Math.max(-statSigThreshold, 0);

    orderedCellDataWithConfidenceInterval.forEach(([, { confidenceInterval, cellData }]) => {
      const [localMin, localMax] = confidenceInterval;

      if (Number.isFinite(localMin)) {
        if (localMin < 0) {
          globalMin = Math.max(globalMin, -localMin);
        } else {
          globalMax = Math.max(globalMax, localMin);
        }
      }
      if (Number.isFinite(localMax)) {
        if (localMax > 0) {
          globalMax = Math.max(globalMax, localMax);
        } else {
          globalMin = Math.max(globalMin, -localMax);
        }
      }

      // Include the point-estimate lift so its marker stays inside the visible axis.
      if (cellData.comparisonChipSpec) {
        const liftMagnitude = cellData.comparisonChipSpec.percentage;
        const liftSigned = cellData.comparisonChipSpec.isUp ? liftMagnitude : -liftMagnitude;
        if (liftSigned < 0) {
          globalMin = Math.max(globalMin, liftMagnitude);
        } else {
          globalMax = Math.max(globalMax, liftMagnitude);
        }
      }
    });

    const maxNumberOfSteps = 2;
    const stepSize = Math.ceil((Math.max(globalMax, globalMin) * 100) / maxNumberOfSteps) / 100;
    const results = [0];
    if (stepSize > 0) {
      while (results[results.length - 1] <= globalMax) {
        results.push(results[results.length - 1] + stepSize);
      }
      while (results[0] >= -globalMin) {
        results.unshift(results[0] - stepSize);
      }
    }

    return results;
  }, [orderedCellDataWithConfidenceInterval, statSigThreshold]);

  const rows = useMemo(() => {
    const minMark = marks[0];
    const maxMark = marks[marks.length - 1];

    // Position of target threshold along the slider axis
    const targetAxisAlpha = (statSigThreshold - minMark) / (maxMark - minMark);

    return orderedCellDataWithConfidenceInterval.map(
      ([variantId, { cellData, variantName, confidenceInterval }]) => {
        let confidenceIntervalContent: React.ReactNode | null = null;

        // Clamp non-finite CI bounds
        const [rawMin, rawMax] = confidenceInterval;
        const isMinUnbounded = !Number.isFinite(rawMin);
        const isMaxUnbounded = !Number.isFinite(rawMax);
        const clampedInterval: [number, number] = [
          isMinUnbounded ? minMark : rawMin,
          isMaxUnbounded ? maxMark : rawMax,
        ];

        if (!cellData.comparisonChipSpec) {
          confidenceIntervalContent = Number.isNaN(cellData.value) ? null : (
            <ConfidenceIntervalCellContent
              marks={marks}
              metricValueLiftPercentage={0}
              interval={clampedInterval}
              isMinUnbounded={isMinUnbounded}
              isMaxUnbounded={isMaxUnbounded}
              statSigThreshold={statSigThreshold}
            />
          );
        } else {
          const metricValueLiftPercentage = cellData.comparisonChipSpec.isUp
            ? cellData.comparisonChipSpec.percentage
            : -cellData.comparisonChipSpec.percentage;

          confidenceIntervalContent = (
            <ConfidenceIntervalCellContent
              marks={marks}
              metricValueLiftPercentage={metricValueLiftPercentage}
              interval={clampedInterval}
              isMinUnbounded={isMinUnbounded}
              isMaxUnbounded={isMaxUnbounded}
              statSigThreshold={statSigThreshold}
            />
          );
        }

        return (
          <TableRow key={variantId} data-testid={`variant-row-${variantId}`}>
            <TableCell data-testid={`variant-name-${variantId}`}>{variantName}</TableCell>
            <TableCell
              data-testid={`metric-value-${variantId}`}
              style={formatCellBackgroundStyle(cellData, MetricColumnConfig, theme)}
              align='right'>
              {formatCellContent(cellData, MetricColumnConfig, locale, translate)}
            </TableCell>
            <TableCell
              classes={{ root: confidenceIntervalCell }}
              data-testid={`confidence-interval-${variantId}`}>
              {confidenceIntervalContent}
              {/** a dotted vertical line indicating where 0 percent is */}
              <span className={confidenceIntervalCellZeroIndicatorTrack}>
                <span
                  className={confidenceIntervalCellZeroIndicator}
                  style={{ left: `${targetAxisAlpha * 100}%` }}
                />
              </span>
            </TableCell>
          </TableRow>
        );
      },
    );
  }, [
    orderedCellDataWithConfidenceInterval,
    theme,
    locale,
    translate,
    confidenceIntervalCell,
    confidenceIntervalCellZeroIndicator,
    confidenceIntervalCellZeroIndicatorTrack,
    marks,
    statSigThreshold,
  ]);

  return (
    <TableContainer data-testid='confidence-interval-table-container'>
      <Table>
        <TableHead>
          <TableRow
            classes={{ root: tableHeaderRow }}
            data-testid='confidence-interval-table-header-row'>
            <TableCell classes={{ root: tableHeaderCell }} data-testid='header-variant'>
              {translate(
                translationKey(
                  'Title.Column.Variant',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </TableCell>
            <TableCell
              align='right'
              classes={{ root: tableHeaderCell }}
              data-testid='header-metric'>
              {translate(
                getAnalyticsMetricDisplayConfig(ExperimentMetricToRAQIV2Metric[metric])
                  .localizedName,
              )}
            </TableCell>
            <TableCell
              classes={{ root: cx(tableHeaderCell, confidenceIntervalCell) }}
              data-testid='header-confidence-interval'>
              <ConfidenceIntervalCellHeader
                marks={marks}
                targetMark={statSigThreshold !== 0 ? statSigThreshold : undefined}
              />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody data-testid='confidence-interval-table-body'>{rows}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default ConfidenceIntervalTable;
