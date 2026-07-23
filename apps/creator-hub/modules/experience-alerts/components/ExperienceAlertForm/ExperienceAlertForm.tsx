import { FC, useMemo } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Button, Divider } from '@rbx/foundation-ui';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations';
import { RAQIV2ChartResource } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import ExperienceAlertBreakdownFields from './ExperienceAlertBreakdownFields';
import ExperienceAlertConditionFields from './ExperienceAlertConditionFields';
import ExperienceAlertDurationField from './ExperienceAlertDurationField';
import ExperienceAlertFilterRows from './ExperienceAlertFilterRows';
import ExperienceAlertGranularityField from './ExperienceAlertGranularityField';
import ExperienceAlertNameDescriptionFields from './ExperienceAlertNameDescriptionFields';
import ExperienceAlertSeverityFields from './ExperienceAlertSeverityFields';
import { defaultExperienceAlertFormValues } from '../../constants/alertFormConstants';
import type { ExperienceAlertFormValues } from '../../constants/types';
import { useExperienceAlertFormCrossFieldEffects } from '../../hooks/useExperienceAlertFormFieldEffects';

function mergeAlertFormDefaults(
  over?: Partial<ExperienceAlertFormValues>,
): ExperienceAlertFormValues {
  const base = defaultExperienceAlertFormValues();
  if (!over) return base;
  return {
    ...base,
    ...over,
    filters: over.filters ?? base.filters,
  };
}

export type ExperienceAlertFormProps = {
  pageTitle: string;
  defaultValues?: Partial<ExperienceAlertFormValues>;
  onSubmit: (values: ExperienceAlertFormValues) => void;
  onCancel: () => void;
  resource: RAQIV2ChartResource;
};

const ExperienceAlertForm: FC<ExperienceAlertFormProps> = ({
  pageTitle,
  defaultValues,
  onSubmit,
  onCancel,
  resource,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const formDefaults = useMemo(() => mergeAlertFormDefaults(defaultValues), [defaultValues]);

  const formMethods = useForm<ExperienceAlertFormValues>({
    defaultValues: formDefaults,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    formState: { isDirty },
  } = formMethods;

  const metric = useWatch({ control, name: 'metric' });
  const timeGranularity = useWatch({ control, name: 'timeGranularity' });

  useExperienceAlertFormCrossFieldEffects({
    metric,
    timeGranularity,
    getValues,
    setValue,
    trigger,
  });

  return (
    <FormProvider {...formMethods}>
      <form className='flex flex-col width-full' onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className='flex flex-col gap-xlarge padding-large width-full medium:width-[75%] xlarge:width-[50%]'>
          <h1 className='text-heading-medium content-emphasis margin-0'>{pageTitle}</h1>

          <ExperienceAlertNameDescriptionFields />

          <ExperienceAlertConditionFields metric={metric} />

          <ExperienceAlertFilterRows metric={metric} resource={resource} />

          <ExperienceAlertBreakdownFields metric={metric} resource={resource} />

          <ExperienceAlertGranularityField metric={metric} />

          <ExperienceAlertDurationField />

          <ExperienceAlertSeverityFields />
        </div>

        <div className='width-full margin-top-large shrink-0'>
          <Divider variant='Standard' />
          <div className='flex flex-row flex-wrap gap-small items-center padding-x-large padding-y-large'>
            <Button variant='Emphasis' size='Medium' type='submit' isDisabled={!isDirty}>
              {translate(translationKey('Action.Create', TranslationNamespace.Analytics))}
            </Button>
            <Button type='button' variant='Standard' size='Medium' onClick={onCancel}>
              {translate(translationKey('Action.Cancel', TranslationNamespace.ExperienceAlerts))}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default withTranslation(ExperienceAlertForm, [
  TranslationNamespace.ExperienceAlerts,
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
]);
