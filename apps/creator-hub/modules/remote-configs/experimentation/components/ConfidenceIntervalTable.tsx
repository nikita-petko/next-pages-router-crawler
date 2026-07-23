import {
  ColumnType,
  formatCellContent,
  TableColumnConfig,
  TableValueTypes,
  useLocale,
  formatCellBackgroundStyle,
} from '@modules/charts-generic';
import React, { FC, useMemo } from 'react';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getAnalyticsMetricDisplayConfig } from '@modules/experience-analytics-shared';
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
import { useTranslation } from '@rbx/intl';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import { ExperimentMetric } from '../../api/universeExperimentationClientEnums';
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
  orderedCellDataWithConfidenceInterval: Array<[string, CellDataWithConfidenceInterval]>;
};

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
    position: 'relative',
    paddingLeft: '48px',
    paddingRight: '48px',
  },
  confidenceIntervalCellZeroIndicator: {
    position: 'absolute',
    top: '0',
    left: '50%',
    height: '100%',
    borderLeft: `1px dotted ${theme.palette.content.disabled}`,
  },
}));

const ConfidenceIntervalTable: FC<ConfidenceIntervalTableProps> = ({
  metric,
  orderedCellDataWithConfidenceInterval,
}) => {
  const {
    classes: {
      tableHeaderCell,
      confidenceIntervalCell,
      tableHeaderRow,
      confidenceIntervalCellZeroIndicator,
    },
    cx,
  } = useStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();
  const theme = useTheme();

  const marks = useMemo(() => {
    let markBoundary = 0;
    orderedCellDataWithConfidenceInterval.forEach(([, { confidenceInterval }]) => {
      const [localMin, localMax] = confidenceInterval;
      markBoundary = Math.max(markBoundary, Math.abs(localMin), Math.abs(localMax));
    });

    const maxNumberOfSteps = 2;
    const stepSize = Math.ceil((markBoundary * 100) / maxNumberOfSteps) / 100;
    const results = [0];
    while (results[results.length - 1] <= markBoundary) {
      results.push(results[results.length - 1] + stepSize);
    }
    while (results[0] >= -markBoundary) {
      results.unshift(results[0] - stepSize);
    }

    return results;
  }, [orderedCellDataWithConfidenceInterval]);

  const rows = useMemo(() => {
    return orderedCellDataWithConfidenceInterval.map(
      ([variantId, { cellData, variantName, confidenceInterval }]) => {
        let confidenceIntervalContent: React.ReactNode | null = null;

        if (!cellData.comparisonChipSpec) {
          confidenceIntervalContent = Number.isNaN(cellData.value) ? null : (
            <ConfidenceIntervalCellContent
              marks={marks}
              metricValueLiftPercentage={0}
              interval={confidenceInterval}
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
              interval={confidenceInterval}
            />
          );
        }

        return (
          <TableRow key={variantId} data-testid={`variant-row-${variantId}`}>
            <TableCell data-testid={`variant-name-${variantId}`}>{variantName}</TableCell>
            <TableCell
              data-testid={`metric-value-${variantId}`}
              style={{ ...formatCellBackgroundStyle(cellData, MetricColumnConfig, theme) }}
              align='right'>
              {formatCellContent(cellData, MetricColumnConfig, locale, translate)}
            </TableCell>
            <TableCell
              classes={{ root: confidenceIntervalCell }}
              data-testid={`confidence-interval-${variantId}`}>
              {confidenceIntervalContent}
              {/** a dotted vertical line indicating where 0 percent is */}
              <span className={confidenceIntervalCellZeroIndicator} />
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
    marks,
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
              <ConfidenceIntervalCellHeader marks={marks} />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody data-testid='confidence-interval-table-body'>{rows}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default ConfidenceIntervalTable;
