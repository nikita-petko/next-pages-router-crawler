import type { CSSProperties, FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button, Dialog, DialogContent, Radio, RadioGroup, TextArea } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  LogAttributeApiError,
  RegexOperation,
  type UniverseRegex,
} from '@modules/clients/analytics/logAttribute';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useCreateUniverseRegexMutation,
  useUpdateUniverseRegexMutation,
} from '../../hooks/useUniverseRegexes';
import {
  REGEX_RULE_FIELD_MAX_LENGTH,
  hasDuplicateRegexRule,
  validateRegexPattern,
  validateRuleOutputLength,
  type RegexRuleDuplicateCandidate,
  type RegexRuleValidationCode,
} from './regexRuleValidation';

const ErrorReportRuleAction = {
  Ignore: 'ignore',
  Group: 'group',
} as const;
const EMPTY_EXISTING_RULES: UniverseRegex[] = [];
const ERROR_REPORT_RULE_DIALOG_WIDTH_CLASS = 'width-[640px]';
const RULE_TEXTAREA_ROWS = 2;
const RULE_TEXTAREA_STYLE: CSSProperties = { resize: 'vertical' };

type ErrorReportRuleAction = (typeof ErrorReportRuleAction)[keyof typeof ErrorReportRuleAction];

type RuleFormData = {
  pattern: string;
  action: ErrorReportRuleAction | null;
  output: string;
  testInput: string;
};

const getActionFromRegexOperation = (regexOperation: RegexOperation): ErrorReportRuleAction =>
  regexOperation === RegexOperation.Group
    ? ErrorReportRuleAction.Group
    : ErrorReportRuleAction.Ignore;

const getDefaultValues = (edit?: UniverseRegex, initialPattern?: string): RuleFormData => ({
  pattern: edit?.pattern ?? initialPattern ?? '',
  action: edit
    ? getActionFromRegexOperation(edit.regexOperation)
    : initialPattern
      ? ErrorReportRuleAction.Ignore
      : null,
  output: edit?.output ?? '',
  testInput: '',
});

export type ErrorReportRuleFormDialogProps = {
  open: boolean;
  edit?: UniverseRegex;
  existingRules?: UniverseRegex[];
  /**
   * Pre-fills the pattern field for a create (ignored when `edit` is set). Used
   * by the "Ignore error" flow to seed an editable, already-valid starting
   * pattern when the message is too long to ignore in one click.
   */
  initialPattern?: string;
  onClose: () => void;
  onCreateSuccess?: () => void;
};

