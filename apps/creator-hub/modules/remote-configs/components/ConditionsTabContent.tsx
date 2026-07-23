import React, { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Snackbar } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ErrorType } from '../api/universeConfigsClientEnums';
import type { ValidConditionRule, ValidRuleOrdering } from '../api/validTypes';
import useCanConfigureOrPublish from '../hooks/useCanConfigureOrPublish';
import type { ConfigActionError } from '../hooks/useConfigsMutation';
import { isConditionOrderDifferent } from '../utils/isConditionOrderDifferent';
import ConditionRuleListItem from './ConditionRuleListItem';

type ConditionsTabContentProps = {
  rules: Map<string, ValidConditionRule>;
  /**
   * Draft-only condition rules (newly created or updated in the current draft).
   * Merged on top of `rules` so staged conditions show up in the list.
   */
  draftRules?: Map<string, ValidConditionRule>;
  publishedRuleOrdering?: ValidRuleOrdering;
  stagedRuleOrdering?: ValidRuleOrdering;
  hasStagedChanges?: boolean;
  lockedConditionKeys?: ReadonlySet<string>;
  reorderRules: (params: {
    conditionOrder: Array<string>;
    onSuccess?: (data: { draftHash?: string }) => void;
    onError?: (error: ConfigActionError) => void;
  }) => Promise<void>;
  /**
   * Invoked after a per-condition mutation (update or delete) succeeds.
   * Wire this to the page bundle's refresh callback so the configs list and
   * staged changes both refetch from the server.
   */
  onConditionMutationSuccess?: () => void;
};

const verticalLockModifier: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

const EMPTY_LOCKED_KEYS: ReadonlySet<string> = new Set();

const deriveDisplayKeys = (
  orderedKeys: string[],
  rules: Map<string, ValidConditionRule>,
  shouldAppendUnorderedRules = true,
): string[] => {
  const rulesKeySet = new Set(rules.keys());
  const ordered = orderedKeys.filter((key) => rulesKeySet.has(key));
  if (!shouldAppendUnorderedRules) {
    return ordered;
  }
  rulesKeySet.forEach((key) => {
    if (!orderedKeys.includes(key)) {
      ordered.push(key);
    }
  });
  return ordered;
};

