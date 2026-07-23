import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { RpnOperator, ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';

export type ConfigDefinitionFormData = {
  configKey: string;
  overrideType: ValidConfigEntryValueType;
  stringValue: string;
  boolValue: 'true' | 'false';
  description: string;
};

export const TargetingMode = {
  ExistingCondition: 'existing-condition',
  NewCondition: 'new-condition',
} as const;
export type TargetingMode = (typeof TargetingMode)[keyof typeof TargetingMode];

export type TargetingClauseFormData = {
  id: string;
  dimension: RAQIV2Dimension;
  operator: Exclude<RpnOperator, RpnOperator.And | RpnOperator.Or>;
  values: string[];
  joinerToNext: RpnOperator.And | RpnOperator.Or;
};

export type TargetingConditionFormData = {
  id: string;
  mode: TargetingMode;
  conditionName: string;
  clauses: TargetingClauseFormData[];
  conditionalStringValue: string;
  conditionalBoolValue: 'true' | 'false';
};

export type ConditionsFormData = {
  conditions: Array<TargetingConditionFormData>;
};

export type ConfigFormData = ConfigDefinitionFormData & ConditionsFormData;
