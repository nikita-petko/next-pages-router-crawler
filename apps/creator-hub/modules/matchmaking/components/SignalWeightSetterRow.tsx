import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  SquareRoundedIcon,
  TextField,
  IconButton,
  EditIcon,
  InfoOutlinedIcon,
  Tooltip,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useConfigurationSimulationContainerStyles from '../container/ConfigurationSimulationContainer.styles';
import { IsNumericValue } from '../utils/FormUtils';

export type SignalWeightSetterRowProps = {
  weight: number;
  name: string;
  signalLabel: string;
  color: string;
  isCustomSignal: boolean;
  tooltipLabel?: string;
  hasWeightSetterError: (hasError: boolean) => void;
  onWeightChange: (signalName: string, weight: number) => void;
  onEditCustomSignalClick?: (signalName: string) => void;
  disabled?: boolean;
};

const SignalWeightSetterRow: FunctionComponent<
  React.PropsWithChildren<SignalWeightSetterRowProps>
> = ({
  name,
  weight,
  signalLabel,
  color,
  isCustomSignal,
  tooltipLabel,
  hasWeightSetterError,
  onWeightChange,
  onEditCustomSignalClick,
  disabled,
}) => {
  const {
    classes: { signalsContainer },
  } = useConfigurationSimulationContainerStyles();
  const { translate } = useTranslation();
  const [hasInputError, setHasInputError] = useState<boolean>(false);
  const [value, setValue] = useState<string>(weight.toString());

  useEffect(() => {
    if (!Number.isNaN(weight)) {
      setValue(weight.toString());
    }
  }, [weight]);

  const handleEditIconClick = useCallback(
    (signalName: string) => {
      if (onEditCustomSignalClick) {
        onEditCustomSignalClick(signalName);
      }
    },
    [onEditCustomSignalClick],
  );

  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);

      const isValid = IsNumericValue(event.target.value);
      hasWeightSetterError(!isValid);
      setHasInputError(!isValid);
      onWeightChange(name, parseFloat(event.target.value));
    },
    [hasWeightSetterError, name, onWeightChange],
  );
  return (
    <Grid container direction='row' className={signalsContainer}>
      <Grid
        item
        XSmall={8}
        style={{ display: 'flex', marginTop: 6, alignItems: 'center', textOverflow: 'ellipsis' }}>
        <SquareRoundedIcon style={{ color, marginRight: 10 }} />
        <Typography variant='largeLabel2'>{signalLabel}</Typography>
        {tooltipLabel && tooltipLabel !== '' && (
          <Tooltip title={tooltipLabel} color='secondary' placement='top'>
            <IconButton aria-label='info' size='medium'>
              <InfoOutlinedIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        )}
        {isCustomSignal && (
          <IconButton
            style={{ marginBottom: 2 }}
            aria-label='edit'
            color='secondary'
            onClick={() => handleEditIconClick(name)}>
            <EditIcon />
          </IconButton>
        )}
      </Grid>
      <Grid item XSmall={4}>
        <TextField
          id={signalLabel}
          error={hasInputError}
          required
          value={value}
          label={translate('Label.Weight')}
          size='small'
          style={{ paddingRight: 15 }}
          onChange={handleOnChange}
          disabled={disabled}
        />
      </Grid>
    </Grid>
  );
};

export default SignalWeightSetterRow;
