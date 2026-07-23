import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  Divider,
  Button,
  InfoOutlinedIcon,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  MoreVertIcon,
} from '@rbx/ui';
import useChartColors from '@modules/charts-generic/charts/hooks/useChartColors';
import { maxCustomSignalPerConfig } from '../constants';
import useConfigurationSimulationContainerStyles from '../container/ConfigurationSimulationContainer.styles';
import DefaultConfigurationSignals from '../enums/DefaultConfigurationSignals';
import useAttributesManagement from '../hooks/useAttributesManagement';
import type { ConfigurationDetailedInfo, CustomSignal } from '../types/ConfigurationInfo';
import {
  defaultSignalsTranslationKeys,
  defaultWeightTooltipLabels,
} from '../utils/translationGetter';
import CustomSignalDialog from './CustomSignalDialog';
import SignalWeightSetterRow from './SignalWeightSetterRow';

export type SignalWeightSetterFormProps = {
  isUsingDefaultWeights: boolean;
  config: ConfigurationDetailedInfo;
  customSignalWeightsMap: Map<string, CustomSignal>;
  defaultSignalWeightsMap: Map<string, number>;
  hasWeightSetterError: (hasError: boolean) => void;
  onDefaultSignalWeightChange: (signalName: string, weight: number) => void;
  onCustomSignalWeightChange: (signalName: string, signal: CustomSignal) => void;
  onCustomSignalDelete: (signalName: string) => void;
  onResetDefaultWeights: () => void;
  disabled?: boolean;
};

const SignalWeightSetterForm: FunctionComponent<
  React.PropsWithChildren<SignalWeightSetterFormProps>
