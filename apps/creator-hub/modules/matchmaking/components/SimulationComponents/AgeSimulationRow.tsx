import React, { useCallback, useEffect, useState } from 'react';
import { Grid, TextField, Tooltip, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useConfigurationSimulationContainerStyles from '../../container/ConfigurationSimulationContainer.styles';
import { IsNumericValue } from '../../utils/FormUtils';

interface AgeSimulationRowProps {
  score: number;
  avgAge: number;
  playerAge: number;
  weight: number;
  onValuesChange: (playerAge: number, avgAge: number) => void;
}

const AgeSimulationRow = function AgeSimulationRowProps({
  score,
  avgAge,
  playerAge,
  weight,
  onValuesChange,
}: AgeSimulationRowProps): React.JSX.Element {
  const { translate } = useTranslation();
  const {
    classes: { scoreTextField, scoreGrid },
  } = useConfigurationSimulationContainerStyles();
  const [playerAgeValue, setPlayerAgeValue] = useState<string>(playerAge.toString());
  const [avgAgeValue, setAvgAgeValue] = useState<string>(avgAge.toString());
  const [hasPlayerAgeInputError, setHasPlayerAgeInputError] = useState<boolean>(false);
  const [hasAvgAgeInputError, setHasAvgAgeInputError] = useState<boolean>(false);

  useEffect(() => {
    if (!Number.isNaN(playerAge)) {
      setPlayerAgeValue(playerAge.toString());
    }
    if (!Number.isNaN(avgAge)) {
      setAvgAgeValue(avgAge.toString());
    }
  }, [avgAge, playerAge]);

  const handleOnAverageAgeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAvgAgeValue(event.target.value);
      const isValid = IsNumericValue(event.target.value);
      setHasAvgAgeInputError(!isValid);
      if (isValid) {
        onValuesChange(parseFloat(playerAgeValue), parseFloat(event.target.value));
      }
    },
    [onValuesChange, playerAgeValue],
  );

  const handleOnPlayerAgeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPlayerAgeValue(event.target.value);
      const isValid = IsNumericValue(event.target.value);
      setHasPlayerAgeInputError(!isValid);
      if (isValid) {
        onValuesChange(parseFloat(event.target.value), parseFloat(avgAgeValue));
      }
    },
    [onValuesChange, avgAgeValue],
  );

  const toolTipSummary = (
    <Grid item display='flex' direction='column'>
      <Typography variant='tooltip'>{translate('Tooltip.AgeDiffScore')}</Typography>
      <Typography variant='body2' whiteSpace='pre-line'>
        {translate('Tooltip.AgeDetailsNew', {
          weight: weight.toString(),
          serverAge: avgAgeValue,
          playerAge: playerAgeValue,
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
      alignItems='center'
      style={{ marginLeft: 10, marginTop: 20 }}>
      <Grid item XSmall={9} display='flex' direction='row'>
        <TextField
          id='playerAge'
          value={playerAgeValue}
          error={hasPlayerAgeInputError}
          required
          label={translate('Label.PlayerAge')}
          size='small'
          style={{ paddingRight: 15 }}
          onChange={handleOnPlayerAgeChange}
        />
        <TextField
          id='avgAge'
          value={avgAgeValue}
          error={hasAvgAgeInputError}
          required
          label={translate('Label.ServerAge')}
          size='small'
          style={{ paddingRight: 15 }}
          onChange={handleOnAverageAgeChange}
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

export default AgeSimulationRow;
