import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type {
  LiteralValue,
  RpnToken,
  TargetingCriteria,
} from '@modules/clients/analytics/universeExperimentation';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { RpnOperator } from '../api/universeConfigsClientEnums';
import type { TargetingClauseFormData } from '../types/FormData';
import type { ConditionRuleToken } from './configFormDataTransforms';
import { toConditionRuleTokens, parseRuleTokensToClauses } from './configFormDataTransforms';

type DimensionValue = Extract<ConditionRuleToken, { type: 'dimensionValue' }>['value'];

function getRaqiDimension(attributeReference: string): RAQIV2Dimension | undefined {
  return isValidEnumValue(RAQIV2Dimension, attributeReference) ? attributeReference : undefined;
}

function conditionRuleValueToApiLiteralValue(value: DimensionValue): LiteralValue {
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: value } : { doubleValue: value };
  }
  return { stringValue: value };
}

// Maps the display/form discriminated union token → API structured token
function conditionRuleTokenToApiToken(token: ConditionRuleToken): RpnToken {
  if (token.type === 'operator') {
    return { operator: token.operator };
  }
  if (token.type === 'dimension') {
    return { operand: { attributeReference: token.dimension } };
  }
  // dimensionValue
  return { operand: { literalValue: conditionRuleValueToApiLiteralValue(token.value) } };
}

// Maps the API structured token → display/form discriminated union token
export function apiRpnTokensToRpnRuleTokens(tokens: RpnToken[]): ConditionRuleToken[] {
  return tokens.flatMap((token): ConditionRuleToken[] => {
    if (token.operator !== undefined) {
      if (!isValidEnumValue(RpnOperator, token.operator)) {
        logAnalyticsError(`Unknown experiment targeting API operator: ${token.operator}`);
        return [];
      }
      return [{ type: 'operator', operator: token.operator }];
    }
    if (token.operand?.attributeReference !== undefined) {
      const dimension = getRaqiDimension(token.operand.attributeReference);
      if (!dimension) {
        logAnalyticsError(
          `Unknown experiment targeting API dimension: ${token.operand.attributeReference}`,
        );
        return [];
      }
      return [{ type: 'dimension', dimension }];
    }
    if (token.operand?.literalValue !== undefined) {
      const lv = token.operand.literalValue;
      const value = lv.stringValue ?? lv.integerValue ?? lv.doubleValue ?? lv.booleanValue ?? '';
      return [{ type: 'dimensionValue', value }];
    }
    logAnalyticsError(`Unknown experiment targeting API token: ${JSON.stringify(token)}`);
    return [];
  });
}

export function hasTargetingCriteriaTokens(criteria?: TargetingCriteria): boolean {
  return (criteria?.rule?.tokens ?? []).length > 0;
}

type TargetingClausesToTargetingCriteriaOptions = {
  shouldPreserveEmptyRule?: boolean;
};

export function isCompleteTargetingClause(clause: TargetingClauseFormData): boolean {
  return (
    clause.dimension !== undefined && clause.operator !== undefined && clause.values.length > 0
  );
}

export function isEmptyTargetingClause(clause: TargetingClauseFormData): boolean {
  return clause.dimension === undefined && clause.values.length === 0;
}

export function isIncompleteTargetingClause(clause: TargetingClauseFormData): boolean {
  return !isEmptyTargetingClause(clause) && !isCompleteTargetingClause(clause);
}

export function hasIncompleteTargetingClause(
  clauses: ReadonlyArray<TargetingClauseFormData>,
): boolean {
  return clauses.some(isIncompleteTargetingClause);
}

export function getCompletedTargetingClauses(
  clauses: ReadonlyArray<TargetingClauseFormData>,
): TargetingClauseFormData[] {
  return clauses.filter(isCompleteTargetingClause);
}

export function targetingClausesToRpnRuleTokens(
  clauses: ReadonlyArray<TargetingClauseFormData>,
): ConditionRuleToken[] {
  return toConditionRuleTokens(getCompletedTargetingClauses(clauses));
}

/**
 * Converts form targeting clauses to the TargetingCriteria API shape.
 * Returns undefined when clauses contain no targeting tokens, unless callers need
 * an explicit empty rule to clear previously persisted targeting.
 */
export function targetingClausesToTargetingCriteria(
  clauses: ReadonlyArray<TargetingClauseFormData>,
  { shouldPreserveEmptyRule = false }: TargetingClausesToTargetingCriteriaOptions = {},
): TargetingCriteria | undefined {
  const displayTokens = targetingClausesToRpnRuleTokens(clauses);
  if (displayTokens.length === 0 && !shouldPreserveEmptyRule) {
    return undefined;
  }
  const tokens = displayTokens.map(conditionRuleTokenToApiToken);
  return { rule: { tokens } };
}

/**
 * Converts TargetingCriteria from the API back into form clauses for edit pre-population.
 */
export function targetingCriteriaToTargetingClauses(
  criteria: TargetingCriteria,
): TargetingClauseFormData[] {
  const displayTokens = apiRpnTokensToRpnRuleTokens(criteria.rule?.tokens ?? []);
  return parseRuleTokensToClauses(displayTokens);
}
