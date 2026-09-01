import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { RpnOperator, ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';
import type { ValidConditionRule, ValidConfigEntryValue } from '../api/validTypes';

const maxRuleTokensCacheEntries = 500;
const parsedRuleTokensByJsonValue = new Map<string, ValidConditionRule['tokens'] | null>();

type ValidConditionRuleToken = ValidConditionRule['tokens'][number];

const toRuleToken = (token: unknown): ValidConditionRuleToken | null => {
  if (typeof token !== 'object' || token === null) {
    return null;
  }

  const operand = Reflect.get(token, 'operand');
  if (typeof operand === 'object' && operand !== null) {
    const attributeReference = Reflect.get(operand, 'attributeReference');
    if (typeof attributeReference === 'string') {
      if (!isValidEnumValue(RAQIV2Dimension, attributeReference)) {
        return null;
      }
      return {
        type: 'dimension',
        dimension: attributeReference,
      };
    }

    const literalValue = Reflect.get(operand, 'literalValue');
    if (typeof literalValue === 'object' && literalValue !== null) {
      const value =
        Reflect.get(literalValue, 'stringValue') ??
        Reflect.get(literalValue, 'integerValue') ??
        Reflect.get(literalValue, 'doubleValue') ??
        Reflect.get(literalValue, 'booleanValue');
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        return null;
      }
      return {
        type: 'dimensionValue',
        value,
      };
    }
  }

  const operator = Reflect.get(token, 'operator');
  if (typeof operator === 'string' && isValidEnumValue(RpnOperator, operator)) {
    return {
      type: 'operator',
      operator,
    };
  }

  return null;
};

const parseRuleTokensFromConfigEntryValue = (
  entryValue: ValidConfigEntryValue | undefined,
): ValidConditionRule['tokens'] | null => {
  if (entryValue?.valueType !== ValidConfigEntryValueType.Json) {
    return null;
  }
  if (parsedRuleTokensByJsonValue.has(entryValue.jsonValue)) {
    return parsedRuleTokensByJsonValue.get(entryValue.jsonValue) ?? null;
  }

  const cacheRuleTokens = (
    tokens: ValidConditionRule['tokens'] | null,
  ): ValidConditionRule['tokens'] | null => {
    if (parsedRuleTokensByJsonValue.size >= maxRuleTokensCacheEntries) {
      parsedRuleTokensByJsonValue.clear();
    }
    parsedRuleTokensByJsonValue.set(entryValue.jsonValue, tokens);
    return tokens;
  };

  let parsedRuleData: unknown;
  try {
    parsedRuleData = JSON.parse(entryValue.jsonValue);
  } catch {
    return cacheRuleTokens(null);
  }
  if (typeof parsedRuleData !== 'object' || parsedRuleData === null) {
    return cacheRuleTokens(null);
  }

  const tokensValue = Reflect.get(parsedRuleData, 'tokens');
  if (!Array.isArray(tokensValue) || !tokensValue.length) {
    return cacheRuleTokens(null);
  }

  const parsedTokens = tokensValue
    .map(toRuleToken)
    .filter((token): token is ValidConditionRuleToken => token !== null);
  if (parsedTokens.length !== tokensValue.length) {
    return cacheRuleTokens(null);
  }

  return cacheRuleTokens(parsedTokens.length ? parsedTokens : null);
};

export default parseRuleTokensFromConfigEntryValue;
