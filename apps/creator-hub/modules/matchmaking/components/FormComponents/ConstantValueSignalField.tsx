import React from 'react';
import type { Control, FieldValues, Path, UseControllerProps } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Typography, TextField } from '@rbx/ui';
import { ValidateData, ValidateNumber } from '../../utils/FormUtils';
import useCustomSignalStyles from '../CustomSignalDialog.styles';

export interface ConstantValueSignalFieldProps<
  T extends FieldValues,
> extends UseControllerProps<T> {
  isNumericConstant: boolean;
  hasErrors: boolean;
  control: Control<T>;
  path: Path<T>;
  onConstantChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ConstantValueSignalField = function ConstantValueSignalFieldProps<T extends FieldValues>({
  isNumericConstant,
  hasErrors,
  control,
  path,
  onConstantChange,
}: ConstantValueSignalFieldProps<T>): React.JSX.Element {
  const { translateHTML } = useTranslation();
  const {
    classes: { numericalInput },
  } = useCustomSignalStyles();

  return (
    <Typography
      style={{
        marginTop: 10,
        display: 'flex',
        alignItems: 'center',
      }}
      variant='captionBody'
      color='primary'>
      {translateHTML(`Dialog.ConstantValueInput`, [
        {
          opening: 'startValue',
          closing: 'endValue',
          content: () => {
            return (
              <Controller
                name={path}
                control={control}
                rules={{
                  required: 'Error.Required',
                  maxLength: 20,
                  validate: {
                    validDataType: (value) =>
                      isNumericConstant
                        ? ValidateNumber(value ?? null)
                        : ValidateData(value ?? null),
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin='dense'
                    classes={{ root: numericalInput }}
                    error={hasErrors}
                    required
                    id='name'
                    size='small'
                    inputProps={{ maxLength: 20 }}
                    label=''
                    onChange={onConstantChange}
                  />
                )}
              />
            );
          },
        },
      ])}
    </Typography>
  );
};

export default ConstantValueSignalField;
