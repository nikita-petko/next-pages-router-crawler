import React, { useCallback, useEffect, useState } from 'react';
import { Grid, TextField, Tooltip, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useConfigurationSimulationContainerStyles from '../../container/ConfigurationSimulationContainer.styles';
import { IsNumericValue } from '../../utils/FormUtils';

interface LatencySimulationRowProps {
  score: number;
  latency: number;
  weight: number;
  onValuesChange: (latency: number) => void;
}

const LatencySimulationRow = function LatencySimulationRowProps({
  score,
  latency,
  weight,
  onValuesChange,
}: LatencySimulationRowProps): React.JSX.Element {
  const { translate } = useTranslation();
  const {
    classes: { scoreTextField, scoreGrid },
  } = useConfigurationSimulationContainerStyles();
  const [latencyValue, setLatencyValue] = useState<string>(latency.toString());
  const [hasLatencyInputError, setHasLatencyInputError] = useState<boolean>(false);

  useEffect(() => {
    if (!Number.isNaN(latency)) {
      setLatencyValue(latency.toString());
    }
  }, [latency]);

  const handleOnLatencyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setLatencyValue(event.target.value);
      const isValid = IsNumericValue(event.target.value);
      setHasLatencyInputError(!isValid);
      if (isValid) {
        onValuesChange(parseFloat(event.target.value));
      }
    },
    [onValuesChange],
  );

  const toolTipSummary = (
    <Grid item display='flex' direction='column'>
      <Typography variant='tooltip'>{translate('Tooltip.LatencyScore')}</Typography>
      <Typography variant='body2' whiteSpace='pre-line'>
        {translate('Tooltip.LatencyDetailsNew', {
          weight: weight.toString(),
          latency: latencyValue,
          score: score.toString(),
        })}
      </Typography>
    </Grid>
  );

  return (
    <Grid
      item
      XSmall={12}
      justifyContent='space-between'
      display='flex'
      direction='row'
      alignItems='flex-start'
      style={{ marginLeft: 10, marginTop: 20 }}>
      <Grid item XSmall={9} display='flex' direction='row'>
        <TextField
          id='latency'
          value={latencyValue}
          error={hasLatencyInputError}
          required
          label={translate('Signal.Latency')}
          size='small'
          fullWidth
          style={{ paddingRight: 15 }}
          onChange={handleOnLatencyChange}
        />
      </Grid>
      <Grid item XSmall={3} className={scoreGrid}>
        <Tooltip title={toolTipSummary} placement='top'>
          <Typography className={scoreTextField} color='primary' variant='body2'>
            {score}
          </Typography>
        </Tooltip>
      </Grid>
    </Grid>
  );
};

export default LatencySimulationRow;
