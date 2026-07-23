import type { FunctionComponent } from 'react';
import React, { Fragment, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, Grid, TextField } from '@rbx/ui';
import ComparisonType from '../enums/ComparisonType';
import type { AttributesInfo } from '../types/AttributesInfo';
import { getAttributeName } from '../utils/ConfigurationUtils';
import useCustomSignalStyles from './CustomSignalDialog.styles';

export interface TestSignalServerValueProps {
  playerAttributeName?: string;
  attribute?: AttributesInfo;
  comparisonType?: ComparisonType;
  onJoiningPlayerChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onServerValueChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TestSignalServerValue: FunctionComponent<
  React.PropsWithChildren<TestSignalServerValueProps>
> = ({
  playerAttributeName,
  attribute,
  comparisonType,
  onJoiningPlayerChange,
  onServerValueChange,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { gridBorder },
    cx,
  } = useCustomSignalStyles();

  const attributeName = useMemo(() => {
    return getAttributeName(attribute) ?? '';
  }, [attribute]);

  return (
    <Grid
      item
      XSmall={4}
      className={cx(gridBorder)}
      display='flex'
      direction='column'
      alignItems='flex-start'>
      <Typography style={{ margin: 10 }} variant='h6'>
        {translate('Dialog.TestSignal')}
      </Typography>
      {comparisonType === ComparisonType.Player && (
        <>
          <Typography style={{ margin: 10 }} variant='body2'>
            {translate('Dialog.JoiningPlayer', {
              attribute: playerAttributeName ?? '',
            })}
          </Typography>
          <TextField
            style={{ margin: 10 }}
            required
            id='existingPlayer'
            size='small'
            inputProps={{ maxLength: 20 }}
            InputLabelProps={{ shrink: true }}
            defaultValue={0}
            label={translate('Dialog.JoiningPlayerLabel')}
            onChange={onJoiningPlayerChange}
          />
        </>
      )}
      <Typography style={{ margin: 10 }} variant='body2'>
        {translate('Dialog.ServerAttribute', {
          attribute: attributeName,
        })}
      </Typography>
      <TextField
        style={{ margin: 10 }}
        required
        id='serverValue'
        size='small'
        inputProps={{ maxLength: 20 }}
        InputLabelProps={{ shrink: true }}
        defaultValue={0}
        label={translate('Dialog.ServerValue')}
        onChange={onServerValueChange}
      />
    </Grid>
  );
};

export default TestSignalServerValue;
