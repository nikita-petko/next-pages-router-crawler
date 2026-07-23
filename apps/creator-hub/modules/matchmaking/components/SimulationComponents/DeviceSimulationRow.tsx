import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, TextField, Tooltip, Typography } from '@rbx/ui';
import useConfigurationSimulationContainerStyles from '../../container/ConfigurationSimulationContainer.styles';
import { IsNumericValue } from '../../utils/FormUtils';

interface DeviceSimulationRowProps {
  score: number;
  playerCount: number;
  occupancy: number;
  weight: number;
  onValuesChange: (playerCount: number) => void;
}

const DeviceSimulationRow = function DeviceSimulationRowProps({
  score,
  playerCount,
  occupancy,
  weight,
  onValuesChange,
}: DeviceSimulationRowProps): React.JSX.Element {
  const { translate } = useTranslation();
  const {
    classes: { scoreTextField, scoreGrid },
  } = useConfigurationSimulationContainerStyles();
  const [playerCountValue, setPlayerCountValue] = useState<string>(playerCount.toString());
  const [hasPlayerCountInputError, setHasPlayerCountInputError] = useState<boolean>(false);

  useEffect(() => {
    if (!Number.isNaN(playerCount)) {
      setPlayerCountValue(playerCount.toString());
    }
  }, [playerCount]);

  useEffect(() => {
    setHasPlayerCountInputError(playerCount > occupancy);
  }, [occupancy, playerCount]);

  const handleOnPlayerCountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPlayerCountValue(event.target.value);
      const numericVal = parseFloat(event.target.value);
      const isValid = IsNumericValue(event.target.value) && numericVal <= occupancy;
      setHasPlayerCountInputError(!isValid);
      if (isValid) {
        onValuesChange(parseFloat(event.target.value));
      }
    },
    [occupancy, onValuesChange],
  );

  const toolTipSummary = (
    <Grid item display='flex' direction='column'>
      <Typography variant='tooltip'>{translate('Tooltip.DeviceScore')}</Typography>
      <Typography variant='body2' whiteSpace='pre-line'>
        {translate('Tooltip.DivisionDetails', {
          weight: weight.toString(),
          denominator: occupancy.toString(),
          numerator: playerCountValue,
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
          id='playerCount'
          value={playerCountValue}
          error={hasPlayerCountInputError}
          required
          label={translate('Label.PlayerCount')}
          size='small'
          fullWidth
          style={{ paddingRight: 15 }}
          onChange={handleOnPlayerCountChange}
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

export default DeviceSimulationRow;
