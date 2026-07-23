import React, { useCallback, useState } from 'react';
import { Grid, TextField, Tooltip, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useConfigurationSimulationContainerStyles from '../../container/ConfigurationSimulationContainer.styles';

interface CategoricalPlayerRowProps {
  score: number;
  serverValue: string;
  playerValue: string;
  weight: number;
  onValuesChange: (playerValue: string, serverValue: string) => void;
}

const CategoricalPlayerRow = function CategoricalPlayerRowProps({
  score,
  serverValue,
  playerValue,
  weight,
  onValuesChange,
}: CategoricalPlayerRowProps): React.JSX.Element {
  const { translate } = useTranslation();
  const {
    classes: { scoreTextField, scoreGrid },
  } = useConfigurationSimulationContainerStyles();
  const [playerStringValue, setPlayerStringValue] = useState<string>(playerValue.toString());
  const [serverStringValue, setServerStringValue] = useState<string>(serverValue.toString());
  const [hasPlayerValueInputError, setHasPlayerValueInputError] = useState<boolean>(false);
  const [hasServerValueInputError, setHasServerValueInputError] = useState<boolean>(false);

  const handleServerValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setServerStringValue(value);
      setHasServerValueInputError(!value);
      onValuesChange(playerStringValue, value);
    },
    [onValuesChange, playerStringValue],
  );

  const handlePlayerValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setPlayerStringValue(value);
      setHasPlayerValueInputError(!value);
      onValuesChange(value, serverStringValue);
    },
    [onValuesChange, serverStringValue],
  );

  const toolTipSummary = (
    <Grid item display='flex' direction='column'>
      <Typography variant='tooltip'>{translate('Tooltip.CustomSignalScore')}</Typography>
      <Typography variant='body2' whiteSpace='pre-line'>
        {translate('Tooltip.ServerCategoricalPlayerDetails', {
          weight: weight.toString(),
          serverValue: serverStringValue,
          playerValue: playerStringValue,
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
          id='serverStringValue'
          value={serverStringValue}
          error={hasServerValueInputError}
          required
          label={translate('Dialog.ServerValue')}
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

export default CategoricalPlayerRow;
