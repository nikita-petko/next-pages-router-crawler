import React, { FC } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { TextInput } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { getExperienceAlertFieldRegisterOptions } from '../../constants/experienceAlertFormFieldRules';
import type { ExperienceAlertFormValues } from '../../constants/types';

const ExperienceAlertNameDescriptionFields: FC = () => {
  const { control, formState } = useFormContext<ExperienceAlertFormValues>();
  const { errors } = formState;
  const { translate } = useRAQIV2TranslationDependencies();

  return (
    <React.Fragment>
      <Controller
        name='name'
        control={control}
        rules={getExperienceAlertFieldRegisterOptions('name', translate)}
        render={({ field }) => (
          <TextInput
            {...field}
            isRequired
            label={translate(
              translationKey('Label.AlertName', TranslationNamespace.ExperienceAlerts),
            )}
            placeholder={translate(
              translationKey('Placeholder.AlertName', TranslationNamespace.ExperienceAlerts),
            )}
            size='Medium'
            hasError={!!errors.name}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        name='description'
        control={control}
        rules={getExperienceAlertFieldRegisterOptions('description', translate)}
        render={({ field }) => (
          <TextInput
            {...field}
            label={translate(
              translationKey('Label.AlertDescription', TranslationNamespace.ExperienceAlerts),
            )}
            placeholder={translate(
              translationKey('Placeholder.AlertDescription', TranslationNamespace.ExperienceAlerts),
            )}
            size='Medium'
            hasError={!!errors.description}
            error={errors.description?.message}
          />
        )}
      />
    </React.Fragment>
  );
};

export default ExperienceAlertNameDescriptionFields;
