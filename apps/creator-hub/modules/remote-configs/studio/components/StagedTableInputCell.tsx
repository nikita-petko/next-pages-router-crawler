import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedText } from '@modules/analytics-translations';
import { Checkbox, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { ValidConfigEntryValue } from '../../api/validTypes';
import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import { foundationClasses } from './useStudioConfigStyles';
import useConfigNumberValidator from '../../hooks/useConfigNumberValidator';
import useConfigStringValidator from '../../hooks/useConfigStringValidator';
import { ValidationError } from '../../hooks/validatorTypes';
import {
  configEntryToStringValueForStagedTableEditableCell,
  StringOrNumberConfigEntryValue,
} from './tableUtils';
import { JsonConfigEntry, JsonConfigEntryValue } from '../types/JsonConfigEntryValue';
import strictly from '../foundation-utils/strictly';
import TextInputForWebview from './TextInputForWebview';

type StringOrNumberOrJsonInputProps = {
  currentValue: string;
  validationError: FormattedText | null;
  handleFocus?: () => void;
  handleStringBlur?: () => void;
  handleStringChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  isReadOnly?: boolean;
};
// Needs forwardRef to support TooltipTrigger's asChild prop
const StringOrNumberOrJsonInput = React.forwardRef<
  HTMLInputElement,
  StringOrNumberOrJsonInputProps
>(
  (
    {
      currentValue,
      validationError,
      handleFocus,
      handleStringBlur,
      handleStringChange,
      handleKeyDown,
      isReadOnly,
    }: StringOrNumberOrJsonInputProps,
    ref,
  ) => {
    const { textInput, textInputInputContainer } = foundationClasses;
    return (
      <TextInputForWebview
        size='XSmall'
        className={textInput}
        inputContainerClassName={textInputInputContainer}
        value={currentValue}
        hasError={!!validationError}
        onBlur={handleStringBlur}
        onChange={handleStringChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        data-error={validationError}
        readOnly={isReadOnly}
        ref={ref}
      />
    );
  },
);
StringOrNumberOrJsonInput.displayName = 'StringOrNumberOrJsonInput';

const StringOrNumberCellInput = ({
  entryValue,
  isEditing,
  validateValue,
  commitValue,
}: {
  entryValue: StringOrNumberConfigEntryValue;
  isEditing: boolean;
  validateValue: (value: string) => FormattedText | null;
  commitValue: (currentValue: string) => void;
}) => {
  const [validationError, setValidationError] = useState<FormattedText | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isResettingRef = useRef<boolean>(false);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  // Local state to manage input values before committing changes
  const initialValue = configEntryToStringValueForStagedTableEditableCell(entryValue);
  const [currentValue, setCurrentValue] = useState<string>(initialValue);

  // Update local state when the prop value changes
  React.useEffect(() => {
    const newValue = configEntryToStringValueForStagedTableEditableCell(entryValue);
    setCurrentValue(newValue);
  }, [entryValue]);

  const validate = useCallback(
    (newValue: string) => {
      const error = validateValue(newValue);
      setValidationError(error);
    },
    [validateValue],
  );

  const handleStringChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setCurrentValue(newValue);
    validate(newValue);
  };

  const handleStringBlur = useCallback(() => {
    if (isResettingRef.current) {
      isResettingRef.current = false;
      return;
    }
    if (validationError) return;
    if (currentValue === initialValue) return;
    commitValue(currentValue);
  }, [validationError, currentValue, initialValue, commitValue]);

  const reset = useCallback(() => {
    setCurrentValue(initialValue);
    validate(initialValue);
  }, [initialValue, validate]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!validationError) {
        // handleStringBlur();
        event.currentTarget.blur();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      isResettingRef.current = true;
      reset();
      event.currentTarget.blur();
      isResettingRef.current = false;
    }
  };

  return (
    <Tooltip open={!!validationError} title={validationError ?? ''} position='bottom-start' hasBeak>
      <TooltipTrigger asChild>
        <StringOrNumberOrJsonInput
          currentValue={currentValue}
          validationError={validationError}
          handleStringBlur={handleStringBlur}
          handleStringChange={handleStringChange}
          handleKeyDown={handleKeyDown}
          ref={inputRef}
        />
      </TooltipTrigger>
    </Tooltip>
  );
};

