import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  Modifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Snackbar } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ValidConditionRule, ValidRuleOrdering } from '../api/validTypes';
import { ConfigActionError } from '../hooks/useConfigsMutation';
import ConditionRuleListItem from './ConditionRuleListItem';

type ConditionsTabContentProps = {
  rules: Map<string, ValidConditionRule>;
  ruleOrdering?: ValidRuleOrdering;
  reorderRules: (params: {
    conditionOrder: Array<string>;
    onSuccess?: (data: { draftHash?: string }) => void;
    onError?: (error: ConfigActionError) => void;
  }) => Promise<void>;
};

const verticalLockModifier: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

const deriveDisplayKeys = (
  orderedKeys: string[],
  rules: Map<string, ValidConditionRule>,
): string[] => {
  const rulesKeySet = new Set(rules.keys());
  const ordered = orderedKeys.filter((key) => rulesKeySet.has(key));
  rulesKeySet.forEach((key) => {
    if (!orderedKeys.includes(key)) {
      ordered.push(key);
    }
  });
  return ordered;
};

const ConditionsTabContent: FC<ConditionsTabContentProps> = ({
  rules,
  ruleOrdering,
  reorderRules,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState<string | null>(null);

  const initialOrder = useMemo(() => {
    if (ruleOrdering?.conditionOrder && ruleOrdering.conditionOrder.length > 0) {
      return ruleOrdering.conditionOrder;
    }
    return Array.from(rules.keys());
  }, [rules, ruleOrdering]);

  const [orderedKeys, setOrderedKeys] = useState<string[]>(initialOrder);
  const previousOrderRef = useRef<string[]>(orderedKeys);

  useEffect(() => {
    setOrderedKeys(initialOrder);
  }, [initialOrder]);

  const displayKeys = useMemo(() => deriveDisplayKeys(orderedKeys, rules), [orderedKeys, rules]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reorderErrorLabel = tPendingTranslation(
    'Failed to update condition order. Changes have been reverted.',
    'Error message shown when drag-and-drop reordering of conditions fails.',
    translationKey(
      'Error.ReorderConditions',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = displayKeys.indexOf(String(active.id));
      const newIndex = displayKeys.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(displayKeys, oldIndex, newIndex);

      previousOrderRef.current = orderedKeys;
      setOrderedKeys(newOrder);

      reorderRules({
        conditionOrder: newOrder,
        onError: () => {
          setOrderedKeys(previousOrderRef.current);
          setErrorSnackbarMessage(reorderErrorLabel);
        },
      });
    },
    [displayKeys, orderedKeys, reorderErrorLabel, reorderRules],
  );

  const nameHeader = tPendingTranslation(
    'Name',
    'Column header for the condition name in the conditions table.',
    translationKey(
      'Label.ConditionsTab.ColumnName',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const rulesHeader = tPendingTranslation(
    'Rules',
    'Column header for the condition rules in the conditions table.',
    translationKey(
      'Label.ConditionsTab.ColumnRules',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  if (displayKeys.length === 0) {
    return null;
  }

  return (
    <React.Fragment>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
          <div
            style={{
              flex: '1 0 0',
              display: 'flex',
              alignItems: 'center',
              minHeight: 48,
              padding: '12px 20px',
              borderBottom: '1px solid var(--color-stroke-default)',
            }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-content-emphasis)',
              }}>
              {nameHeader}
            </span>
          </div>
          <div
            style={{
              flex: '1 0 0',
              display: 'flex',
              alignItems: 'center',
              minHeight: 48,
              padding: '12px 20px',
              borderBottom: '1px solid var(--color-stroke-default)',
            }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-content-emphasis)',
              }}>
              {rulesHeader}
            </span>
          </div>
          <div
            style={{
              width: 124,
              flexShrink: 0,
              minHeight: 48,
              padding: '12px 20px',
              borderBottom: '1px solid var(--color-stroke-default)',
            }}
          />
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[verticalLockModifier]}>
          <SortableContext items={displayKeys} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
              {displayKeys.map((key) => {
                const rule = rules.get(key);
                if (!rule) return null;
                return <ConditionRuleListItem key={key} conditionKey={key} rule={rule} />;
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {errorSnackbarMessage ? (
        <Snackbar
          title={errorSnackbarMessage}
          icon='icon-regular-triangle-exclamation'
          shouldAutoDismiss
          onClose={() => setErrorSnackbarMessage(null)}
        />
      ) : null}
    </React.Fragment>
  );
};

export default ConditionsTabContent;
