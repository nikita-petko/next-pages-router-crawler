import type { FieldPath, FieldPathValue, FieldValues, UseControllerProps } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { TCheckboxProps } from '@rbx/ui';
import { Checkbox, FormControlLabel, InfoOutlinedIcon, Tooltip, Typography } from '@rbx/ui';

type ControllerCheckboxWithTooltipProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> =
  FieldPathValue<TFieldValues, TName> extends boolean | null
    ? UseControllerProps<TFieldValues, TName, TTransformedValues> & {
        label: React.ReactNode;
        tooltip: React.ReactNode;
        onChange?: TCheckboxProps['onChange'];
        className?: string;
      }
    : never; // Disallow non-boolean fields

export function ControllerCheckboxWithTooltip<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  label,
  tooltip,
  name,
  control,
  onChange,
  className,
  ...controllerProps
}: ControllerCheckboxWithTooltipProps<TFieldValues, TName, TTransformedValues>) {
  return (
    <Controller
      name={name}
      control={control}
      {...controllerProps}
      render={({ field }) => (
        <FormControlLabel
          className={className}
          control={
            <Checkbox
              {...field}
              checked={Boolean(field.value)}
              color='secondary'
              size='large'
              onChange={(e, checked) => {
                field.onChange(e, checked);
                onChange?.(e, checked);
              }}
            />
          }
          label={
            <div className='flex items-center gap-small no-wrap'>
              <Typography>{label}</Typography>
              <Tooltip title={tooltip} placement='right' arrow>
                <InfoOutlinedIcon fontSize='small' color='disabled' />
              </Tooltip>
            </div>
          }
        />
      )}
    />
  );
}

export default ControllerCheckboxWithTooltip;
