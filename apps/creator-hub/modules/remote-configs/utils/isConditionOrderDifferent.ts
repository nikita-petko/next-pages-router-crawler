import type { ValidRuleOrdering } from '../api/validTypes';

export const isConditionOrderDifferent = (
  currentConditionOrder: Array<string> | undefined,
  stagedConditionOrder: Array<string> | undefined,
): boolean => {
  if (!stagedConditionOrder) {
    return false;
  }
  const currentOrder = currentConditionOrder ?? [];
  if (currentOrder.length !== stagedConditionOrder.length) {
    return true;
  }
  return currentOrder.some((conditionName, index) => conditionName !== stagedConditionOrder[index]);
};

export const isRuleOrderingDifferent = (
  currentRuleOrdering?: ValidRuleOrdering,
  stagedRuleOrdering?: ValidRuleOrdering,
): boolean => {
  return isConditionOrderDifferent(
    currentRuleOrdering?.conditionOrder,
    stagedRuleOrdering?.conditionOrder,
  );
};
