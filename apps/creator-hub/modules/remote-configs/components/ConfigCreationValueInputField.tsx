import React from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Dropdown, Menu, MenuItem, TextInput } from '@rbx/foundation-ui';
import {
  CodeEditor,
  CodeEditorSupportedLanguages,
  InputFieldWrapper,
} from '@modules/charts-generic';
import { ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';
import prettyPrintJson from '../utils/prettyPrintJson';

type ConfigCreationValueInputFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  overrideType: ValidConfigEntryValueType;
  stringValueName: Path<TFieldValues>;
  boolValueName: Path<TFieldValues>;
  id: string;
  label: string;
  isDisabled: boolean;
  hasError: boolean;
  error?: string;
  stringPlaceholder: string;
  numberPlaceholder: string;
  booleanPlaceholder: string;
  jsonPlaceholder: string;
};

const ConfigCreationValueInputField = <TFieldValues extends FieldValues>({
  control,
  overrideType,
  stringValueName,
  boolValueName,
  id,
  label,
  isDisabled,
  hasError,
  error,
  stringPlaceholder,
  numberPlaceholder,
  booleanPlaceholder,
  jsonPlaceholder,
}: ConfigCreationValueInputFieldProps<TFieldValues>) => {
  if (overrideType === ValidConfigEntryValueType.Boolean) {
    return (
      <div>
        <div style={{ marginBottom: 8, fontSize: 14 }}>{label}</div>
        <Controller
          name={boolValueName}
          control={control}
          render={({ field }) => (
            <Dropdown
              size='Large'
              value={field.value}
              placeholder={booleanPlaceholder}
              isDisabled={isDisabled}
              onValueChange={(value) => field.onChange(value as 'true' | 'false')}>
              <Menu>
                <MenuItem value='true' title='True' />
                <MenuItem value='false' title='False' />
              </Menu>
            </Dropdown>
          )}
        />
      </div>
    );
  }

  if (overrideType === ValidConfigEntryValueType.Json) {
    return (
      <Controller
        name={stringValueName}
        control={control}
        render={({ field }) => (
          <InputFieldWrapper id={id} label={label} error={hasError} helperText={error}>
            <CodeEditor
              value={field.value}
              onChange={(value) => {
                field.onChange(value ?? '');
              }}
              onBlur={(value) => {
                const formattedJson = prettyPrintJson(value);
                field.onChange(formattedJson ?? value ?? '');
                field.onBlur();
              }}
              formatOnBlur
              language={CodeEditorSupportedLanguages.Json}
              height='30vh'
              placeholder={jsonPlaceholder}
            />
          </InputFieldWrapper>
        )}
      />
    );
  }

  return (
    <Controller
      name={stringValueName}
      control={control}
      render={({ field }) => (
        <TextInput
          {...field}
          id={id}
          label={label}
          hasError={hasError}
          error={error}
          isDisabled={isDisabled}
          placeholder={
            overrideType === ValidConfigEntryValueType.Number
              ? numberPlaceholder
              : stringPlaceholder
          }
        />
      )}
    />
  );
};

export default ConfigCreationValueInputField;
