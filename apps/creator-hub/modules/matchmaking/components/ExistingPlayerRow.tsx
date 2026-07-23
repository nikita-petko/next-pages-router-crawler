import type { FunctionComponent } from 'react';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, TextField, CloseIcon } from '@rbx/ui';

export interface ExistingPlayerRowProps {
  value: number;
  playerCount: number;
  shouldShowCloseIcon: boolean;
  onChange: (prevValue: number, value: number) => void;
  onCancel: (value: number) => void;
}

const ExistingPlayerRow: FunctionComponent<React.PropsWithChildren<ExistingPlayerRowProps>> = ({
  value,
  playerCount,
  shouldShowCloseIcon,
  onChange,
  onCancel,
}) => {
  const { translate } = useTranslation();
  const [isError, setIsError] = useState<boolean>(false);
  const currValue = useRef<number>(0);

  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numericValue = Number(event.target.value);
      const isNumeric = !Number.isNaN(numericValue);
      if (isNumeric || event.target.value === '0') {
        setIsError(false);
        onChange(playerCount - 1, numericValue);
        currValue.current = isNumeric ? numericValue : 0;
      } else {
        setIsError(true);
      }
    },
    [onChange, playerCount],
  );

  const handleOnCancel = useCallback(() => {
    onCancel(playerCount - 1);
  }, [onCancel, playerCount]);

  return (
    <Grid
      display='flex'
      direction='row'
      alignItems='center'
      style={{ marginBottom: 10, marginLeft: 10, marginTop: 10 }}>
      <TextField
        error={isError}
        style={{ marginRight: 10 }}
        required
        id={`${playerCount}`}
        size='small'
        inputProps={{ maxLength: 20 }}
        InputLabelProps={{ shrink: true }}
        value={value}
        label={translate('Dialog.Player', {
          number: `${playerCount}`,
        })}
        onChange={handleOnChange}
        helperText={isError ? translate('Error.InvalidDataType') : undefined}
      />
      {shouldShowCloseIcon && <CloseIcon onClick={handleOnCancel} />}
    </Grid>
  );
};

export default ExistingPlayerRow;
