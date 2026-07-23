import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, TextField, Tooltip, Typography } from '@rbx/ui';
import useConfigurationSimulationContainerStyles from '../../container/ConfigurationSimulationContainer.styles';
import { IsNumericValue } from '../../utils/FormUtils';

interface OccupancySimulationRowProps {
  score: number;
  occupancy: number;
  capacity: number;
  weight: number;
  onValuesChange: (occupancy: number, capacity: number) => void;
}

const OccupancySimulationRow = function OccupancySimulationRowProps({
  score,
  occupancy,
  capacity,
  weight,
  onValuesChange,
}: OccupancySimulationRowProps): React.JSX.Element {
  const { translate } = useTranslation();
  const {
    classes: { scoreTextField, scoreGrid },
  } = useConfigurationSimulationContainerStyles();
  const [occupancyValue, setOccupancyValue] = useState<string>(occupancy.toString());
  const [capacityValue, setCapacityValue] = useState<string>(capacity.toString());
  const [hasOccupancyInputError, setHasOccupancyInputError] = useState<boolean>(false);
  const [hasCapacityInputError, setHasCapacityInputError] = useState<boolean>(false);

  useEffect(() => {
    if (!Number.isNaN(occupancy)) {
      setOccupancyValue(occupancy.toString());
    }
    if (!Number.isNaN(capacity)) {
      setCapacityValue(capacity.toString());
    }
    setHasOccupancyInputError(capacity < occupancy);
  }, [capacity, occupancy]);

  const handleOnOccupancyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setOccupancyValue(event.target.value);
      const numericVal = parseFloat(event.target.value);
      const isValid = IsNumericValue(event.target.value) && numericVal <= capacity;
      setHasOccupancyInputError(!isValid);
      if (isValid) {
        onValuesChange(parseFloat(event.target.value), parseFloat(capacityValue));
      }
    },
    [capacity, capacityValue, onValuesChange],
  );

  const handleOnCapacityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCapacityValue(event.target.value);
      const isValid = IsNumericValue(event.target.value);
      setHasCapacityInputError(!isValid);
      if (isValid) {
        onValuesChange(parseFloat(occupancyValue), parseFloat(event.target.value));
      }
    },
    [occupancyValue, onValuesChange],
  );

  const toolTipSummary = (
    <Grid item display='flex' direction='column'>
      <Typography variant='tooltip'>{translate('Tooltip.OccupancyScore')}</Typography>
      <Typography variant='body2' whiteSpace='pre-line'>
        {translate('Tooltip.OccupancyDetails', {
          weight: weight.toString(),
          capacity: capacityValue,
          occupancy: occupancyValue,
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
          id='occupancy'
          value={occupancyValue}
          error={hasOccupancyInputError}
          required
          label={translate('Label.Occupancy')}
          size='small'
          style={{ paddingRight: 15 }}
          onChange={handleOnOccupancyChange}
        />
        <TextField
          id='capacity'
          value={capacityValue}
          error={hasCapacityInputError}
          required
          label={translate('Header.Capacity')}
          size='small'
          style={{ paddingRight: 15 }}
          onChange={handleOnCapacityChange}
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

export default OccupancySimulationRow;
