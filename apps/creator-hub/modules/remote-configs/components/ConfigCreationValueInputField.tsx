import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Dropdown, Menu, MenuItem, TextInput } from '@rbx/foundation-ui';
import CodeEditor from '@modules/charts-generic/components/CodeEditors/CodeEditor';
import CodeEditorSupportedLanguages from '@modules/charts-generic/components/CodeEditors/CodeEditorSupportedLanguages';
import { ValidConfigEntryValueType } from '../api/universeConfigsClientEnums';
import prettyPrintJson from '../utils/prettyPrintJson';

const normalizeBooleanDropdownValue = (value: unknown): 'true' | 'false' | undefined => {
  if (value === 'true' || value === true) {
    return 'true';
  }
  if (value === 'false' || value === false) {
    return 'false';
  }
  return undefined;
};

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
      <Controller
        name={boolValueName}
        control={control}
        render={({ field }) => (
          <Dropdown
            size='Large'
            label={label}
            value={normalizeBooleanDropdownValue(field.value)}
            placeholder={booleanPlaceholder}
            isDisabled={isDisabled}
            onValueChange={(value) => {
              const normalizedValue = normalizeBooleanDropdownValue(value);
              if (normalizedValue) {
                field.onChange(normalizedValue);
              }
            }}>
            <Menu>
              <MenuItem value='true' title='True' />
              <MenuItem value='false' title='False' />
            </Menu>
          </Dropdown>
        )}
      />
    );
  }

  if (overrideType === ValidConfigEntryValueType.Json) {
    return (
      <Controller
        name={stringValueName}
        control={control}
        render={({ field }) => (
          // CodeEditor has no native label, so we render a foundation-styled
          // label that matches TextInput/Dropdown size='Large' labels above.
          <div id={id} className='flex flex-col gap-small'>
            <span className='text-title-large content-emphasis'>{label}</span>
            <div
              className={`border radius-medium overflow-hidden ${
                hasError ? 'stroke-system-alert' : 'stroke-contrast-alpha'
              }`}>
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
            </div>
            {hasError && error ? (
              <span className='text-caption-small content-system-alert'>{error}</span>
            ) : null}
          </div>
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
