import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, Grid, TextField } from '@rbx/ui';
import type { AttributesInfo } from '../types/AttributesInfo';
import { getAttributeName } from '../utils/ConfigurationUtils';
import useCustomSignalStyles from './CustomSignalDialog.styles';

export interface TestSignalServerOccupancyProps {
  attribute?: AttributesInfo;
  onPlayerCountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onServerOccupancyChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TestSignalServerOccupancy: FunctionComponent<
  React.PropsWithChildren<TestSignalServerOccupancyProps>
> = ({ attribute, onPlayerCountChange, onServerOccupancyChange }) => {
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
      <Typography style={{ margin: 10 }} variant='body2'>
        {translate('Description.PlayerNumber', {
          attribute: attributeName,
        })}
      </Typography>
      <TextField
        style={{ margin: 10 }}
        required
        id='playerCount'
        size='small'
        inputProps={{ maxLength: 20 }}
        InputLabelProps={{ shrink: true }}
        defaultValue={0}
        label={translate('Dialog.PlayerNumber')}
        onChange={onPlayerCountChange}
      />
      <Typography style={{ margin: 10 }} variant='body2'>
        {translate('Dialog.Occupancy')}
      </Typography>
      <TextField
        style={{ marginTop: 10, marginLeft: 10, marginRight: 10, marginBottom: 20 }}
        required
        id='occupancy'
        size='small'
        inputProps={{ maxLength: 20 }}
        InputLabelProps={{ shrink: true }}
        defaultValue={0}
        label={translate('Signal.Occupancy')}
        onChange={onServerOccupancyChange}
      />
    </Grid>
  );
};

export default TestSignalServerOccupancy;
