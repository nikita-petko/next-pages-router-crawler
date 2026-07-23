import type { TRAQIV2Dimension, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared';

export type TAlertConditionMetric = TRAQIV2NumericUIMetric;

export enum AlertConditionOperation {
  Lt = 'lt',
  Lte = 'lte',
  Gt = 'gt',
  Gte = 'gte',
  Eq = 'eq',
}

export enum ExperienceAlertSeverity {
  Critical = 'critical',
  Medium = 'medium',
  Low = 'low',
}

export type ExperienceAlertFilterRowValues = {
  dimension: TRAQIV2Dimension | '';
  values: string[];
};

export type ExperienceAlertFormValues = {
  name: string;
  description: string;
  metric: TAlertConditionMetric | null;
  operation: AlertConditionOperation;
  value: string;
  filters: ExperienceAlertFilterRowValues[];
  breakdownDimension: TRAQIV2Dimension | null;
  breakdownCategories: string[];
  timeGranularity: RAQIV2MetricGranularity | '';
  durationMinutes: number | '';
  severity: ExperienceAlertSeverity;
};