> = ({
  isUsingDefaultWeights,
  config,
  customSignalWeightsMap,
  defaultSignalWeightsMap,
  hasWeightSetterError,
  onDefaultSignalWeightChange,
  onCustomSignalWeightChange,
  onCustomSignalDelete,
  onResetDefaultWeights,
  disabled,
}) => {
  const {
    classes: { title, signalsContainer, customSignalButton, weightsInfo, signalWeightsContainer },
  } = useConfigurationSimulationContainerStyles();
  const { translate } = useTranslation();
  const colors = useChartColors();
  const { allAttributesList } = useAttributesManagement();
  const [selectedCustomSignalName, setSelectedCustomSignalName] = useState<string>('');
  const [isCustomSignalDialogOpen, setIsCustomSignalDialogOpen] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonOpen, setButtonOpen] = useState(false);
  const buttonClick = useCallback(() => {
    setButtonOpen((prev) => !prev);
  }, [setButtonOpen]);
  const closeMenu = useCallback(() => {
    setButtonOpen(false);
  }, [setButtonOpen]);

  const handleResetWeight = useCallback(() => {
    onResetDefaultWeights();
    closeMenu();
  }, [closeMenu, onResetDefaultWeights]);

  const configurationExplainer = (
    <Grid container direction='column' className={title}>
      <Grid
        container
        display='flex'
        direction='row'
        flexWrap='nowrap'
        justifyContent='space-between'>
        <Grid item display='flex' direction='row'>
          <Typography variant='h5'>{translate('Label.Configuration')}</Typography>
          <Grid item className={weightsInfo}>
            <InfoOutlinedIcon
              style={{ marginRight: 3, marginTop: 1 }}
              fontSize='small'
              color='secondary'
            />
            <Typography color='primary' variant='tooltip'>
              {translate(isUsingDefaultWeights ? 'Label.Default' : 'Label.Custom')}
            </Typography>
          </Grid>
        </Grid>
        <IconButton
          style={{ marginTop: -1 }}
          onClick={buttonClick}
          aria-label='more'
          ref={buttonRef}
          disableRipple
          size='small'
          color='secondary'>
          <MoreVertIcon />
        </IconButton>
        <Menu
          open={buttonOpen}
          anchorEl={buttonRef.current}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}>
          <MenuItem key='apply' onClick={handleResetWeight}>
            <Typography variant='smallLabel1'>{translate('Tooltip.ResetWeights')}</Typography>
          </MenuItem>
        </Menu>
      </Grid>
      <Typography variant='body2' style={{ textOverflow: 'ellipsis' }}>
        {translate('Description.SignalsConfigurationNew')}
      </Typography>
    </Grid>
  );

  const selectedCustomSignal = useMemo(() => {
    if (!selectedCustomSignalName) {
      return;
    }
    return config?.customSignals?.find(
      (customSignal) => customSignal?.name === selectedCustomSignalName,
    );
  }, [config?.customSignals, selectedCustomSignalName]);

  const signalsHeading = (
    <Grid>
      <Grid container direction='row' className={signalsContainer}>
        <Grid item XSmall={8}>
          <Typography variant='body2'>{translate('Label.Signals')}</Typography>
        </Grid>
        <Grid item XSmall={4} style={{ flexWrap: 'nowrap', display: 'flex', alignItems: 'center' }}>
          <Typography variant='body2'>{translate('Label.Weights')}</Typography>
          <Tooltip title={translate('Tooltip.SetWeights')} color='secondary' placement='top'>
            <IconButton aria-label='info' size='medium'>
              <InfoOutlinedIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
      <Divider />
    </Grid>
  );

  const handleAddCustomSignalButtonClick = useCallback((isOpen: boolean) => {
    setIsCustomSignalDialogOpen(isOpen);
  }, []);

  const handleAddCustomSignal = useCallback(
    (signal: CustomSignal) => {
      setIsCustomSignalDialogOpen(false);
      onCustomSignalWeightChange(signal.name, signal);
    },
    [onCustomSignalWeightChange],
  );

  const handleCustomSignalWeightChange = useCallback(
    (signalName: string, weight: number) => {
      const currSignal = customSignalWeightsMap.get(signalName);
      if (currSignal) {
        const updatedSignal: CustomSignal = {
          ...currSignal,
          weight,
        };
        onCustomSignalWeightChange(signalName, updatedSignal);
      }
    },
    [customSignalWeightsMap, onCustomSignalWeightChange],
  );

  const handlDeleteCustomSignal = useCallback(
    (signalName: string) => {
      setIsCustomSignalDialogOpen(false);
      onCustomSignalDelete(signalName);
    },
    [onCustomSignalDelete],
  );

  const handleEditCustomSignalClick = useCallback((signalName: string) => {
    setSelectedCustomSignalName(signalName);
    setIsCustomSignalDialogOpen(true);
  }, []);

  const handleCustomSignalFormCancel = useCallback(() => {
    handleAddCustomSignalButtonClick(false);
    setSelectedCustomSignalName('');
  }, [handleAddCustomSignalButtonClick]);

  return (
    <Grid item XSmall={3} className={signalWeightsContainer}>
      {configurationExplainer}
      {signalsHeading}
      {Array.from(defaultSignalWeightsMap).map(([signal, weight], i) => (
        <SignalWeightSetterRow
          key={signal}
          name={signal}
          weight={weight}
          tooltipLabel={translate(
            defaultWeightTooltipLabels[signal as keyof typeof DefaultConfigurationSignals],
          )}
          signalLabel={translate(
            defaultSignalsTranslationKeys[signal as keyof typeof DefaultConfigurationSignals],
          )}
          isCustomSignal={false}
          color={colors[i]}
          hasWeightSetterError={hasWeightSetterError}
          onWeightChange={onDefaultSignalWeightChange}
          disabled={disabled}
        />
      ))}
      {Array.from(customSignalWeightsMap).map(([signalName, signal], i) => (
        <SignalWeightSetterRow
          key={signalName}
          name={signalName}
          signalLabel={signalName}
          weight={signal.weight ?? 0}
          isCustomSignal
          tooltipLabel={signal.description}
          color={colors[i + Object.keys(DefaultConfigurationSignals).length]}
          hasWeightSetterError={hasWeightSetterError}
          onWeightChange={handleCustomSignalWeightChange}
          onEditCustomSignalClick={handleEditCustomSignalClick}
          disabled={disabled}
        />
      ))}
      <Button
        className={customSignalButton}
        variant='contained'
        disabled={customSignalWeightsMap.size >= maxCustomSignalPerConfig || disabled}
        aria-label='save configuration'
        onClick={() => handleAddCustomSignalButtonClick(true)}
        size='medium'
        color='secondary'>
        {translate('Button.AddSignal')}
      </Button>
      <CustomSignalDialog
        key={selectedCustomSignal?.name ?? 'newCustomSignal'}
        allAttributes={allAttributesList}
        currentSignal={selectedCustomSignal}
        configId={config?.id}
        isDialogOpen={isCustomSignalDialogOpen}
        onClose={handleCustomSignalFormCancel}
        onConfirm={handleAddCustomSignal}
        onDelete={handlDeleteCustomSignal}
      />
    </Grid>
  );
};

export default SignalWeightSetterForm;
