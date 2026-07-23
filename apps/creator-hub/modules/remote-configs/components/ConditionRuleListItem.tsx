import React, { FC, useCallback, useState } from 'react';
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
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ValidConditionRule } from '../api/validTypes';
import { useUpdateConditionMutation } from '../hooks/useConditionsActionMutations';
import RpnTokenChips from './RpnTokenChips';
import EditConditionDialog from './EditConditionDialog';

type ConditionRuleListItemProps = {
  conditionKey: string;
  rule: ValidConditionRule;
};

const ConditionRuleListItem: FC<ConditionRuleListItemProps> = ({ conditionKey, rule }) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { updateCondition, isUpdating } = useUpdateConditionMutation();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: conditionKey,
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

  const handleEditClick = useCallback(() => {
    setIsEditDialogOpen(true);
  }, []);

  const handleEditDialogClose = useCallback(() => {
    setIsEditDialogOpen(false);
  }, []);

  return (
    <React.Fragment>
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
            {conditionKey}
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
              style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
              {...attributes}
              {...listeners}>
              <IconButton
                variant='Utility'
                size='Medium'
                icon='icon-regular-three-bars-horizontal-triangles-vertical'
                ariaLabel={dragLabel}
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
                />
              </PopoverTrigger>
              <PopoverContent side='bottom' align='end' ariaLabel={moreLabel}>
                <Menu size='Medium'>
                  <MenuSection>
                    <MenuItem value='edit' title={editLabel} onSelect={handleEditClick} />
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
        onSave={(_name, updatedRule) => {
          updateCondition(conditionKey, undefined, updatedRule, {
            onSuccess: handleEditDialogClose,
          });
        }}
        existingConditionName={conditionKey}
        existingRule={rule}
        isSaving={isUpdating}
      />
    </React.Fragment>
  );
};

export default ConditionRuleListItem;
