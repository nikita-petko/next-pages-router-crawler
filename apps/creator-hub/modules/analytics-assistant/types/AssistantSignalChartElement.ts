import type { AnalyticsConfigChartProps } from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigChart';
import type { RAQIV2PredefinedTableProps } from '@modules/experience-analytics-shared/components/RAQIV2/table/AnalyticsConfigTable';
import type { RetentionPowerCurveChartProps } from '../components/charts/RetentionPowerCurveChart';
import type { SimpleNewUserRetentionTableProps } from '../components/charts/SimpleNewUserRetentionTable';

/**
 * Discriminated union of chart elements keyed by the target component type.
 * Each variant carries the props that component needs (minus hook-only values like onSelectChartRegion).
 * The adapter produces these; the hook is a thin renderer that maps type -> React component.
 */

export enum SignalChartElementType {
  AnalyticsConfigChart = 'analytics-config-chart',
  AnalyticsConfigTable = 'analytics-config-table',
  RetentionPowerCurveChart = 'retention-power-curve-chart',
  SimpleNewUserRetentionTable = 'simple-new-user-retention-table',
}

export type AnalyticsConfigChartElementProps = Pick<
  AnalyticsConfigChartProps,
  'chartKeyOrConfig' | 'chartContext'
>;

export type AnalyticsConfigTableElementProps = Pick<
  RAQIV2PredefinedTableProps,
  'config' | 'tableContext' | 'rowRange'
>;

export type RetentionPowerCurveChartElementProps = RetentionPowerCurveChartProps;

export type SimpleNewUserRetentionTableElementProps = SimpleNewUserRetentionTableProps;

export type SignalChartElement = { dedupKey: string } & (
  | {
      type: SignalChartElementType.AnalyticsConfigChart;
      props: AnalyticsConfigChartElementProps;
    }
  | {
      type: SignalChartElementType.AnalyticsConfigTable;
      props: AnalyticsConfigTableElementProps;
    }
  | {
      type: SignalChartElementType.RetentionPowerCurveChart;
      props: RetentionPowerCurveChartElementProps;
    }
  | {
      type: SignalChartElementType.SimpleNewUserRetentionTable;
      props: SimpleNewUserRetentionTableElementProps;
    }
);
