import { getSingleDimensionBreakdownLabel } from '@modules/experience-analytics-shared/adapters/genericRAQIV2ChartAdapter';
import getDimensionRenderer from '@modules/experience-analytics-shared/components/getDimensionRenderer';
import type useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { RpnOperator } from '../api/universeConfigsClientEnums';
import type { ValidConditionRule } from '../api/validTypes';
import type { TargetingClauseFormData } from '../types/FormData';
import { parseRuleTokensToClauses } from './configFormDataTransforms';

const operatorDisplayMap: Record<RpnOperator, string> = {
  [RpnOperator.Eq]: '=',
  [RpnOperator.Ne]: '≠',
  [RpnOperator.Gt]: '>',
  [RpnOperator.Lt]: '<',
  [RpnOperator.Gte]: '≥',
  [RpnOperator.Lte]: '≤',
  [RpnOperator.In]: 'in',
  [RpnOperator.Nin]: 'not in',
  [RpnOperator.And]: 'AND',
  [RpnOperator.Or]: 'OR',
  [RpnOperator.Not]: 'NOT',
};

export type RpnTokenChipSegment = {
  key: string;
  text: string;
  joiner: string;
  isLast: boolean;
};

type TranslationDependencies = ReturnType<typeof useRAQIV2TranslationDependencies>;
type RenderableTargetingClause = TargetingClauseFormData & {
  dimension: NonNullable<TargetingClauseFormData['dimension']>;
};

export const getRpnTokenChipSegments = (
  tokens: ValidConditionRule['tokens'],
  translationDependencies: TranslationDependencies,
): RpnTokenChipSegment[] => {
  const clauses = parseRuleTokensToClauses(tokens);
  const renderableClauses = clauses.filter(
    (clause): clause is RenderableTargetingClause =>
      clause.dimension !== undefined && clause.values.length > 0,
  );

  return renderableClauses.map((clause, index) => {
    const { dimension } = clause;
    const dimensionLabel = String(
      translationDependencies.translate(getDimensionRenderer(dimension).name),
    );
    const operatorLabel = operatorDisplayMap[clause.operator] ?? clause.operator;
    const valuesStr = clause.values
      .map((value) => {
        return String(
          getSingleDimensionBreakdownLabel({ dimension, value }, translationDependencies).name,
        );
      })
      .join(', ');

    return {
      key: `clause-${index}`,
      text: `${dimensionLabel} ${operatorLabel} ${valuesStr}`,
      joiner: clause.joinerToNext === RpnOperator.Or ? 'OR' : 'AND',
      isLast: index === renderableClauses.length - 1,
    };
  });
};
