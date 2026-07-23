import type { FC } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Snackbar,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ValidConditionRule } from '../api/validTypes';
import {
  useDeleteConditionMutation,
  useUpdateConditionMutation,
} from '../hooks/useConditionsActionMutations';
import type { ConfigActionError } from '../hooks/useConfigsMutation';
import EditConditionDialog from './EditConditionDialog';
import RpnTokenChips from './RpnTokenChips';

const floatingSnackbarContainerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 'max(var(--padding-xxlarge, 32px), env(safe-area-inset-bottom))',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1400,
  pointerEvents: 'none',
};

const floatingSnackbarStyle: React.CSSProperties = {
  position: 'relative',
  pointerEvents: 'auto',
};

type ConditionRuleListItemProps = {
  conditionKey: string;
  rule: ValidConditionRule;
  isStaged?: boolean;
  hasStagedChanges?: boolean;
  lockedByExperiment?: boolean;
  /**
   * When true, mutating interactions (drag-to-reorder, Edit menu) are blocked.
   * The row remains visible so users without configure permission can still
   * read the condition and its rules.
   */
  disabled?: boolean;
  /**
   * Invoked after a successful condition update or delete so the parent can
   * refetch published configs and staged changes — keeping the list in sync
   * with what's actually on the server.
   */
  onMutationSuccess?: () => void;
};