const ErrorReportRuleFormDialog: FC<ErrorReportRuleFormDialogProps> = ({
  open,
  edit,
  existingRules = EMPTY_EXISTING_RULES,
  initialPattern,
  onClose,
  onCreateSuccess,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  const isEditing = !!edit;

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<RuleFormData>({
    mode: 'onChange',
    defaultValues: getDefaultValues(edit),
  });
  const [watchedPattern, selectedAction, watchedOutput, watchedTestInput] = useWatch({
    control,
    name: ['pattern', 'action', 'output', 'testInput'],
  });

  type TestResult = {
    kind: 'match' | 'mismatch';
    message: string;
    pattern: string;
    action: ErrorReportRuleAction | null;
    output: string;
    testInput: string;
  };
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const {
    mutateAsync: createRule,
    isPending: isCreatePending,
    error: createError,
    reset: resetCreate,
  } = useCreateUniverseRegexMutation(universeId);
  const {
    mutateAsync: updateRule,
    isPending: isUpdatePending,
    error: updateError,
    reset: resetUpdate,
  } = useUpdateUniverseRegexMutation(universeId);

  // Re-seed the form whenever the dialog (re)opens or the edited rule changes,
  // since this dialog stays mounted across open/close and create/edit targets.
  useEffect(() => {
    if (open) {
      reset(getDefaultValues(edit, initialPattern));
      resetCreate();
      resetUpdate();
    }
  }, [open, edit, initialPattern, reset, resetCreate, resetUpdate]);

  const isPending = isCreatePending || isUpdatePending;
  const submitError = isEditing ? updateError : createError;

  const closeDialog = useCallback(() => {
    setTestResult(null);
    onClose();
  }, [onClose]);

  const getCandidateRule = useCallback(
    ({ pattern }: Pick<RuleFormData, 'pattern'>): RegexRuleDuplicateCandidate => ({
      id: edit?.id,
      pattern,
    }),
    [edit?.id],
  );

  const onSubmit = useCallback(
    async (formData: RuleFormData) => {
      if (!formData.action) {
        return;
      }
      const candidate = getCandidateRule(formData);
      if (hasDuplicateRegexRule(candidate, existingRules)) {
        return;
      }

      const regexOperation =
        formData.action === ErrorReportRuleAction.Group
          ? RegexOperation.Group
          : RegexOperation.Ignore;
      const output = regexOperation === RegexOperation.Group ? formData.output : '';
      try {
        if (isEditing && edit) {
          await updateRule({ id: edit.id, pattern: formData.pattern, output, regexOperation });
        } else {
          await createRule({ pattern: formData.pattern, output, regexOperation });
          onCreateSuccess?.();
        }
        closeDialog();
      } catch {
        // Surface the error via the `submitError` state below; keep the dialog open.
      }
    },
    [
      createRule,
      updateRule,
      isEditing,
      edit,
      closeDialog,
      existingRules,
      getCandidateRule,
      onCreateSuccess,
    ],
  );

  const title = isEditing
    ? translate(translationKey('Heading.ErrorReportRule.Edit', TranslationNamespace.Analytics))
    : translate(translationKey('Heading.ErrorReportRule.Create', TranslationNamespace.Analytics));

  const closeLabel = translate(translationKey('Action.Close', TranslationNamespace.Controls));
  const submitLabel = isEditing
    ? translate(translationKey('Action.Save', TranslationNamespace.Controls))
    : translate(translationKey('Action.Create', TranslationNamespace.Controls));

  const testButtonLabel = translate(
    translationKey('Action.ErrorReportRule.Test', TranslationNamespace.Analytics),
  );
  const matchLabel = translate(
    translationKey('Helper.ErrorReportRule.TestMatch', TranslationNamespace.Analytics),
  );
  const validationErrorLabel = translate(
    translationKey('Error.ErrorReportRule.Validation', TranslationNamespace.Analytics),
  );
  const genericErrorLabel = translate(
    translationKey('Error.ErrorReportRule.Generic', TranslationNamespace.Analytics),
  );
  const duplicateRuleLabel = translate(
    translationKey('Error.ErrorReportRule.Duplicate', TranslationNamespace.Analytics),
  );

  const submitErrorMessage = useMemo(() => {
    if (!submitError) {
      return null;
    }
    if (submitError instanceof LogAttributeApiError && submitError.status === 409) {
      return duplicateRuleLabel;
    }
    if (submitError instanceof LogAttributeApiError && submitError.status === 400) {
      return validationErrorLabel;
    }
    return genericErrorLabel;
  }, [submitError, duplicateRuleLabel, validationErrorLabel, genericErrorLabel]);

  const noMatchLabel = translate(
    translationKey('Helper.ErrorReportRule.TestNoMatch', TranslationNamespace.Analytics),
  );
  const invalidRegexLabel = translate(
    translationKey('Helper.ErrorReportRule.TestInvalidRegex', TranslationNamespace.Analytics),
  );

  const patternEmptyLabel = translate(
    translationKey('Error.ErrorReportRule.PatternEmpty', TranslationNamespace.Analytics),
  );
  const patternTooLongLabel = translate(
    translationKey('Error.ErrorReportRule.PatternTooLong', TranslationNamespace.Analytics),
    { max: String(REGEX_RULE_FIELD_MAX_LENGTH) },
  );
  const outputTooLongLabel = translate(
    translationKey('Error.ErrorReportRule.OutputTooLong', TranslationNamespace.Analytics),
    { max: String(REGEX_RULE_FIELD_MAX_LENGTH) },
  );
  const leadingWildcardLabel = translate(
    translationKey('Error.ErrorReportRule.LeadingWildcard', TranslationNamespace.Analytics),
  );
  const nestedRepeatingQuantifierLabel = translate(
    translationKey(
      'Error.ErrorReportRule.NestedRepeatingQuantifier',
      TranslationNamespace.Analytics,
    ),
  );
  const invalidSyntaxLabel = translate(
    translationKey('Error.ErrorReportRule.InvalidSyntax', TranslationNamespace.Analytics),
  );

  const patternErrorForCode = useCallback(
    (code: RegexRuleValidationCode): string => {
      switch (code) {
        case 'empty':
          return patternEmptyLabel;
        case 'tooLong':
          return patternTooLongLabel;
        case 'leadingWildcard':
          return leadingWildcardLabel;
        case 'nestedRepeatingQuantifier':
          return nestedRepeatingQuantifierLabel;
        case 'invalidSyntax':
          return invalidSyntaxLabel;
        default:
          return invalidSyntaxLabel;
      }
    },
    [
      patternEmptyLabel,
      patternTooLongLabel,
      leadingWildcardLabel,
      nestedRepeatingQuantifierLabel,
      invalidSyntaxLabel,
    ],
  );

  const validatePatternField = useCallback(
    (value: string): true | string => {
      const result = validateRegexPattern(value);
      if (!result.isValid) {
        return patternErrorForCode(result.code);
      }

      const candidate = getCandidateRule({
        pattern: value,
      });
      return hasDuplicateRegexRule(candidate, existingRules) ? duplicateRuleLabel : true;
    },
    [patternErrorForCode, getCandidateRule, existingRules, duplicateRuleLabel],
  );

  const patternDisplayError = useMemo(() => {
    const value = watchedPattern ?? '';
    if (value.length === 0) {
      return undefined;
    }
    const result = validateRegexPattern(value);
    if (!result.isValid) {
      return patternErrorForCode(result.code);
    }

    const candidate = getCandidateRule({
      pattern: value,
    });
    return hasDuplicateRegexRule(candidate, existingRules) ? duplicateRuleLabel : undefined;
  }, [watchedPattern, patternErrorForCode, getCandidateRule, existingRules, duplicateRuleLabel]);

  const validateOutputField = useCallback(
    (value: string): true | string => {
      const result = validateRuleOutputLength(value ?? '');
      return result.isValid ? true : outputTooLongLabel;
    },
    [outputTooLongLabel],
  );

  const isTestDisabled = !watchedPattern || !watchedTestInput;

  const visibleTestResult =
    testResult &&
    testResult.pattern === (watchedPattern ?? '') &&
    testResult.action === (selectedAction ?? null) &&
    testResult.output === (watchedOutput ?? '') &&
    testResult.testInput === (watchedTestInput ?? '')
      ? testResult
      : null;

  const runTest = useCallback(() => {
    if (!watchedPattern || !watchedTestInput) {
      return;
    }

    const resultContext = {
      pattern: watchedPattern,
      action: selectedAction ?? null,
      output: watchedOutput ?? '',
      testInput: watchedTestInput,
    };

    const validationResult = validateRegexPattern(watchedPattern);
    if (!validationResult.isValid) {
      setTestResult({
        ...resultContext,
        kind: 'mismatch',
        message: patternErrorForCode(validationResult.code),
      });
      return;
    }

    let regex: RegExp;
    try {
      regex = new RegExp(watchedPattern);
    } catch {
      setTestResult({ ...resultContext, kind: 'mismatch', message: invalidRegexLabel });
      return;
    }

    if (regex.test(watchedTestInput)) {
      setTestResult({ ...resultContext, kind: 'match', message: matchLabel });
      return;
    }

    setTestResult({ ...resultContext, kind: 'mismatch', message: noMatchLabel });
  }, [
    watchedPattern,
    selectedAction,
    watchedOutput,
    watchedTestInput,
    invalidRegexLabel,
    patternErrorForCode,
    matchLabel,
    noMatchLabel,
  ]);

  const actionOptions = useMemo(
    () => [
      {
        value: ErrorReportRuleAction.Ignore,
        label: translate(
          translationKey('Label.ErrorReportRule.Action.Ignore', TranslationNamespace.Analytics),
        ),
      },
      {
        value: ErrorReportRuleAction.Group,
        label: translate(
          translationKey('Label.ErrorReportRule.Action.Group', TranslationNamespace.Analytics),
        ),
      },
    ],
    [translate],
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        closeDialog();
      }
    },
    [closeDialog],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      size='Medium'
      isModal
      hasCloseAffordance
      closeLabel={closeLabel}>
      <DialogContent className={`${ERROR_REPORT_RULE_DIALOG_WIDTH_CLASS} !max-width-[95vw]`}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className='padding-top-xlarge padding-x-xlarge flex flex-col gap-large'>
            <div className='padding-top-[2px] padding-right-large'>
              <div className='text-heading-small content-emphasis padding-bottom-xxsmall'>
                {title}
              </div>
            </div>

            <Controller
              control={control}
              name='pattern'
              rules={{ validate: validatePatternField }}
              render={({ field }) => {
                return (
                  <div className='flex flex-col gap-xsmall'>
                    <TextArea
                      {...field}
                      className='!gap-medium'
                      id='error-report-rule-pattern'
                      size='Large'
                      rows={RULE_TEXTAREA_ROWS}
                      textareaStyle={RULE_TEXTAREA_STYLE}
                      required
                      hasError={!!patternDisplayError}
                      label={translate(
                        translationKey(
                          'Label.ErrorReportRule.Pattern',
                          TranslationNamespace.Analytics,
                        ),
                      )}
                      placeholder={translate(
                        translationKey(
                          'Placeholder.ErrorReportRule.Pattern',
                          TranslationNamespace.Analytics,
                        ),
                      )}
                    />
                    {patternDisplayError ? (
                      <span className='text-caption-small content-system-alert'>
                        {patternDisplayError}
                      </span>
                    ) : null}
                  </div>
                );
              }}
            />

            <Controller
              control={control}
              name='action'
              rules={{ validate: (value) => value !== null }}
              render={({ field }) => (
                <div className='flex flex-col gap-medium'>
                  <div className='text-label-large content-emphasis'>
                    {translate(
                      translationKey(
                        'Label.ErrorReportRule.Action',
                        TranslationNamespace.Analytics,
                      ),
                    )}
                  </div>
                  <RadioGroup
                    className='gap-medium [&_label]:text-body-large'
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                    size='Medium'>
                    {actionOptions.map((option) => {
                      return <Radio key={option.value} value={option.value} label={option.label} />;
                    })}
                  </RadioGroup>
                </div>
              )}
            />

            {selectedAction === ErrorReportRuleAction.Group ? (
              <Controller
                control={control}
                name='output'
                rules={{
                  required: selectedAction === ErrorReportRuleAction.Group,
                  validate: validateOutputField,
                }}
                render={({ field, fieldState }) => {
                  const outputError =
                    fieldState.isTouched && fieldState.error?.message
                      ? fieldState.error.message
                      : undefined;
                  return (
                    <div className='flex flex-col gap-xsmall'>
                      <TextArea
                        {...field}
                        className='!gap-medium'
                        id='error-report-rule-output'
                        size='Large'
                        rows={RULE_TEXTAREA_ROWS}
                        textareaStyle={RULE_TEXTAREA_STYLE}
                        required
                        hasError={fieldState.invalid && fieldState.isTouched}
                        label={translate(
                          translationKey(
                            'Label.ErrorReportRule.Output',
                            TranslationNamespace.Analytics,
                          ),
                        )}
                        placeholder={translate(
                          translationKey(
                            'Placeholder.ErrorReportRule.Output',
                            TranslationNamespace.Analytics,
                          ),
                        )}
                      />
                      {outputError ? (
                        <span className='text-caption-small content-system-alert'>
                          {outputError}
                        </span>
                      ) : null}
                    </div>
                  );
                }}
              />
            ) : null}

            <Controller
              control={control}
              name='testInput'
              render={({ field }) => (
                <div className='flex flex-col gap-none'>
                  <TextArea
                    {...field}
                    className='!gap-medium'
                    id='error-report-rule-test-input'
                    size='Large'
                    rows={RULE_TEXTAREA_ROWS}
                    textareaStyle={RULE_TEXTAREA_STYLE}
                    hasError={visibleTestResult?.kind === 'mismatch'}
                    label={translate(
                      translationKey(
                        'Label.ErrorReportRule.TestInput',
                        TranslationNamespace.Analytics,
                      ),
                    )}
                  />
                  <div className='flex items-start justify-between gap-small margin-top-[2px]'>
                    <div className='grow basis-0'>
                      {visibleTestResult?.kind === 'match' ? (
                        <span className='text-caption-small content-system-success'>
                          {visibleTestResult.message}
                        </span>
                      ) : null}
                      {visibleTestResult?.kind === 'mismatch' ? (
                        <span className='text-caption-small content-system-alert'>
                          {visibleTestResult.message}
                        </span>
                      ) : null}
                    </div>
                    <Button
                      className='margin-top-[6px]'
                      variant='Standard'
                      size='Medium'
                      type='button'
                      isDisabled={isTestDisabled}
                      onClick={runTest}>
                      {testButtonLabel}
                    </Button>
                  </div>
                </div>
              )}
            />
          </div>

          {submitErrorMessage ? (
            <div className='padding-x-xlarge'>
              <span className='text-caption-small content-system-alert'>{submitErrorMessage}</span>
            </div>
          ) : null}

          <div className='flex gap-small margin-top-medium padding-x-xlarge padding-bottom-xlarge width-full'>
            <Button
              className='grow basis-0 width-full'
              variant='Emphasis'
              type='submit'
              isDisabled={!isValid || !!patternDisplayError || isPending}>
              {submitLabel}
            </Button>
            <Button
              className='grow basis-0 width-full'
              variant='Standard'
              type='button'
              isDisabled={isPending}
              onClick={closeDialog}>
              {translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorReportRuleFormDialog;
