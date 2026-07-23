import React, { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, TextField, Tooltip, Typography } from '@rbx/ui';
import useConfigurationSimulationContainerStyles from '../../container/ConfigurationSimulationContainer.styles';

interface CategoricalConstantRowProps {
  score: number;
  serverValue: string;
  constantValue: string;
  weight: number;
  serverValueLabel: string;
  onValuesChange: (serverValue: string) => void;
}

const CategoricalConstantRow = function CategoricalConstantRowProps({
  score,
  serverValue,
  constantValue,
  weight,
  serverValueLabel,
  onValuesChange,
}: CategoricalConstantRowProps): React.JSX.Element {
  const { translate } = useTranslation();
  const {
    classes: { scoreTextField, scoreGrid },
  } = useConfigurationSimulationContainerStyles();
  const [serverStringValue, setServerStringValue] = useState<string>(serverValue.toString());
  const [hasServerValueInputError, setHasServerValueInputError] = useState<boolean>(false);

  const handleServerValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setServerStringValue(value);
      setHasServerValueInputError(!value);
      onValuesChange(value);
    },
    [onValuesChange],
  );

  const toolTipSummary = (
    <Grid item display='flex' direction='column'>
      <Typography variant='tooltip'>{translate('Tooltip.CustomSignalScore')}</Typography>
      <Typography variant='body2' whiteSpace='pre-line'>
        {translate('Tooltip.ServerCategoricalConstantDetails', {
          weight: weight.toString(),
          serverValue: serverStringValue === '' ? `""` : serverStringValue,
          constantValue,
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
          label={serverValueLabel}
          size='small'
          style={{ paddingRight: 15 }}
          onChange={handleServerValueChange}
        />{' '}
        <TextField
          id='constantValue'
          value={constantValue}
          disabled
          required
          label={translate('Label.Constant')}
          size='small'
          style={{ paddingRight: 15 }}
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

export default CategoricalConstantRow;
