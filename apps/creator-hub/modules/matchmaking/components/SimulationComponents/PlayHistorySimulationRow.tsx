import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, TextField, Tooltip, Typography } from '@rbx/ui';
import useConfigurationSimulationContainerStyles from '../../container/ConfigurationSimulationContainer.styles';
import { IsNumericValue } from '../../utils/FormUtils';

interface PlayHistorySimulationRowProps {
  score: number;
  avgHistory: number;
  playerHistory: number;
  weight: number;
  onValuesChange: (playerHistory: number, avgHistory: number) => void;
}

const PlayHistorySimulationRow = function PlayHistorySimulationRowProps({
  score,
  avgHistory,
  playerHistory,
  weight,
  onValuesChange,
}: PlayHistorySimulationRowProps): React.JSX.Element {
  const { translate } = useTranslation();
  const {
    classes: { scoreTextField, scoreGrid },
  } = useConfigurationSimulationContainerStyles();
  const [playerHistoryValue, setPlayerHistoryValue] = useState<string>(playerHistory.toString());
  const [avgHistoryValue, setAvgHistoryValue] = useState<string>(avgHistory.toString());
  const [hasPlayerHistoryInputError, setHasPlayerHistoryInputError] = useState<boolean>(false);
  const [hasAvgHistoryInputError, setHasAvgHistoryInputError] = useState<boolean>(false);

  useEffect(() => {
    if (!Number.isNaN(playerHistory)) {
      setPlayerHistoryValue(playerHistory.toString());
    }
    if (!Number.isNaN(avgHistory)) {
      setAvgHistoryValue(avgHistory.toString());
    }
  }, [avgHistory, playerHistory]);

  const handleOnAverageHistoryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAvgHistoryValue(event.target.value);
      const isValid = IsNumericValue(event.target.value);
      setHasAvgHistoryInputError(!isValid);
      if (isValid) {
        onValuesChange(parseFloat(playerHistoryValue), parseFloat(event.target.value));
      }
    },
    [onValuesChange, playerHistoryValue],
  );

  const handleOnPlayerHistoryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPlayerHistoryValue(event.target.value);
      const isValid = IsNumericValue(event.target.value);
      setHasPlayerHistoryInputError(!isValid);
      if (isValid) {
        onValuesChange(parseFloat(event.target.value), parseFloat(avgHistoryValue));
      }
    },
    [onValuesChange, avgHistoryValue],
  );

  const toolTipSummary = (
    <Grid item display='flex' direction='column'>
      <Typography variant='tooltip'>{translate('Tooltip.HistoryScore')}</Typography>
      <Typography variant='body2' whiteSpace='pre-line'>
        {translate('Tooltip.HistoryDetailsNew', {
          weight: weight.toString(),
          serverHistory: avgHistoryValue,
          playerHistory: playerHistoryValue,
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
          id='playerHistory'
          value={playerHistoryValue}
          error={hasPlayerHistoryInputError}
          required
          label={translate('Label.PlayerHistory')}
          size='small'
          style={{ paddingRight: 15 }}
          onChange={handleOnPlayerHistoryChange}
        />
        <TextField
          id='avgHistory'
          value={avgHistoryValue}
          error={hasAvgHistoryInputError}
          required
          label={translate('Label.ServerHistory')}
          size='small'
          style={{ paddingRight: 15 }}
          onChange={handleOnAverageHistoryChange}
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

export default PlayHistorySimulationRow;
