import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  ActionCellAction,
  CellDataType,
} from '@modules/charts-generic/tables/types/GenericTableType';
import type { ValidConditionRule, ValidConfigEntryStaged } from '../api/validTypes';
import { getConditionNameWithOverride } from '../components/ConfigDiffTable';
import type { ExtraRow } from '../components/ConfigDiffTable';
import { DiffColumn } from '../components/ConfigDiffTable';
import RpnTokenChips from '../components/RpnTokenChips';

export const ruleDraftRowKeyPrefix = 'rule-draft-';

export const areRuleTokensEqual = (
  lhs: ValidConditionRule['tokens'] | undefined,
  rhs: ValidConditionRule['tokens'] | undefined,
): boolean => {
  if (!lhs || !rhs) {
    return false;
  }
  return JSON.stringify(lhs) === JSON.stringify(rhs);
};

export const ruleTokensToCellData = (
  tokens: ValidConditionRule['tokens'] | undefined,
): CellDataType<string, ValidConfigEntryStaged> => {
  if (!tokens?.length) {
    return {
      type: ColumnType.Other,
      value: '--',
    };
  }
  return {
    type: ColumnType.Other,
    value: <RpnTokenChips tokens={tokens} />,
  };
};

type BuildRuleDiffRowsOptions = {
  currentRules?: Map<string, ValidConditionRule>;
  stagedRules?: Map<string, ValidConditionRule>;
  deletedConditionKeys?: string[];
  conditionNameOverrides?: Record<string, string>;
  getStagedRuleActions?: (
    conditionKey: string,
    stagedRule: ValidConditionRule,
  ) => ActionCellAction<string, ValidConfigEntryStaged>[];
  getDeletedRuleActions?: (
    conditionKey: string,
  ) => ActionCellAction<string, ValidConfigEntryStaged>[];
};

export const buildRuleDiffRows = ({
  currentRules,
  stagedRules,
  deletedConditionKeys = [],
  conditionNameOverrides,
  getStagedRuleActions,
  getDeletedRuleActions,
}: BuildRuleDiffRowsOptions): ExtraRow[] => {
  const rows: ExtraRow[] = [];

  deletedConditionKeys.forEach((conditionKey) => {
    const currentRule = currentRules?.get(conditionKey);
    if (!currentRule) {
      return;
    }

    const rowData = new Map<DiffColumn, CellDataType<string, ValidConfigEntryStaged>>([
      [
        DiffColumn.Key,
        {
          type: ColumnType.Other,
          value: getConditionNameWithOverride(conditionKey, conditionNameOverrides),
        },
      ],
      [DiffColumn.Before, ruleTokensToCellData(currentRule.tokens)],
      [DiffColumn.After, ruleTokensToCellData(undefined)],
    ]);

    const deletedActions = getDeletedRuleActions?.(conditionKey);
    if (deletedActions) {
      rowData.set(DiffColumn.Actions, {
        type: ColumnType.Actions,
        actions: deletedActions,
      });
    }

    rows.push({
      rowKey: conditionKey,
      cells: rowData,
    });
  });

  const stagedRuleEntries = stagedRules ? Array.from(stagedRules.entries()) : [];
  stagedRuleEntries.forEach(([conditionKey, stagedRule]) => {
    const currentRule = currentRules?.get(conditionKey);
    if (areRuleTokensEqual(currentRule?.tokens, stagedRule.tokens)) {
      return;
    }

    const rowData = new Map<DiffColumn, CellDataType<string, ValidConfigEntryStaged>>([
      [
        DiffColumn.Key,
        {
          type: ColumnType.Other,
          value: getConditionNameWithOverride(conditionKey, conditionNameOverrides),
        },
      ],
      [DiffColumn.Before, ruleTokensToCellData(currentRule?.tokens)],
      [DiffColumn.After, ruleTokensToCellData(stagedRule.tokens)],
    ]);

    const stagedActions = getStagedRuleActions?.(conditionKey, stagedRule);
    if (stagedActions) {
      rowData.set(DiffColumn.Actions, {
        type: ColumnType.Actions,
        actions: stagedActions,
      });
    }

    rows.push({
      rowKey: `${ruleDraftRowKeyPrefix}${conditionKey}`,
      cells: rowData,
    });
  });

  return rows;
};