const NumberCell = ({
  entryValue,
  onChange,
  isEditing,
}: {
  entryValue: ValidConfigEntryValue & { valueType: ValidConfigEntryValueType.Number };
  onChange: (value: ValidConfigEntryValue) => void;
  isEditing: boolean;
}) => {
  const validateConfigNumberValue = useConfigNumberValidator();

  const validateValue = useCallback(
    (newValue: string) => {
      const validationResult = validateConfigNumberValue({ value: newValue });
      if (!validationResult.isValid && validationResult.error === ValidationError.InvalidNumber) {
        return validationResult.message ?? null;
      }
      return null;
    },
    [validateConfigNumberValue],
  );

  const commitValue = useCallback(
    (localStringValue: string) => {
      onChange({
        valueType: ValidConfigEntryValueType.Number,
        numberValue: parseFloat(localStringValue),
      });
    },
    [onChange],
  );

  return (
    <StringOrNumberCellInput
      entryValue={entryValue}
      isEditing={isEditing}
      validateValue={validateValue}
      commitValue={commitValue}
    />
  );
};

const StringCell = ({
  entryValue,
  onChange,
  isEditing,
}: {
  entryValue: ValidConfigEntryValue & { valueType: ValidConfigEntryValueType.String };
  onChange: (value: ValidConfigEntryValue) => void;
  isEditing: boolean;
}) => {
  const validateConfigStringValue = useConfigStringValidator();

  const validateValue = useCallback(
    (newValue: string) => {
      const validationResult = validateConfigStringValue({ value: newValue });
      if (!validationResult.isValid && validationResult.error === ValidationError.ReachedMaxChars) {
        return validationResult.message ?? null;
      }
      return null;
    },
    [validateConfigStringValue],
  );

  const commitValue = useCallback(
    (localStringValue: string) => {
      onChange({
        valueType: ValidConfigEntryValueType.String,
        stringValue: localStringValue || '',
      });
    },
    [onChange],
  );

  return (
    <StringOrNumberCellInput
      entryValue={entryValue}
      isEditing={isEditing}
      validateValue={validateValue}
      commitValue={commitValue}
    />
  );
};

const JsonCell = ({
  entryKey,
  entryValue,
  startJsonEdit,
  isEditing,
}: {
  entryKey: string;
  entryValue: JsonConfigEntryValue;
  startJsonEdit: (jsonValue: JsonConfigEntry) => void;
  isEditing: boolean;
}) => {
  const entry: JsonConfigEntry = useMemo(
    () => ({
      key: entryKey,
      entryValue,
    }),
    [entryKey, entryValue],
  );

  useEffect(() => {
    if (isEditing) {
      startJsonEdit(entry);
    }
  }, [isEditing, startJsonEdit, entry]);

  const handleJsonClick = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Tab' && event.key !== 'Escape') {
        event.preventDefault();
        startJsonEdit(entry);
      }
    },
    [startJsonEdit, entry],
  );

  return (
    <StringOrNumberOrJsonInput
      currentValue={entryValue.jsonValue}
      validationError={null}
      handleKeyDown={handleJsonClick}
      isReadOnly
    />
  );
};

const BooleanCell = ({
  entryValue,
  onChange,
  isEditing,
}: {
  entryValue: ValidConfigEntryValue & { valueType: ValidConfigEntryValueType.Boolean };
  onChange: (value: ValidConfigEntryValue) => void;
  isEditing: boolean;
}) => {
  const inputRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleBooleanChange = (given: boolean | 'indeterminate') => {
    const newValue: ValidConfigEntryValue = {
      valueType: ValidConfigEntryValueType.Boolean,
      boolValue: !!given,
    };
    onChange(newValue);
  };

  return (
    <Checkbox
      size='XSmall'
      label=''
      placement='Start'
      isChecked={entryValue.boolValue}
      onCheckedChange={handleBooleanChange}
      className={strictly('padding-y-xsmall')}
      ref={inputRef}
    />
  );
};

const StagedTableValueCell = ({
  entryKey,
  entryValue,
  onChange,
  startJsonEdit,
  isEditing,
}: {
  entryKey: string;
  entryValue: ValidConfigEntryValue;
  onChange: (value: ValidConfigEntryValue) => void;
  startJsonEdit: (entry: JsonConfigEntry) => void;
  isEditing: boolean;
}) => {
  const { valueType } = entryValue;
  switch (valueType) {
    case ValidConfigEntryValueType.Boolean:
      return <BooleanCell entryValue={entryValue} onChange={onChange} isEditing={isEditing} />;
    case ValidConfigEntryValueType.Number:
      return <NumberCell entryValue={entryValue} onChange={onChange} isEditing={isEditing} />;
    case ValidConfigEntryValueType.String:
      return <StringCell entryValue={entryValue} onChange={onChange} isEditing={isEditing} />;
    case ValidConfigEntryValueType.Json:
      return (
        <JsonCell
          entryKey={entryKey}
          entryValue={entryValue}
          startJsonEdit={startJsonEdit}
          isEditing={isEditing}
        />
      );
    default: {
      const exhaustiveCheck: never = entryValue;
      throw new Error(`Unhandled value type: ${exhaustiveCheck}`);
    }
  }
};
export default StagedTableValueCell;
