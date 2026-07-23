import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, TextField, Tooltip, Typography } from '@rbx/ui';
import useConfigurationSimulationContainerStyles from '../../container/ConfigurationSimulationContainer.styles';
import { IsNumericValue } from '../../utils/FormUtils';

interface NumericalConstantRowProps {
  score: number;
  serverValue: number;
  constantValue: number;
  maxDiff: number;
  weight: number;
  serverValueLabel: string;
  onValuesChange: (serverValue: number) => void;
}

const NumericalConstantRow = function NumericalConstantRowProps({
  score,
  serverValue,
  constantValue,
  maxDiff,
  weight,
  serverValueLabel,
  onValuesChange,
}: NumericalConstantRowProps): React.JSX.Element {
  const { translate } = useTranslation();
  const {
    classes: { scoreTextField, scoreGrid },
  } = useConfigurationSimulationContainerStyles();
  const [serverStringValue, setServerStringValue] = useState<string>(serverValue.toString());
  const [hasServerValueInputError, setHasServerValueInputError] = useState<boolean>(false);

  useEffect(() => {
    if (!Number.isNaN(serverStringValue)) {
      setServerStringValue(serverStringValue.toString());
    }
  }, [serverStringValue]);

  const handleServerValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setServerStringValue(event.target.value);
      const isValid = IsNumericValue(event.target.value);
      setHasServerValueInputError(!isValid);
      if (isValid) {
        onValuesChange(parseFloat(event.target.value));
      }
    },
    [onValuesChange],
  );

  const toolTipSummary = (
    <Grid item display='flex' direction='column'>
      <Typography variant='tooltip'>{translate('Tooltip.CustomSignalScore')}</Typography>
      <Typography variant='body2' whiteSpace='pre-line'>
        {translate('Tooltip.PlayerNumericalConstantDetails', {
          weight: weight.toString(),
          serverValue: serverStringValue,
          constantValue: constantValue.toString(),
          maxDiff: maxDiff.toString(),
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

export default NumericalConstantRow;
