import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, TextField, Tooltip, Typography } from '@rbx/ui';
import useConfigurationSimulationContainerStyles from '../../container/ConfigurationSimulationContainer.styles';
import { IsNumericValue } from '../../utils/FormUtils';

interface NumericalPlayerRowProps {
  score: number;
  serverValue: number;
  playerValue: number;
  weight: number;
  maxDiff: number;
  aggregationType?: string;
  onValuesChange: (playerValue: number, serverValue: number) => void;
}

const NumericalPlayerRow = function NumericalPlayerRowProps({
  score,
  serverValue,
  playerValue,
  weight,
  maxDiff,
  aggregationType,
  onValuesChange,
}: NumericalPlayerRowProps): React.JSX.Element {
  const { translate } = useTranslation();
  const {
    classes: { scoreTextField, scoreGrid },
  } = useConfigurationSimulationContainerStyles();
  const [playerStringValue, setPlayerStringValue] = useState<string>(playerValue.toString());
  const [serverStringValue, setServerStringValue] = useState<string>(serverValue.toString());
  const [hasPlayerValueInputError, setHasPlayerValueInputError] = useState<boolean>(false);
  const [hasServerValueInputError, setHasServerValueInputError] = useState<boolean>(false);

  useEffect(() => {
    if (!Number.isNaN(playerStringValue)) {
      setPlayerStringValue(playerStringValue.toString());
    }
    if (!Number.isNaN(serverStringValue)) {
      setServerStringValue(serverStringValue.toString());
    }
  }, [serverStringValue, playerStringValue]);

  const handleServerValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setServerStringValue(event.target.value);
      const isValid = IsNumericValue(event.target.value);
      setHasServerValueInputError(!isValid);
      if (isValid) {
        onValuesChange(parseFloat(playerStringValue), parseFloat(event.target.value));
      }
    },
    [onValuesChange, playerStringValue],
  );

  const handlePlayerValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPlayerStringValue(event.target.value);
      const isValid = IsNumericValue(event.target.value);
      setHasPlayerValueInputError(!isValid);
      if (isValid) {
        onValuesChange(parseFloat(event.target.value), parseFloat(serverStringValue));
      }
    },
    [onValuesChange, serverStringValue],
  );

  const toolTipSummary = (
    <Grid item display='flex' direction='column'>
      <Typography variant='tooltip'>{translate('Tooltip.CustomSignalScore')}</Typography>
      <Typography variant='body2' whiteSpace='pre-line'>
        {translate('Tooltip.PlayerNumericalPlayerDetailsNew', {
          weight: weight.toString(),
          serverValue: serverStringValue,
          playerValue: playerStringValue,
          maxDiff: maxDiff.toString(),
          score: score.toString(),
          aggregationType: aggregationType ?? '',
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
          id='serverStringValue'
          value={serverStringValue}
          error={hasServerValueInputError}
          required
          label={translate('Label.AggregatedServerValue', {
            aggregationType: aggregationType ?? '',
          })}
          size='small'
          style={{ paddingRight: 15 }}
          onChange={handleServerValueChange}
        />{' '}
        <TextField
          id='playerStringValue'
          value={playerStringValue}
          error={hasPlayerValueInputError}
          required
          label={translate('Label.PlayerValue')}
          size='small'
          style={{ paddingRight: 15 }}
          onChange={handlePlayerValueChange}
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

export default NumericalPlayerRow;
