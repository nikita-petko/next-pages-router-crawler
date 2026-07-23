import React from 'react';
import {
  Control,
  Controller,
  ControllerRenderProps,
  FieldValues,
  FormState,
  Path,
  UseControllerProps,
} from 'react-hook-form';
import { FormControlLabel, Grid, Radio, RadioGroup, TextField, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import AttributeDataType from '../../enums/AttributeDataType';
import BooleanValueType from '../../enums/BooleanValueType';
import { booleanTypeTranslationKeys } from '../../utils/translationGetter';
import { ValidateDataType } from '../../utils/FormUtils';

interface ConstantValueSelectionProps<T extends FieldValues> extends UseControllerProps<T> {
  errorMessage: string;
  isRequired: boolean;
  dataType: AttributeDataType | null;
  booleanDataValue: BooleanValueType | null;
  handleRadioChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  formState: FormState<T>;
  control: Control<T>;
  name: Path<T>;
}

const ConstantValueSelection = function ConstantValueSelectionProps<T extends FieldValues>({
  errorMessage,
  isRequired,
  dataType,
  booleanDataValue,
  handleRadioChange,
  formState,
  control,
  name,
}: ConstantValueSelectionProps<T>): React.JSX.Element {
  const { errors } = formState;
  const { translate } = useTranslation();

  // the component has it's own validation implemented and used in the parent form
  const fieldRules = {
    // String data type allowed to be empty string, so no required error is shown for it
    required: isRequired && dataType !== AttributeDataType.String ? 'Error.Required' : false,
    maxLength: 50,
    validate: {
      validDataType: (value: string | number | boolean) => ValidateDataType(value, dataType),
    },
  };

  const getConstantValue = (field: ControllerRenderProps<T, Path<T>>) =>
    dataType === AttributeDataType.Boolean ? (
      <Grid>
        <Typography variant='body2'>{translate('Label.DefaultValue')}*</Typography>
        <RadioGroup
          {...field}
          value={BooleanValueType.True}
          id='constantValue'
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            field.onChange(e);
            handleRadioChange(e);
          }}>
          <Grid item>
            <FormControlLabel
              key={BooleanValueType.True}
              value={BooleanValueType.True}
              control={
                <Radio
                  aria-label={translate('Label.True')}
                  checked={booleanDataValue === BooleanValueType.True}
                />
              }
              label={
                <Typography variant='body1'>
                  {translate(booleanTypeTranslationKeys[BooleanValueType.True])}
                </Typography>
              }
            />
          </Grid>
          <Grid item>
            <FormControlLabel
              key={BooleanValueType.False}
              value={BooleanValueType.False}
              control={
                <Radio
                  aria-label={translate('Label.False')}
                  checked={booleanDataValue === BooleanValueType.False}
                />
              }
              label={
                <Typography variant='body1'>
                  {translate(booleanTypeTranslationKeys[BooleanValueType.False])}
                </Typography>
              }
            />
          </Grid>
        </RadioGroup>
      </Grid>
    ) : (
      <TextField
        {...field}
        error={!!errors.constantValue}
        fullWidth
        required
        id='constantValue'
        inputProps={{
          maxLength: 100,
        }}
        label={translate('Label.DefaultValue')}
        helperText={translate(errorMessage)}
      />
    );
  return (
    <Controller
      name={name}
      control={control}
      rules={fieldRules}
      render={({ field }) => getConstantValue(field)}
    />
  );
};

export default ConstantValueSelection;
