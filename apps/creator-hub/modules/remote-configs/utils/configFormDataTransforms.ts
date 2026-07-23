import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { RpnOperator, ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';
import type {
  ValidConditionRule,
  ValidConfigEntry,
  ValidConfigEntryValue,
} from '../api/validTypes';
import {
  TargetingMode,
  type ConfigFormData,
  type TargetingClauseFormData,
  type TargetingConditionFormData,
} from '../types/FormData';
import type { TransformedConfigForMutation } from '../context/ConfigCreationFormContext';
import prettyPrintJson from './prettyPrintJson';

// ---------------------------------------------------------------------------
// ID generator (shared across form transforms)
// ---------------------------------------------------------------------------

let nextTargetingId = 0;
export const makeTargetingId = (): string => {
  nextTargetingId += 1;
  return `targeting-${nextTargetingId}`;
};

/** Reset the ID counter — only intended for deterministic test output. */
export const resetTargetingIdCounter = (): void => {
  nextTargetingId = 0;
};

// ---------------------------------------------------------------------------
// Primitive converters
// ---------------------------------------------------------------------------

export type ConditionRuleToken = ValidConditionRule['tokens'][number];

export const makeEntryValue = (
  overrideType: ValidConfigEntryValueType,
  stringValue: string,
  boolValue: 'true' | 'false',
): ValidConfigEntryValue => {
  switch (overrideType) {
    case ValidConfigEntryValueType.String:
      return { valueType: overrideType, stringValue };
    case ValidConfigEntryValueType.Number:
      return { valueType: overrideType, numberValue: parseFloat(stringValue) };
    case ValidConfigEntryValueType.Boolean:
      return { valueType: overrideType, boolValue: boolValue === 'true' };
    case ValidConfigEntryValueType.Json:
      return { valueType: overrideType, jsonValue: stringValue };
    default: {
      const exhaustiveCheck: never = overrideType;
      throw new Error(`Unexpected override type: ${exhaustiveCheck}`);
    }
  }
};

export const stringValueFromEntryValue = (entryValue: ValidConfigEntryValue): string => {
  switch (entryValue.valueType) {
    case ValidConfigEntryValueType.String:
      return entryValue.stringValue;
    case ValidConfigEntryValueType.Number:
      return String(entryValue.numberValue);
    case ValidConfigEntryValueType.Boolean:
      return '';
    case ValidConfigEntryValueType.Json:
      return prettyPrintJson(entryValue.jsonValue) ?? entryValue.jsonValue;
    default: {
      const exhaustiveCheck: never = entryValue;
      throw new Error(`Unexpected value type: ${exhaustiveCheck}`);
    }
  }
};

export const boolValueFromEntryValue = (entryValue: ValidConfigEntryValue): 'true' | 'false' => {
  if (entryValue.valueType === ValidConfigEntryValueType.Boolean) {
    return entryValue.boolValue ? 'true' : 'false';
  }
  return 'true';
};

// ---------------------------------------------------------------------------
// FormData -> RPN tokens
// ---------------------------------------------------------------------------

export const toClauseCombinationOperator = (
  operator: TargetingClauseFormData['operator'],
): RpnOperator =>
  operator === RpnOperator.Ne || operator === RpnOperator.Nin ? RpnOperator.And : RpnOperator.Or;

export const toClauseTokens = (clause: TargetingClauseFormData): Array<ConditionRuleToken> => {
  if (clause.values.length === 0) {
    return [];
  }

  if (clause.values.length === 1) {
    return [
      { type: 'dimensionValue', value: clause.values[0] },
      { type: 'dimension', dimension: clause.dimension },
      { type: 'operator', operator: clause.operator },
    ];
  }

  const rpnOperator =
    clause.operator === RpnOperator.Ne || clause.operator === RpnOperator.Nin
      ? RpnOperator.Nin
      : RpnOperator.In;

  return [
    { type: 'dimension', dimension: clause.dimension },
    ...clause.values.map((v) => ({ type: 'dimensionValue' as const, value: v })),
    { type: 'dimensionValue', value: String(clause.values.length) },
    { type: 'operator', operator: rpnOperator },
  ];
};

export const toConditionRuleTokens = (
  clauses: ReadonlyArray<TargetingClauseFormData>,
): Array<ConditionRuleToken> => {
  const tokens: Array<ConditionRuleToken> = [];

  clauses.forEach((clause, clauseIndex) => {
    const clauseTokens = toClauseTokens(clause);
    if (clauseTokens.length === 0) {
      return;
    }

    tokens.push(...clauseTokens);
    if (clauseIndex > 0) {
      const previousJoiner = clauses[clauseIndex - 1]?.joinerToNext ?? RpnOperator.And;
      tokens.push({ type: 'operator', operator: previousJoiner });
    }
  });

  return tokens;
};

export const getConditionsDataForMutation = ({
  overrideType,
  conditions,
}: Pick<ConfigFormData, 'overrideType' | 'conditions'>): {
  conditionValues: Map<string, ValidConfigEntryValue>;
  conditionalRules: Array<ValidConditionRule>;
  conditionNames: Array<string>;
} => {
  const conditionValues = new Map<string, ValidConfigEntryValue>();
  const conditionNames = new Set<string>();
  const conditionalRules: Array<ValidConditionRule> = [];

  conditions.forEach((condition) => {
    const conditionName = condition.conditionName.trim();
    if (!conditionName) {
      return;
    }

    conditionNames.add(conditionName);
    conditionValues.set(
      conditionName,
      makeEntryValue(
        overrideType,
        condition.conditionalStringValue,
        condition.conditionalBoolValue,
      ),
    );

    if (condition.mode !== TargetingMode.NewCondition) {
      return;
    }

    const tokens = toConditionRuleTokens(condition.clauses);
    if (tokens.length === 0) {
      return;
    }

    conditionalRules.push({ conditionKey: conditionName, tokens });
  });

  return {
    conditionValues,
    conditionalRules,
    conditionNames: Array.from(conditionNames),
  };
};

// ---------------------------------------------------------------------------
// RPN tokens -> FormData clauses  (reverse parse for editing)
// ---------------------------------------------------------------------------

const defaultDimension = RAQIV2Dimension.Platform;

export const createDefaultClause = (): TargetingClauseFormData => ({
  id: makeTargetingId(),
  dimension: defaultDimension,
  operator: RpnOperator.Eq,
  values: [],
  joinerToNext: RpnOperator.And,
});

/**
 * Parse RPN rule tokens back into the clause-based form data structure.
 *
 * Uses a stack-based evaluator that handles both token orderings:
 *   - The format produced by `toClauseTokens`: [dim, val, op] per atom
 *   - True RPN from the API: [val, dim, EQ] or [dim, val1, …, valN, count, IN]
 *
 * After evaluation, consecutive clauses sharing the same dimension + operator
 * are merged into a single multi-value clause (e.g. two "Platform EQ" clauses
 * combined via OR become one clause with multiple values).
 */
export const parseRuleTokensToClauses = (
  tokens: ValidConditionRule['tokens'],
): TargetingClauseFormData[] => {
  type StackItem =
    | { kind: 'dimension'; dimension: RAQIV2Dimension }
    | { kind: 'value'; value: string }
    | { kind: 'clause' };

  const stack: StackItem[] = [];
  const rawClauses: TargetingClauseFormData[] = [];

  tokens.forEach((token) => {
    if (token.type === 'dimension') {
      stack.push({ kind: 'dimension', dimension: token.dimension });
      return;
    }

    if (token.type === 'dimensionValue') {
      stack.push({ kind: 'value', value: String(token.value) });
      return;
    }

    // token.type === 'operator'
    const { operator } = token;

    if (operator === RpnOperator.And || operator === RpnOperator.Or) {
      stack.pop();
      stack.pop();
      stack.push({ kind: 'clause' });
      if (rawClauses.length >= 2) {
        rawClauses[rawClauses.length - 2].joinerToNext = operator;
      }
      return;
    }

    if (operator === RpnOperator.In || operator === RpnOperator.Nin) {
      const countItem = stack.pop();
      const count = countItem?.kind === 'value' ? parseInt(countItem.value, 10) : 0;
      const values: string[] = [];
      Array.from({ length: count }).forEach(() => {
        const item = stack.pop();
        if (item?.kind === 'value') values.unshift(item.value);
      });
      const dimItem = stack.pop();
      const dimension = dimItem?.kind === 'dimension' ? dimItem.dimension : defaultDimension;
      rawClauses.push({
        id: makeTargetingId(),
        dimension,
        operator: operator === RpnOperator.In ? RpnOperator.Eq : RpnOperator.Ne,
        values,
        joinerToNext: RpnOperator.And,
      });
      stack.push({ kind: 'clause' });
      return;
    }

    // Binary comparison: EQ, NE, GT, LT, GTE, LTE
    // Handles both orderings: (dim, val, op) and (val, dim, op)
    const top = stack.pop();
    const second = stack.pop();
    let dimension: RAQIV2Dimension = defaultDimension;
    let value = '';
    if (top?.kind === 'value' && second?.kind === 'dimension') {
      dimension = second.dimension;
      value = top.value;
    } else if (top?.kind === 'dimension' && second?.kind === 'value') {
      dimension = top.dimension;
      value = second.value;
    }
    rawClauses.push({
      id: makeTargetingId(),
      dimension,
      operator: operator as Exclude<RpnOperator, RpnOperator.And | RpnOperator.Or>,
      values: [value],
      joinerToNext: RpnOperator.And,
    });
    stack.push({ kind: 'clause' });
  });

  // Merge consecutive clauses that share the same dimension + operator
  // (e.g. [Platform EQ ios, Platform EQ android] → [Platform EQ [ios, android]])
  return rawClauses.reduce<TargetingClauseFormData[]>((merged, clause) => {
    const last = merged[merged.length - 1];
    if (last && last.dimension === clause.dimension && last.operator === clause.operator) {
      last.values.push(...clause.values);
      last.joinerToNext = clause.joinerToNext;
    } else {
      merged.push({ ...clause, values: [...clause.values] });
    }
    return merged;
  }, []);
};

// ---------------------------------------------------------------------------
// High-level transforms (used by the context / provider)
// ---------------------------------------------------------------------------

export const transformConfigFormDataToValidConfig = (
  formData: ConfigFormData,
): TransformedConfigForMutation => {
  const entry: ValidConfigEntry = {
    key: formData.configKey,
    entryValue: makeEntryValue(formData.overrideType, formData.stringValue, formData.boolValue),
    description: formData.description,
  };

  const { conditionValues, conditionalRules, conditionNames } = getConditionsDataForMutation({
    overrideType: formData.overrideType,
    conditions: formData.conditions,
  });

  if (conditionValues.size > 0) {
    entry.conditionValue = conditionValues;
  }

  return { entry, conditionalRules, conditionNames };
};

export const transformValidConfigToFormData = (
  entry: ValidConfigEntry,
  rules?: Map<string, ValidConditionRule>,
): ConfigFormData => {
  const conditions: TargetingConditionFormData[] = [];

  entry.conditionValue?.forEach((conditionEntryValue, conditionName) => {
    const rule = rules?.get(conditionName);
    conditions.push({
      id: makeTargetingId(),
      mode: TargetingMode.ExistingCondition,
      conditionName,
      clauses: rule ? parseRuleTokensToClauses(rule.tokens) : [createDefaultClause()],
      conditionalStringValue: stringValueFromEntryValue(conditionEntryValue),
      conditionalBoolValue: boolValueFromEntryValue(conditionEntryValue),
    });
  });

  return {
    configKey: entry.key,
    overrideType: entry.entryValue.valueType,
    stringValue: stringValueFromEntryValue(entry.entryValue),
    boolValue: boolValueFromEntryValue(entry.entryValue),
    description: entry.description ?? '',
    conditions,
  };
};
