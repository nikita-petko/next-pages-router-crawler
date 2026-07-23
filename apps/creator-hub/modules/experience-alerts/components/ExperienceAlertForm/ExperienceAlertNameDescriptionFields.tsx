import { type FC, useEffect, useRef } from 'react';
import React from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { TextInput } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import useTextFilterValidation from '@modules/experience-analytics-shared/text-filter/useTextFilterValidation';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getExperienceAlertFieldRegisterOptions } from '../../constants/experienceAlertFormFieldRules';
import type { ExperienceAlertFormValues } from '../../constants/types';
import {
  AlertFormValidationError,
  getAlertFormValidationErrorMsg,
} from '../../constants/validationErrorMessages';

const ExperienceAlertNameDescriptionFields: FC = () => {
  const { control, formState, trigger } = useFormContext<ExperienceAlertFormValues>();
  const { errors, touchedFields } = formState;
  const { translate } = useRAQIV2TranslationDependencies();

  const typedName = useWatch({ control, name: 'name' });
  const typedDescription = useWatch({ control, name: 'description' });

  const { isBlocked: isNameBlocked, status: nameStatus } = useTextFilterValidation(typedName);
  const { isBlocked: isDescriptionBlocked, status: descriptionStatus } =
    useTextFilterValidation(typedDescription);

  // Refs so synchronous RHF validate functions always read the latest blocked
  // state without needing to close over stale values.
  const isNameBlockedRef = useRef(isNameBlocked);
  isNameBlockedRef.current = isNameBlocked;

  const isDescriptionBlockedRef = useRef(isDescriptionBlocked);
  isDescriptionBlockedRef.current = isDescriptionBlocked;

  // Re-run RHF validation for name whenever moderation status resolves, but
  // only after the user has touched the field so we don't show errors eagerly.
  useEffect(() => {
    if (touchedFields.name) {
      void trigger('name');
    }
  }, [nameStatus, trigger, touchedFields.name]);

  useEffect(() => {
    if (touchedFields.description) {
      void trigger('description');
    }
  }, [descriptionStatus, trigger, touchedFields.description]);

  const textFilterBlockedMsg = getAlertFormValidationErrorMsg(
    AlertFormValidationError.TextFilterBlocked,
    translate,
  );

  const nameBaseRules = getExperienceAlertFieldRegisterOptions('name', translate);
  const descriptionBaseRules = getExperienceAlertFieldRegisterOptions('description', translate);

  return (
    <>
      <Controller
        name='name'
        control={control}
        rules={{
          ...nameBaseRules,
          validate: {
            ...(typeof nameBaseRules.validate === 'object' ? nameBaseRules.validate : {}),
            textFilter: () => !isNameBlockedRef.current || textFilterBlockedMsg,
          },
        }}
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
        rules={{
          ...descriptionBaseRules,
          validate: {
            ...(typeof descriptionBaseRules.validate === 'object'
              ? descriptionBaseRules.validate
              : {}),
            textFilter: () => !isDescriptionBlockedRef.current || textFilterBlockedMsg,
          },
        }}
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
    </>
  );
};

export default ExperienceAlertNameDescriptionFields;
