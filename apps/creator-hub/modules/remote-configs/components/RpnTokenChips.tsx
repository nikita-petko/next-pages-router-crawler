import React, { FC, useMemo } from 'react';
import { Chip } from '@rbx/foundation-ui';
import type { ValidConditionRule } from '../api/validTypes';
import { RpnOperator } from '../api/universeConfigsClientEnums';
import { parseRuleTokensToClauses } from '../utils/configFormDataTransforms';

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

const USER_SEGMENTATION_PREFIX = 'UserSegmentation';

const formatDimensionLabel = (dimension: string): string => {
  let name = dimension;
  if (name.startsWith(USER_SEGMENTATION_PREFIX)) {
    name = name.slice(USER_SEGMENTATION_PREFIX.length);
  }
  return name.replace(/([a-z])([A-Z])/g, '$1 $2');
};

const formatValueLabel = (value: string): string => {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/(\d)([A-Z])/g, '$1 $2');
};

type RpnTokenChipsProps = {
  tokens: ValidConditionRule['tokens'];
};

const RpnTokenChips: FC<RpnTokenChipsProps> = ({ tokens }) => {
  const chipLabels = useMemo(() => {
    const clauses = parseRuleTokensToClauses(tokens);

    return clauses.map((clause, index) => {
      const dimensionLabel = formatDimensionLabel(clause.dimension);
      const operatorLabel = operatorDisplayMap[clause.operator] ?? clause.operator;
      const valuesStr = clause.values.map(formatValueLabel).join(', ');

      return {
        key: `clause-${index}`,
        text: `${dimensionLabel} ${operatorLabel} ${valuesStr}`,
        joiner: clause.joinerToNext === RpnOperator.Or ? 'OR' : 'AND',
        isLast: index === clauses.length - 1,
      };
    });
  }, [tokens]);

  if (chipLabels.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        alignItems: 'center',
        overflow: 'hidden',
      }}>
      {chipLabels.map((chip) => (
        <React.Fragment key={chip.key}>
          <Chip
            text={chip.text}
            size='Small'
            variant='Standard'
            isChecked={false}
            style={{ maxWidth: '100%', pointerEvents: 'none' }}
          />
          {!chip.isLast ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-content-muted)',
                paddingLeft: 2,
                paddingRight: 2,
                flexShrink: 0,
              }}>
              {chip.joiner}
            </span>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
};

export default RpnTokenChips;
