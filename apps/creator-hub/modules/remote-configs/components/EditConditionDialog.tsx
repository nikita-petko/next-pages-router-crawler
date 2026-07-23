import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button, Dialog, DialogContent, Snackbar, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RpnOperator } from '../api/universeConfigsClientEnums';
import type { ValidConditionRule } from '../api/validTypes';
import type { TargetingClauseFormData } from '../types/FormData';
import {
  createDefaultClause,
  normalizeClauseJoiners,
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
    clauses =
      parsed.length > 0 ? normalizeClauseJoiners(parsed, RpnOperator.And) : [createDefaultClause()];
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
  errorMessage?: string | null;
  onErrorMessageClose?: () => void;
};

const floatingSnackbarContainerStyle: CSSProperties = {
  position: 'fixed',
  bottom: 'max(var(--padding-xxlarge, 32px), env(safe-area-inset-bottom))',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1400,
  pointerEvents: 'none',
};

const floatingSnackbarStyle: CSSProperties = {
  position: 'relative',
  pointerEvents: 'auto',
};

const EditConditionDialog: FC<EditConditionDialogProps> = ({
  open,
  onClose,
  onSave,
  existingConditionName,
  existingRule,
  isSaving = false,
  errorMessage = null,
  onErrorMessageClose,
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
      if ((clauses?.length ?? 0) <= 1) {
        return;
      }
      const index = clauses?.findIndex((c) => c.id === clauseId) ?? -1;
      if (index >= 0) {
        remove(index);
      }
    },
    [clauses, remove],
  );

  const addClause = useCallback(() => {
    append(createDefaultClause());
  }, [append]);

  const onSubmit = useCallback(
    (data: ConditionEditorFormData) => {
      const trimmedName = data.conditionName.trim();
      if (!trimmedName) {
        return;
      }
      const tokens = toConditionRuleTokens(normalizeClauseJoiners(data.clauses, RpnOperator.And));
      onSave(trimmedName, { conditionKey: trimmedName, tokens });
    },
    [onSave],
  );

  const isFormValid = useMemo(() => {
    if (!conditionName?.trim()) {
      return false;
    }
    if (!clauses || clauses.length === 0) {
      return false;
    }
    return !clauses.some((c) => !c.dimension || c.values.length === 0);
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
    'ex: NewUsers',
    'Placeholder text in the condition name input field showing an example valid condition name.',
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
        if (!isOpen) {
          onClose();
        }
      }}
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel={closeLabel}>
      <DialogContent style={{ width: 'min(960px, 95vw)', maxWidth: '95vw' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div
            className='padding-medium flex flex-col gap-medium scroll-y'
            style={{ maxHeight: 560 }}>
            <div className='padding-top-[2px] padding-right-large'>
              <div className='text-heading-small content-emphasis padding-bottom-xxsmall'>
                {titleLabel}
              </div>
              <div className='text-body-medium content-default'>{descriptionLabel}</div>
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

            <div className='padding-top-xsmall'>
              <ConditionRuleEditor
                clauses={clauses ?? []}
                onUpdateClause={updateClause}
                onRemoveClause={removeClause}
                onAddClause={addClause}
                isDisabled={isSaving}
              />
            </div>
          </div>

          <div className='flex gap-xsmall padding-medium'>
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
        {errorMessage ? (
          <div data-edit-condition-error-snackbar style={floatingSnackbarContainerStyle}>
            <Snackbar
              title={errorMessage}
              icon='icon-regular-triangle-exclamation'
              shouldAutoDismiss={false}
              onClose={() => onErrorMessageClose?.()}
              style={floatingSnackbarStyle}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default EditConditionDialog;
