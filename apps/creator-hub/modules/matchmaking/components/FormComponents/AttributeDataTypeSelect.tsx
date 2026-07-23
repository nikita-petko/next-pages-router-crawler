import React from 'react';
import {
  Control,
  Controller,
  FieldValues,
  FormState,
  Path,
  UseControllerProps,
} from 'react-hook-form';
import { MenuItem, Select } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import AttributeDataType from '../../enums/AttributeDataType';
import { dataTypeTranslationKeys } from '../../utils/translationGetter';

interface AttributeDataTypeSelectProps<T extends FieldValues> extends UseControllerProps<T> {
  isDisabled: boolean;
  errorMessage: string;
  formState: FormState<T>;
  control: Control<T>;
  name: Path<T>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AttributeDataTypeSelect = function AttributeDataTypeSelectProps<T extends FieldValues>({
  isDisabled,
  errorMessage,
  formState,
  control,
  name,
  handleChange,
}: AttributeDataTypeSelectProps<T>): React.JSX.Element {
  const { errors } = formState;
  const { translate } = useTranslation();

  const fieldRules = {
    required: 'Error.Required',
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={fieldRules}
      render={({ field }) => (
        <Select
          {...field}
          label={translate('Label.DataType')}
          fullWidth
          required
          disabled={isDisabled}
          error={!!errors.dataType}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            field.onChange(e);
            handleChange(e);
          }}
          helperText={errors.dataType ? translate(errorMessage) : null}>
          {Object.values(AttributeDataType).map((attributeDataType) => (
            <MenuItem key={attributeDataType} value={attributeDataType}>
              {translate(dataTypeTranslationKeys[attributeDataType])}
            </MenuItem>
          ))}
        </Select>
      )}
    />
  );
};

export default AttributeDataTypeSelect;