const ConditionsTabContent: FC<ConditionsTabContentProps> = ({
  rules,
  draftRules,
  publishedRuleOrdering,
  stagedRuleOrdering,
  hasStagedChanges,
  lockedConditionKeys = EMPTY_LOCKED_KEYS,
  reorderRules,
  onConditionMutationSuccess,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { canConfigure } = useCanConfigureOrPublish();
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState<string | null>(null);

  // Merge published rules with staged draft rules so newly created/updated
  // conditions appear in the list. Draft entries override published entries
  // on key collision (staged state is what the user is currently editing).
  const mergedRules = useMemo(() => {
    if (!draftRules || draftRules.size === 0) {
      return rules;
    }
    return new Map<string, ValidConditionRule>([...rules, ...draftRules]);
  }, [rules, draftRules]);

  const isStagedConditionOrderActive = useMemo(() => {
    const stagedConditionOrder = stagedRuleOrdering?.conditionOrder;
    return (
      !!stagedConditionOrder &&
      isConditionOrderDifferent(publishedRuleOrdering?.conditionOrder, stagedConditionOrder)
    );
  }, [publishedRuleOrdering?.conditionOrder, stagedRuleOrdering?.conditionOrder]);

  const preferredConditionOrder = useMemo(() => {
    const stagedConditionOrder = stagedRuleOrdering?.conditionOrder;
    if (isStagedConditionOrderActive) {
      return stagedConditionOrder;
    }
    return publishedRuleOrdering?.conditionOrder;
  }, [
    isStagedConditionOrderActive,
    publishedRuleOrdering?.conditionOrder,
    stagedRuleOrdering?.conditionOrder,
  ]);

  const hasStagedOrderingChanges = useMemo(() => {
    return isConditionOrderDifferent(
      publishedRuleOrdering?.conditionOrder,
      stagedRuleOrdering?.conditionOrder,
    );
  }, [publishedRuleOrdering?.conditionOrder, stagedRuleOrdering?.conditionOrder]);

  const hasAnyStagedChanges = useMemo(() => {
    if (hasStagedChanges !== undefined) {
      return hasStagedChanges;
    }

    return (draftRules?.size ?? 0) > 0 || hasStagedOrderingChanges;
  }, [draftRules?.size, hasStagedChanges, hasStagedOrderingChanges]);

  const initialOrder = useMemo(() => {
    if (preferredConditionOrder && preferredConditionOrder.length > 0) {
      return preferredConditionOrder;
    }
    return Array.from(mergedRules.keys());
  }, [mergedRules, preferredConditionOrder]);

  const [orderedKeys, setOrderedKeys] = useState<string[]>(initialOrder);
  const previousOrderRef = useRef<string[]>(orderedKeys);

  useEffect(() => {
    setOrderedKeys(initialOrder);
  }, [initialOrder]);

  const displayKeys = useMemo(
    () => deriveDisplayKeys(orderedKeys, mergedRules, !isStagedConditionOrderActive),
    [isStagedConditionOrderActive, orderedKeys, mergedRules],
  );

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

  const reorderLockedByExperimentErrorLabel = tPendingTranslation(
    'Condition used by scheduled or running experiment. Changes have been reverted.',
    'Error message shown when drag-and-drop reordering of conditions fails because a condition is locked by an experiment.',
    translationKey(
      'Error.ReorderConditionsLockedByExperiment',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      // Defense in depth: even if a drag handle leaked through for a user
      // without configure permission, skip the mutation. ConditionRuleListItem
      // also disables the drag handle + sortable sensors via the `disabled`
      // prop, so this branch should not normally be reachable.
      if (!canConfigure) {
        return;
      }

      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = displayKeys.indexOf(String(active.id));
      const newIndex = displayKeys.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newOrder = arrayMove(displayKeys, oldIndex, newIndex);

      previousOrderRef.current = orderedKeys;
      setOrderedKeys(newOrder);

      void reorderRules({
        conditionOrder: newOrder,
        onError: (error) => {
          setOrderedKeys(previousOrderRef.current);
          setErrorSnackbarMessage(
            error.type === ErrorType.ConfigLockedByExperiment
              ? reorderLockedByExperimentErrorLabel
              : reorderErrorLabel,
          );
        },
      });
    },
    [
      canConfigure,
      displayKeys,
      orderedKeys,
      reorderErrorLabel,
      reorderLockedByExperimentErrorLabel,
      reorderRules,
    ],
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

  const emptyStateTitle = tPendingTranslation(
    'No conditions yet',
    'Title shown on the conditions tab when no conditions have been created.',
    translationKey(
      'Label.ConditionsTab.EmptyState.Title',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const emptyStateDescription = tPendingTranslation(
    'Conditions are created when you add targeting to a config. Reorder conditions here to set their priority.',
    'Description shown on the conditions tab when no conditions exist, explaining that conditions are created from within a config and reordered here.',
    translationKey(
      'Label.ConditionsTab.EmptyState.Description',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  if (displayKeys.length === 0) {
    return (
      <div className='flex items-center justify-center width-full min-height-[calc(100vh-300px)]'>
        <EmptyState
          title={emptyStateTitle}
          description={emptyStateDescription}
          size='small'
          illustration='apiKeys'
        />
      </div>
    );
  }

  return (
    <>
      <div className='flex flex-col gap-xlarge width-full'>
        {/* Foundation stroke utilities only set all-side borders, so the single
            bottom rule that spans the header row stays as inline CSS. */}
        <div
          className='flex items-center width-full clip'
          style={{ borderBottom: '1px solid var(--color-stroke-default)' }}>
          <div className='grow-1 shrink-0 basis-0 flex items-center min-height-1200 padding-y-medium padding-x-xlarge'>
            <span className='text-caption-large content-emphasis'>{nameHeader}</span>
          </div>
          <div className='grow-1 shrink-0 basis-0 flex items-center min-height-1200 padding-y-medium padding-x-xlarge'>
            <span className='text-caption-large content-emphasis'>{rulesHeader}</span>
          </div>
          <div className='shrink-0 min-height-1200 padding-y-medium padding-x-xlarge width-[124px]' />
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[verticalLockModifier]}>
          <SortableContext items={displayKeys} strategy={verticalListSortingStrategy}>
            <div className='flex flex-col gap-xlarge width-full'>
              {displayKeys.map((key) => {
                const rule = mergedRules.get(key);
                if (!rule) {
                  return null;
                }
                return (
                  <ConditionRuleListItem
                    key={key}
                    conditionKey={key}
                    rule={rule}
                    isStaged={draftRules?.has(key) ?? false}
                    hasStagedChanges={hasAnyStagedChanges}
                    lockedByExperiment={lockedConditionKeys.has(key)}
                    disabled={!canConfigure}
                    onMutationSuccess={onConditionMutationSuccess}
                  />
                );
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
    </>
  );
};

export default ConditionsTabContent;
