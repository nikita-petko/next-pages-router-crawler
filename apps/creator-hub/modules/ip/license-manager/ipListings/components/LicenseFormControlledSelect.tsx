import React, { useCallback, useMemo } from 'react';
import type { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';
import { Select, Typography } from '@rbx/ui';
import useLicenseFormStyles from './LicenseForm.styles';

function hasSelectDisplayValue(value: unknown): boolean {
  if (value == null || value === '') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}

export interface DropdownOptionContentProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** When true, only renders the title (used in Select renderValue when closed) */
  simple?: boolean;
}

export const DropdownOptionContent: React.FC<DropdownOptionContentProps> = ({
  title,
  description,
  simple,
}) => {
  const { classes } = useLicenseFormStyles();

  return (
    <div className={classes.dropdownOption}>
      <Typography variant='body1'>{title}</Typography>
      {!simple && description && (
        <div>
          <Typography variant='body2'>{description}</Typography>
        </div>
      )}
    </div>
  );
};

export interface LicenseFormControlledSelectProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  id: string;
  error: boolean;
  helperText: string | undefined;
  label: string;
  renderValue: (value: unknown) => React.ReactNode;
  onChange?: (event: React.ChangeEvent<{ value: unknown }>) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function LicenseFormControlledSelect<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
>({
  field,
  id,
  error,
  helperText,
  label,
  renderValue,
  onChange,
  disabled,
  children,
}: LicenseFormControlledSelectProps<TFieldValues, TName>) {
  const { value: fieldValue, onChange: _fieldOnChange, ...fieldProps } = field;
  const labelShrunk = hasSelectDisplayValue(fieldValue);
  const inputLabelProps = useMemo(() => ({ shrink: labelShrunk }), [labelShrunk]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      if (onChange) {
        onChange(event);
      } else {
        field.onChange(event);
      }
    },
    [field, onChange],
  );

  return (
    <Select
      {...fieldProps}
      disabled={disabled}
      id={id}
      error={error}
      helperText={helperText}
      label={label}
      renderValue={renderValue}
      value={labelShrunk ? fieldValue : ''}
      InputLabelProps={inputLabelProps}
      onChange={handleChange}>
      {children}
    </Select>
  );
}
