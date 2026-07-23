import React from 'react';
import type { Control, FieldValues, Path, UseControllerProps } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { Typography, TextField } from '@rbx/ui';
import { ValidateNumber } from '../../utils/FormUtils';
import useCustomSignalStyles from '../CustomSignalDialog.styles';

export interface MaxDiffFieldProps<T extends FieldValues> extends UseControllerProps<T> {
  isDense: boolean;
  hasErrors: boolean;
  control: Control<T>;
  path: Path<T>;
  onMaxDiffChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MaxDiffField = function MaxDiffFieldProps<T extends FieldValues>({
  isDense,
  hasErrors,
  control,
  path,
  onMaxDiffChange,
}: MaxDiffFieldProps<T>): React.JSX.Element {
  const { translateHTML } = useTranslation();
  const {
    classes: { differenceInput },
  } = useCustomSignalStyles();

  return (
    <Typography
      style={{
        marginTop: isDense ? 0 : 20,
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
      }}
      variant='captionBody'
      color='primary'>
      {translateHTML(`Dialog.NumericalDifferences`, [
        {
          opening: 'inputStart',
          closing: 'inputEnd',
          content: () => {
            return (
              <Controller
                name={path}
                control={control}
                rules={{
                  required: 'Error.Required',
                  maxLength: 20,
                  validate: {
                    validDataType: (value) => ValidateNumber(value ?? null),
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin='dense'
                    classes={{ root: differenceInput }}
                    error={hasErrors}
                    required
                    id='name'
                    size='small'
                    inputProps={{ maxLength: 20 }}
                    label=''
                    onChange={onMaxDiffChange}
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

export default MaxDiffField;
