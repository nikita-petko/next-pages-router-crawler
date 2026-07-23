import { type FC, useCallback, useEffect, useMemo } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Button, Divider } from '@rbx/foundation-ui';
import { withTranslation } from '@rbx/intl';
import type { TranslationKey } from '@modules/analytics-translations/types';
import wellKnownAnalyticsTranslationNamespaces from '@modules/analytics-translations/wellKnownAnalyticsTranslationNamespaces';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import gameUpdateNotificationsClient from '@modules/clients/gameUpdateNotifications';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import {
  TextFilterProvider,
  type TextFilterFn,
} from '@modules/experience-analytics-shared/text-filter/TextFilterContext';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { defaultExperienceAlertFormValues } from '../../constants/alertFormConstants';
import {
  AnalyticsAlertErrorCode,
  isAnalyticsAlertErrorCode,
  readAnalyticsAlertErrorCode,
  type ExperienceAlertFormValues,
} from '../../constants/types';
import { getAlertFormValidationErrorMsg } from '../../constants/validationErrorMessages';
import { useExperienceAlertFormCrossFieldEffects } from '../../hooks/useExperienceAlertFormFieldEffects';
import ExperienceAlertBreakdownFields from './ExperienceAlertBreakdownFields';
import ExperienceAlertConditionFields from './ExperienceAlertConditionFields';
import ExperienceAlertFilterRows from './ExperienceAlertFilterRows';
import ExperienceAlertGranularityField from './ExperienceAlertGranularityField';
import ExperienceAlertMetricField from './ExperienceAlertMetricField';
import ExperienceAlertNameDescriptionFields from './ExperienceAlertNameDescriptionFields';
import ExperienceAlertOccurrencesField from './ExperienceAlertOccurrencesField';
import ExperienceAlertSeverityFields from './ExperienceAlertSeverityFields';
import ExperienceAlertWebhookField from './ExperienceAlertWebhookField';
import ViewMetricInExploreModeButton from './ViewMetricInExploreModeButton';

// Defined at module scope so the reference is stable across renders — the
// downstream `useTextFilterValidation` hook treats identity churn as a
// debounce reset.
const filterTextThroughGameUpdateNotifications: TextFilterFn = async (text) => {
  const response = await gameUpdateNotificationsClient.filterGameUpdateText({ body: text });
  return { isFiltered: response.isFiltered === true };
};

function mergeAlertFormDefaults(
  over?: Partial<ExperienceAlertFormValues>,
): ExperienceAlertFormValues {
  const base = defaultExperienceAlertFormValues();
  if (!over) {
    return base;
  }
  return {
    ...base,
    ...over,
    filters: over.filters ?? base.filters,
  };
}

export type ExperienceAlertFormProps = {
  pageTitleKey: TranslationKey;
  /** Optional initial field values merged with `defaultExperienceAlertFormValues`. Memoize the object when values are stable but the parent re-renders, so inline `{ ... }` does not trigger extra resets. */
  defaultValues?: Partial<ExperienceAlertFormValues>;
  /** Primary submit button label; defaults to create action. */
  submitButtonKey?: TranslationKey;
  /**
   * When true, the submit button is enabled even while the form is pristine.
   * Used by the create flow when `defaultValues` already carry a complete
   * prefill so the user can submit without making a throwaway edit. Validation
   * still runs on submit, so an incomplete/invalid prefill is blocked. Defaults
   * to `false`, preserving the edit flow's "must change something to save" gate.
   */
  allowPristineSubmit?: boolean;
  onSubmit: (values: ExperienceAlertFormValues) => void | Promise<void>;
  onCancel: () => void;
  resource: RAQIV2ChartResource;
};

