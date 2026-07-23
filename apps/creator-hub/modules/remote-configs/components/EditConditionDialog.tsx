import { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button, Dialog, DialogContent, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ValidConditionRule } from '../api/validTypes';
import type { TargetingClauseFormData } from '../types/FormData';
import {
  createDefaultClause,
  parseRuleTokensToClauses,
  toConditionRuleTokens,
} from '../utils/configFormDataTransforms';
import ConditionRuleEditor from './ConditionRuleEditor';

type ConditionEditorFormData = {
  conditionName: string;
  clauses: TargetingClauseFormData[];
};

const buildDefaultValues = (
  existingConditionName?: string,
  existingRule?: ValidConditionRule,
): ConditionEditorFormData => {
  let clauses: TargetingClauseFormData[];
  if (existingRule) {
    const parsed = parseRuleTokensToClauses(existingRule.tokens);
    clauses = parsed.length > 0 ? parsed : [createDefaultClause()];
  } else {
    clauses = [createDefaultClause()];
  }
  return { conditionName: existingConditionName ?? '', clauses };
};

type EditConditionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (conditionName: string, rule: ValidConditionRule) => void;
  existingConditionName?: string;
  existingRule?: ValidConditionRule;
  isSaving?: boolean;
};

const EditConditionDialog: FC<EditConditionDialogProps> = ({
  open,
  onClose,
  onSave,
  existingConditionName,
  existingRule,
  isSaving = false,
}) => {
  const { tPendingTranslation, translate } = useTranslationWrapper(useTranslation());

  const isEditing = !!existingConditionName;

  const { control, handleSubmit, reset } = useForm<ConditionEditorFormData>({
    defaultValues: buildDefaultValues(existingConditionName, existingRule),
  });

  const { append, remove, update } = useFieldArray({
    control,
    name: 'clauses',
    keyName: 'fieldKey',
  });

  const clauses = useWatch({ control, name: 'clauses' });
  const conditionName = useWatch({ control, name: 'conditionName' });

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      reset(buildDefaultValues(existingConditionName, existingRule));
    }
    prevOpenRef.current = open;
  }, [open, existingConditionName, existingRule, reset]);

  const updateClause = useCallback(
    (clauseId: string, updater: (c: TargetingClauseFormData) => TargetingClauseFormData) => {
      const index = clauses?.findIndex((c) => c.id === clauseId) ?? -1;
      if (index >= 0 && clauses?.[index]) {
        update(index, updater(clauses[index]));
      }
    },
    [clauses, update],
  );

  const removeClause = useCallback(
    (clauseId: string) => {
      if ((clauses?.length ?? 0) <= 1) return;
      const index = clauses?.findIndex((c) => c.id === clauseId) ?? -1;
      if (index >= 0) remove(index);
    },
    [clauses, remove],
  );

  const addClause = useCallback(() => {
    append(createDefaultClause());
  }, [append]);

  const onSubmit = useCallback(
    (data: ConditionEditorFormData) => {
      const trimmedName = data.conditionName.trim();
      if (!trimmedName) return;
      const tokens = toConditionRuleTokens(data.clauses);
      onSave(trimmedName, { conditionKey: trimmedName, tokens });
    },
    [onSave],
  );

  const isFormValid = useMemo(() => {
    if (!conditionName?.trim()) return false;
    if (!clauses || clauses.length === 0) return false;
    return !clauses.some((c) => c.values.length === 0);
  }, [conditionName, clauses]);

  const editTitleLabel = tPendingTranslation(
    'Edit condition',
    'Title for the dialog when editing an existing condition.',
    translationKey(
      'Dialog.EditCondition.Title',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const createTitleLabel = tPendingTranslation(
    'Create condition',
    'Title for the dialog when creating a new condition.',
    translationKey(
      'Dialog.CreateCondition.Title',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const descriptionLabel = tPendingTranslation(
    'Define the targeting rules for this condition. Users matching the criteria will receive the conditional config value.',
    'Description text shown at the top of the condition edit/create dialog.',
    translationKey(
      'Dialog.EditCondition.Description',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const conditionNameLabel = tPendingTranslation(
    'Condition name',
    'Input label for naming a new targeting condition.',
    translationKey(
      'Label.ConfigCreation.AddTargeting.ConditionName',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const conditionNamePlaceholder = tPendingTranslation(
    'ex: New users',
    'Placeholder text in the condition name input field showing an example name.',
    translationKey(
      'Placeholder.ConfigCreation.AddTargeting.ConditionName',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const saveLabel = translate(translationKey('Action.Save', TranslationNamespace.Controls));
  const cancelLabel = translate(
    translationKey(
      'Dialog.CreateOrEdit.Button.Cancel',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const closeLabel = translate(translationKey('Action.Close', TranslationNamespace.Controls));

  const titleLabel = isEditing ? editTitleLabel : createTitleLabel;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel={closeLabel}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxHeight: 560,
              overflow: 'auto',
            }}>
            <div style={{ paddingTop: 2, paddingRight: 24 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: '-0.2px',
                  color: 'var(--color-content-emphasis)',
                  paddingBottom: 4,
                }}>
                {titleLabel}
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.4,
                  color: 'var(--color-content-default)',
                }}>
                {descriptionLabel}
              </div>
            </div>

            <Controller
              name='conditionName'
              control={control}
              render={({ field }) => (
                <TextInput
                  {...field}
                  id='edit-condition-name'
                  size='Large'
                  label={conditionNameLabel}
                  placeholder={conditionNamePlaceholder}
                  isDisabled={isEditing || isSaving}
                />
              )}
            />

            <ConditionRuleEditor
              clauses={clauses ?? []}
              onUpdateClause={updateClause}
              onRemoveClause={removeClause}
              onAddClause={addClause}
              isDisabled={isSaving}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, padding: 16 }}>
            <Button
              type='submit'
              variant='Emphasis'
              isDisabled={!isFormValid || isSaving}
              isLoading={isSaving}>
              {saveLabel}
            </Button>
            <Button type='button' variant='Standard' isDisabled={isSaving} onClick={onClose}>
              {cancelLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditConditionDialog;
