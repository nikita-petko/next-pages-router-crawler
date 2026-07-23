import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, ControllerProps, useFormContext } from 'react-hook-form';
import { Grid, TextField } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';
import useBasicInfoFormStyles from './BasicInfoForm.styles';

const NAME_KEY = 'name';
const DESCRIPTION_KEY = 'description';
const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 1000;
const DEBOUNCED_VALIDATION_DELAY_MS = 100;

export type BasicInfoFormProps = {
  descriptionRules?: ControllerProps['rules'];
  nameRules?: ControllerProps['rules'];
};

export const BasicInfoFormDefaultRules = {
  description: { maxLength: DESCRIPTION_MAX_LENGTH },
  name: { required: 'Error.Required', maxLength: NAME_MAX_LENGTH },
};

const BasicInfoForm: FunctionComponent<React.PropsWithChildren<BasicInfoFormProps>> = ({
  descriptionRules,
  nameRules,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { formContainer },
  } = useBasicInfoFormStyles();
  const {
    clearErrors,
    control,
    formState: { errors },
    getValues,
    setError,
    setValue,
    trigger,
  } = useFormContext();
  const [isNameValid, setIsNameValid] = useState(getValues(NAME_KEY) !== '');
  const [isDescriptionValid, setIsDescriptionValid] = useState(true);

  const formNameRules = useMemo(
    () => ({ ...BasicInfoFormDefaultRules.name, ...nameRules }),
    [nameRules],
  );
  const formDescriptionRules = useMemo(
    () => ({ ...BasicInfoFormDefaultRules.description, ...descriptionRules }),
    [descriptionRules],
  );

  // DEBOUNCED NAME VALIDATION
  const [validateNameDebounced] = useDebouncedFunction(
    useCallback(
      (name: string) => {
        const isValid = name.length > 0 && name.length <= NAME_MAX_LENGTH;
        setIsNameValid(isValid);
        if (isValid) {
          clearErrors(NAME_KEY);
        } else {
          setError(NAME_KEY, { type: 'maxLength' });
        }
      },
      [clearErrors, setError],
    ),
    DEBOUNCED_VALIDATION_DELAY_MS,
  );

  const onNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const latestName = e.target.value;
      setValue(NAME_KEY, latestName, { shouldDirty: true });
      validateNameDebounced(latestName);
    },
    [setValue, validateNameDebounced],
  );

  useEffect(() => {
    // Trigger validation whenever debounced isNameValid changes
    trigger(NAME_KEY);
  }, [isNameValid, trigger]);

  // DEBOUNCED DESCRIPTION VALIDATION
  const [validateDescriptionDebounced] = useDebouncedFunction(
    useCallback(
      (description: string) => {
        const isValid = description.length <= DESCRIPTION_MAX_LENGTH;
        setIsDescriptionValid(isValid);
        if (isValid) {
          clearErrors(DESCRIPTION_KEY);
        } else {
          setError(DESCRIPTION_KEY, { type: 'maxLength' });
        }
      },
      [clearErrors, setError],
    ),
    DEBOUNCED_VALIDATION_DELAY_MS,
  );

  const onDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const latestDescription = e.target.value;
      setValue(DESCRIPTION_KEY, latestDescription, { shouldDirty: true });
      validateDescriptionDebounced(latestDescription);
    },
    [setValue, validateDescriptionDebounced],
  );

  useEffect(() => {
    // Trigger validation whenever debounced isDescriptionValid changes
    trigger(DESCRIPTION_KEY);
  }, [isDescriptionValid, trigger]);

  return (
    <Grid container item XSmall={12} classes={{ root: formContainer }}>
      <Controller
        control={control}
        name='name'
        rules={formNameRules}
        render={({ field }) => (
          <TextField
            {...field}
            inputProps={{ maxLength: formNameRules.maxLength }}
            error={!isNameValid}
            fullWidth
            helperText={
              !isNameValid && errors.name && errors.name.message
                ? translate(errors.name.message as string)
                : translate('Message.CharacterLimit', {
                    limit: formNameRules.maxLength.toString(),
                  })
            }
            id='name'
            label={translate('Label.Name')}
            multiline
            required={!!formNameRules.required}
            onChange={onNameChange}
          />
        )}
      />
      <Controller
        name='description'
        control={control}
        rules={formDescriptionRules}
        render={({ field }) => (
          <TextField
            {...field}
            id='description'
            fullWidth
            multiline
            inputProps={{ maxLength: formDescriptionRules.maxLength }}
            error={!isDescriptionValid}
            required={!!formDescriptionRules.required}
            label={translate('Label.Description')}
            helperText={
              !isDescriptionValid && errors.description && errors.description.message
                ? translate(errors.description.message as string)
                : translate('Message.CharacterLimit', {
                    limit: formDescriptionRules.maxLength.toString(),
                  })
            }
            onChange={onDescriptionChange}
          />
        )}
      />
    </Grid>
  );
};

export default BasicInfoForm;