const ExperienceAlertForm: FC<ExperienceAlertFormProps> = ({
  pageTitleKey,
  defaultValues,
  submitButtonKey,
  allowPristineSubmit = false,
  onSubmit,
  onCancel,
  resource,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const resolvedSubmitButtonKey =
    submitButtonKey ?? translationKey('Action.Create', TranslationNamespace.Analytics);

  const formDefaults = useMemo(() => mergeAlertFormDefaults(defaultValues), [defaultValues]);

  const formMethods = useForm<ExperienceAlertFormValues>({
    defaultValues: formDefaults,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const {
    clearErrors,
    control,
    handleSubmit,
    getFieldState,
    getValues,
    reset,
    setError,
    setValue,
    trigger,
    formState: { errors, isDirty, isSubmitted },
  } = formMethods;

  const handleSubmitWithErrorHandling = useCallback(
    async (values: ExperienceAlertFormValues): Promise<void> => {
      // RHF doesn't auto-clear `root.*` errors between submits, so a stale
      // server error would otherwise persist after the user fixes the issue
      // and resubmits.
      clearErrors('root.serverError');
      try {
        await onSubmit(values);
      } catch (error) {
        const code = await readAnalyticsAlertErrorCode(error);
        if (code === AnalyticsAlertErrorCode.TextFilterBlockedName) {
          setError(
            'name',
            {
              type: 'server',
              message: getAlertFormValidationErrorMsg(
                AnalyticsAlertErrorCode.TextFilterBlockedName,
                translate,
              ),
            },
            { shouldFocus: true },
          );
          return;
        }
        if (code === AnalyticsAlertErrorCode.TextFilterBlockedDescription) {
          setError(
            'description',
            {
              type: 'server',
              message: getAlertFormValidationErrorMsg(
                AnalyticsAlertErrorCode.TextFilterBlockedDescription,
                translate,
              ),
            },
            { shouldFocus: true },
          );
          return;
        }
        // `ALERT_NAME_EXISTED` is the one outcome the user can fix inline,
        // so it dispatches as a field-level error on the name input.
        if (code === AnalyticsAlertErrorCode.AlertNameExisted) {
          setError(
            'name',
            {
              type: 'server',
              message: getAlertFormValidationErrorMsg(
                AnalyticsAlertErrorCode.AlertNameExisted,
                translate,
              ),
            },
            { shouldFocus: true },
          );
          return;
        }
        // Canonical analytics-alerts codes get their dedicated message via
        // `getAlertFormValidationErrorMsg`. They are an expected part of the
        // API contract and the SDK already pipes them through its `apivitals`
        // pipeline, so we don't forward them to Sentry from here.
        if (isAnalyticsAlertErrorCode(code)) {
          setError('root.serverError', {
            type: 'server',
            message: getAlertFormValidationErrorMsg(code, translate),
          });
          return;
        }
        // Anything else — gateway-level errors (502 / 504), 5xx without
        // our `errorCode` body shape, network failures, aborted
        // requests, programming errors, etc. — collapses to a generic
        // `Error.Unknown` banner so the user is never left wondering
        // whether the submit went through. These are unexpected, so we
        // forward the raw error to Sentry via `logAnalyticsError` for
        // monitoring.
        logAnalyticsError('[ExperienceAlertForm] Unrecognized submit error', { code, error });
        setError('root.serverError', {
          type: 'server',
          message: translate(
            translationKey('Error.Unknown', TranslationNamespace.ExperienceAlerts),
          ),
        });
      }
    },
    [clearErrors, onSubmit, setError, translate],
  );

  // Only reset when the user has not yet touched the form, so that background
  // refetches (e.g. the Syncing-state poll in useAnalyticsAlertsListQuery) do
  // not overwrite in-progress edits.
  useEffect(() => {
    if (!isDirty) {
      reset(mergeAlertFormDefaults(defaultValues));
    }
  }, [defaultValues, isDirty, reset]);

  const metric = useWatch({ control, name: 'metric' });
  const interval = useWatch({ control, name: 'interval' });
  const evaluationMode = useWatch({ control, name: 'evaluationMode' });

  useExperienceAlertFormCrossFieldEffects({
    metric,
    interval,
    evaluationMode,
    isSubmitted,
    getFieldState,
    getValues,
    setValue,
    trigger,
  });

  return (
    <TextFilterProvider filterText={filterTextThroughGameUpdateNotifications}>
      <FormProvider {...formMethods}>
        <form
          className='width-full flex flex-col'
          onSubmit={(e) => {
            void handleSubmit(handleSubmitWithErrorHandling)(e);
          }}
          noValidate>
          <div className='width-full padding-large gap-xlarge flex flex-col medium:width-[75%] xlarge:width-[50%]'>
            <h1 className='margin-none content-emphasis text-heading-medium'>
              {translate(pageTitleKey)}
            </h1>

            <ExperienceAlertNameDescriptionFields />

            <div className='gap-medium flex flex-row items-start'>
              <div className='grow'>
                <ExperienceAlertMetricField />
              </div>
              <ViewMetricInExploreModeButton universeId={resource.id} />
            </div>

            <ExperienceAlertGranularityField metric={metric} />

            <ExperienceAlertConditionFields metric={metric} />

            <ExperienceAlertFilterRows metric={metric} resource={resource} />

            <ExperienceAlertBreakdownFields metric={metric} resource={resource} />

            <ExperienceAlertOccurrencesField />

            <ExperienceAlertSeverityFields />

            <div className='text-label-large margin-top-small'>
              {translate(
                translationKey('Label.WhoToNotify', TranslationNamespace.ExperienceAlerts),
              )}
            </div>
            <ExperienceAlertWebhookField universeId={resource.id} />
          </div>

          <div className='width-full margin-top-large shrink-0'>
            <Divider variant='Standard' />
            <div className='wrap items-center padding-x-large padding-top-large gap-small flex flex-row'>
              <Button
                variant='Emphasis'
                size='Medium'
                type='submit'
                isDisabled={!allowPristineSubmit && !isDirty}>
                {translate(resolvedSubmitButtonKey)}
              </Button>
              <Button type='button' variant='Standard' size='Medium' onClick={onCancel}>
                {translate(translationKey('Action.Cancel', TranslationNamespace.ExperienceAlerts))}
              </Button>
            </div>
            {errors.root?.serverError?.message != null && (
              <p
                role='alert'
                className='text-body-medium content-system-alert margin-top-none padding-x-large padding-top-small'>
                {errors.root.serverError.message}
              </p>
            )}
          </div>
        </form>
      </FormProvider>
    </TextFilterProvider>
  );
};

export default withTranslation(ExperienceAlertForm, wellKnownAnalyticsTranslationNamespaces);