const ConditionRuleListItem: FC<ConditionRuleListItemProps> = ({
  conditionKey,
  rule,
  isStaged = false,
  hasStagedChanges = false,
  lockedByExperiment = false,
  disabled = false,
  onMutationSuccess,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const { updateCondition, updateError, isUpdating, clearUpdateError } =
    useUpdateConditionMutation();
  const { deleteCondition, deleteError } = useDeleteConditionMutation();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: conditionKey,
    // dnd-kit gates sensors/listeners on this flag. Without it, the outer div
    // still captures pointer events even if the drag handle IconButton is
    // visually disabled.
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const editLabel = tPendingTranslation(
    'Edit',
    'Menu item label to edit a condition rule.',
    translationKey('Action.EditCondition', TranslationNamespace.UniverseConfigAndExperimentation),
  );

  const dragLabel = tPendingTranslation(
    'Reorder',
    'Aria label for the drag handle to reorder conditions.',
    translationKey(
      'Action.ReorderCondition',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const moreLabel = tPendingTranslation(
    'More options',
    'Aria label for the overflow menu on a condition row.',
    translationKey('Action.MoreOptions', TranslationNamespace.UniverseConfigAndExperimentation),
  );

  const deleteLabel = tPendingTranslation(
    'Delete',
    'Menu item label to delete a condition rule.',
    translationKey('Action.DeleteCondition', TranslationNamespace.UniverseConfigAndExperimentation),
  );

  const stagedConditionSuffix = tPendingTranslation(
    '(staged)',
    'Suffix appended to condition names that have staged changes.',
    translationKey(
      'Label.ConditionNameStagedSuffix',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const deleteDisabledDueToStagedChangesTooltip = tPendingTranslation(
    'Deletion is not allowed when there are staged changes.',
    'Tooltip shown when deleting a published condition is blocked because staged changes already exist.',
    translationKey(
      'Tooltip.DeleteConditionBlockedByStagedChanges',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const editDisabledDueToExperimentTooltip = tPendingTranslation(
    'Condition used by scheduled or running experiment',
    'Tooltip shown when editing a condition is blocked because it is used by an experiment.',
    translationKey(
      'Tooltip.ConditionLockedByExperiment',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const isDeleteDisabledDueToStagedChanges = !isStaged && hasStagedChanges;
  const isDeleteDisabled = disabled || isDeleteDisabledDueToStagedChanges;
  const isEditDisabled = disabled || lockedByExperiment;

  const handleEditClick = useCallback(() => {
    // Reset any stale error from a previous attempt so the dialog opens clean.
    setActionErrorMessage(null);
    clearUpdateError();
    setIsEditDialogOpen(true);
  }, [clearUpdateError]);

  const handleEditDialogClose = useCallback(() => {
    setIsEditDialogOpen(false);
    setActionErrorMessage(null);
    clearUpdateError();
  }, [clearUpdateError]);

  const handleDeleteClick = useCallback(() => {
    if (isDeleteDisabled) {
      return;
    }
    void deleteCondition(conditionKey, {
      onSuccess: () => {
        onMutationSuccess?.();
      },
    });
  }, [conditionKey, deleteCondition, isDeleteDisabled, onMutationSuccess]);

  const getConditionActionErrorMessage = useCallback(
    (error: ConfigActionError) => {
      return error.getTranslatedErrorMessage(tPendingTranslation);
    },
    [tPendingTranslation],
  );

  const handleConditionActionError = useCallback(
    (error: ConfigActionError) => {
      setActionErrorMessage(getConditionActionErrorMessage(error));
    },
    [getConditionActionErrorMessage],
  );

  useEffect(() => {
    const conditionActionError = updateError ?? deleteError;
    if (!conditionActionError) {
      return;
    }
    handleConditionActionError(conditionActionError);
  }, [deleteError, handleConditionActionError, updateError]);

  let dragHandleCursor: React.CSSProperties['cursor'] = 'grab';
  if (disabled) {
    dragHandleCursor = 'default';
  } else if (isDragging) {
    dragHandleCursor = 'grabbing';
  }

  const deleteMenuItem = (
    <MenuItem value='delete' onSelect={handleDeleteClick} disabled={isDeleteDisabled} asChild>
      <button type='button' disabled={isDeleteDisabled}>
        <span className='content-action-alert'>{deleteLabel}</span>
      </button>
    </MenuItem>
  );

  const editMenuItem = (
    <MenuItem value='edit' title={editLabel} onSelect={handleEditClick} disabled={isEditDisabled} />
  );

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          border: '1px solid var(--color-stroke-default)',
          borderRadius: 12,
          padding: '4px 0',
        }}>
        <div
          style={{
            display: 'flex',
            flex: '1 0 0',
            alignItems: 'center',
            minHeight: 52,
            minWidth: 0,
          }}>
          <div
            style={{
              flex: '1 0 0',
              padding: 20,
              minWidth: 0,
              fontSize: 14,
              color: 'var(--color-content-emphasis)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
            {isStaged ? `${conditionKey} ${stagedConditionSuffix}` : conditionKey}
          </div>
          <div
            style={{
              flex: '1 0 0',
              padding: 20,
              minWidth: 0,
              overflow: 'hidden',
            }}>
            <RpnTokenChips tokens={rule.tokens} />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 4,
              alignItems: 'center',
              paddingLeft: 20,
              paddingRight: 20,
              flexShrink: 0,
            }}>
            <div
              style={{
                cursor: dragHandleCursor,
                touchAction: 'none',
              }}
              {...(disabled ? {} : attributes)}
              {...(disabled ? {} : listeners)}>
              <IconButton
                variant='Utility'
                size='Medium'
                icon='icon-regular-three-bars-horizontal-triangles-vertical'
                ariaLabel={dragLabel}
                isDisabled={disabled}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <IconButton
                  as='button'
                  variant='Utility'
                  size='Medium'
                  icon='icon-regular-three-dots-vertical'
                  ariaLabel={moreLabel}
                  isDisabled={disabled}
                />
              </PopoverTrigger>
              <PopoverContent side='bottom' align='end' ariaLabel={moreLabel}>
                <Menu size='Medium'>
                  <MenuSection>
                    {lockedByExperiment ? (
                      <Tooltip title={editDisabledDueToExperimentTooltip} position='left-center'>
                        <TooltipTrigger asChild>
                          <span title={editDisabledDueToExperimentTooltip}>{editMenuItem}</span>
                        </TooltipTrigger>
                      </Tooltip>
                    ) : (
                      editMenuItem
                    )}
                    {isDeleteDisabledDueToStagedChanges ? (
                      <Tooltip
                        title={deleteDisabledDueToStagedChangesTooltip}
                        position='left-center'>
                        <TooltipTrigger asChild>
                          <span title={deleteDisabledDueToStagedChangesTooltip}>
                            {deleteMenuItem}
                          </span>
                        </TooltipTrigger>
                      </Tooltip>
                    ) : (
                      deleteMenuItem
                    )}
                  </MenuSection>
                </Menu>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <EditConditionDialog
        open={isEditDialogOpen}
        onClose={handleEditDialogClose}
        existingConditionName={conditionKey}
        existingRule={rule}
        isSaving={isUpdating}
        errorMessage={isEditDialogOpen ? actionErrorMessage : null}
        onErrorMessageClose={() => setActionErrorMessage(null)}
        onSave={(_name, updatedRule) => {
          // Clear any stale error before retrying so the snackbar reflects the
          // most recent attempt.
          setActionErrorMessage(null);
          void updateCondition(conditionKey, undefined, updatedRule, {
            onSuccess: () => {
              handleEditDialogClose();
              // Refresh published + staged data so the list reflects the
              // change we just persisted on the server.
              onMutationSuccess?.();
            },
            onError: (error) => {
              handleConditionActionError(error);
            },
          });
        }}
      />
      {!isEditDialogOpen && actionErrorMessage ? (
        <div style={floatingSnackbarContainerStyle}>
          <Snackbar
            title={actionErrorMessage}
            icon='icon-regular-triangle-exclamation'
            shouldAutoDismiss={false}
            onClose={() => setActionErrorMessage(null)}
            style={floatingSnackbarStyle}
          />
        </div>
      ) : null}
    </>
  );
};

export default ConditionRuleListItem;
