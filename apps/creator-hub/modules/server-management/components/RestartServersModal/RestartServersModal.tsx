import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Typography,
  Button,
  Grid,
  Card,
  TextField,
  Alert,
} from '@rbx/ui';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useTranslation } from '@rbx/intl';
import { useSettings } from '@modules/settings';
import useServerManagement from '../../hooks/useServerManagement';
import useRestartServersModalStyles from './RestartServersModal.styles';
import { PlaceSummary, ForecastResponse, ImpactValues } from '../../types/PlaceSummary';
import { VALIDATION_CONSTANTS, POLLING_CONSTANTS, DISPLAY_CONSTANTS } from '../../constants';
import { calculateImpact } from '../../utils/ImpactCalculation';
import isNumericString from '../../utils/isNumericString';

type RestartServersModalProps = {
  open: boolean;
  onClose: () => void;
  selectedPlaces: number[];
  onConfirm: (options: { restartOutdatedOnly: boolean; bleedOffMinutes?: string }) => void;
  onForecastUpdateFailure?: () => void;
};

type ImpactData = {
  placesImpacted: number;
  serversImpacted: number;
  playersImpacted: number;
  isLoading: boolean;
  error?: string;
  warning?: string;
};

const RestartServersModal: React.FC<RestartServersModalProps> = ({
  open,
  onClose,
  selectedPlaces,
  onConfirm,
  onForecastUpdateFailure,
}) => {
  const { classes } = useRestartServersModalStyles();
  const { gameDetails } = useCurrentGame();
  const { handleForecastUpdate: originalHandleForecastUpdate } = useServerManagement();
  const { translate } = useTranslation();
  const { settings } = useSettings();

  const handleForecastUpdate = useCallback(() => {
    return originalHandleForecastUpdate();
  }, [originalHandleForecastUpdate]);

  const [impactData, setImpactData] = useState<ImpactData>({
    placesImpacted: selectedPlaces.length,
    serversImpacted: 0,
    playersImpacted: 0,
    isLoading: false,
    warning: undefined,
  });

  const [restartOutdatedOnly, setRestartOutdatedOnly] = useState(true);
  const [bleedOffEnabled, setBleedOffEnabled] = useState(false);
  const [bleedOffMinutes, setBleedOffMinutes] = useState('');
  const [apiResponse, setApiResponse] = useState<ForecastResponse | null>(null);
  const [previousImpactValues, setPreviousImpactValues] = useState<ImpactValues | null>(null);

  const handleBleedOffMinutesChange = (value: string) => {
    const integerOnly = value.replace(/[^0-9]/g, '');
    const cleanValue = integerOnly.replace(/^0+/, '') || '';
    setBleedOffMinutes(cleanValue);
  };

  const recalculateImpactData = useCallback(() => {
    if (!apiResponse) return;

    const result = calculateImpact({
      apiResponse,
      selectedPlaces,
      restartOutdatedOnly,
      translate,
    });

    setImpactData((prev) => ({
      ...prev,
      ...result,
      isLoading: false,
    }));
  }, [apiResponse, selectedPlaces, restartOutdatedOnly, translate]);

  const bleedOffMaxMinutes = settings.serverManagementIncreaseRestartDelay
    ? VALIDATION_CONSTANTS.BLEED_OFF_MAX_MINUTES
    : VALIDATION_CONSTANTS.BLEED_OFF_MAX_MINUTES_D;
  const isBleedOffValid =
    !bleedOffEnabled ||
    (bleedOffMinutes &&
      isNumericString(bleedOffMinutes) &&
      Number(bleedOffMinutes) >= VALIDATION_CONSTANTS.BLEED_OFF_MIN_MINUTES &&
      Number(bleedOffMinutes) <= bleedOffMaxMinutes);
  const canConfirm = isBleedOffValid && impactData.serversImpacted > 0 && !impactData.error;

  const getPlacesImpactedDisplay = useCallback(() => {
    if (impactData.error) {
      return DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER;
    }
    return impactData.placesImpacted;
  }, [impactData.error, impactData.placesImpacted]);

  const getServersImpactedDisplay = useCallback(() => {
    if (impactData.error) {
      return DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER;
    }
    return impactData.serversImpacted.toLocaleString();
  }, [impactData.error, impactData.serversImpacted]);

  const getPlayersImpactedDisplay = useCallback(() => {
    if (impactData.error) {
      return DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER;
    }
    if (impactData.playersImpacted >= VALIDATION_CONSTANTS.PLAYER_COUNT_THRESHOLD_FOR_K_FORMAT) {
      return `${Math.round(impactData.playersImpacted / VALIDATION_CONSTANTS.PLAYER_COUNT_THRESHOLD_FOR_K_FORMAT)}k`;
    }
    return impactData.playersImpacted;
  }, [impactData.error, impactData.playersImpacted]);

  useEffect(() => {
    if (open) {
      setRestartOutdatedOnly(true);
      setBleedOffEnabled(false);
      setBleedOffMinutes('');
      setApiResponse(null);
      setPreviousImpactValues(null);
      setImpactData((prev) => ({
        ...prev,
        placesImpacted: selectedPlaces.length,
        serversImpacted: 0,
        playersImpacted: 0,
        isLoading: false,
      }));
    }
  }, [open, selectedPlaces.length]);

  const fetchImpactData = useCallback(async () => {
    if (!open || !gameDetails?.id) return;

    const isInitialFetch = !apiResponse;
    if (isInitialFetch) {
      setImpactData((prev) => ({ ...prev, isLoading: true, error: undefined }));
    }

    try {
      const response = await handleForecastUpdate();

      let totalServers = 0;
      let totalPlayers = 0;
      let relevantPlaces = 0;
      let warning: string | undefined;

      if (selectedPlaces.length > 0) {
        const selectedPlaceSummaries =
          response.placeSummaries?.filter(
            (summary: PlaceSummary) =>
              summary.placeId !== undefined && selectedPlaces.includes(summary.placeId),
          ) || [];

        totalServers = selectedPlaceSummaries.reduce(
          (sum: number, summary: PlaceSummary) => sum + (summary.instancesToBeClosed ?? 0),
          0,
        );
        totalPlayers = selectedPlaceSummaries.reduce(
          (sum: number, summary: PlaceSummary) => sum + (summary.playersToBeKicked ?? 0),
          0,
        );
        relevantPlaces = selectedPlaceSummaries.length;

        const placesWithNoOutdatedServers = selectedPlaceSummaries.filter(
          (summary: PlaceSummary) => (summary.instancesToBeClosed || 0) === 0,
        );
        if (placesWithNoOutdatedServers.length > 0) {
          const placeCount = placesWithNoOutdatedServers.length;

          if (placeCount === 1) {
            warning = translate('Warning.OnePlaceText', { placeCount: placeCount.toString() });
          } else {
            warning = translate('Warning.MultiplePlacesText', {
              placeCount: placeCount.toString(),
            });
          }
        }
      } else {
        totalServers =
          response.placeSummaries?.reduce(
            (sum: number, summary: PlaceSummary) => sum + (summary.instancesToBeClosed || 0),
            0,
          ) || 0;
        totalPlayers =
          response.placeSummaries?.reduce(
            (sum: number, summary: PlaceSummary) => sum + (summary.playersToBeKicked || 0),
            0,
          ) || 0;
        relevantPlaces = response.placeSummaries?.length || 0;

        const placesWithNoOutdatedServers =
          response.placeSummaries?.filter(
            (summary: PlaceSummary) => (summary.instancesToBeClosed || 0) === 0,
          ) || [];
        if (placesWithNoOutdatedServers.length > 0) {
          const placeCount = placesWithNoOutdatedServers.length;

          if (placeCount === 1) {
            warning = translate('Warning.OnePlaceText', { placeCount: placeCount.toString() });
          } else {
            warning = translate('Warning.MultiplePlacesText', {
              placeCount: placeCount.toString(),
            });
          }
        }
      }

      const currentImpactValues = {
        places: relevantPlaces,
        servers: totalServers,
        players: totalPlayers,
        warning,
      };

      const hasImpactValuesChanged =
        !previousImpactValues ||
        previousImpactValues.places !== relevantPlaces ||
        previousImpactValues.servers !== totalServers ||
        previousImpactValues.players !== totalPlayers ||
        previousImpactValues.warning !== warning;

      if (hasImpactValuesChanged) {
        setPreviousImpactValues(currentImpactValues);
        setApiResponse(response as ForecastResponse);

        setImpactData((prev) => ({
          ...prev,
          placesImpacted: relevantPlaces,
          serversImpacted: totalServers,
          playersImpacted: totalPlayers,
          isLoading: false,
          warning,
        }));
      } else {
        setImpactData((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch {
      setImpactData((prev) => ({
        ...prev,
        isLoading: false,
        error: translate('Error.ImpactData'),
      }));

      if (onForecastUpdateFailure) {
        onForecastUpdateFailure();
      }
    }
  }, [
    open,
    gameDetails?.id,
    apiResponse,
    handleForecastUpdate,
    selectedPlaces,
    previousImpactValues,
    translate,
    onForecastUpdateFailure,
  ]);

  useEffect(() => {
    fetchImpactData();
  }, [fetchImpactData]);

  useEffect(() => {
    if (apiResponse) {
      recalculateImpactData();
    }
  }, [restartOutdatedOnly, apiResponse, recalculateImpactData]);

  useEffect(() => {
    if (open && gameDetails?.id) {
      const interval = setInterval(() => {
        fetchImpactData();
      }, POLLING_CONSTANTS.INTERVAL_MS);

      return () => {
        clearInterval(interval);
      };
    }
    return () => {};
  }, [open, gameDetails?.id, fetchImpactData]);

  return (
    <Dialog
      open={open}
      maxWidth='Medium'
      fullWidth
      onClose={onClose}
      classes={{ paper: classes.dialogPaper }}>
      <DialogTitle className={classes.dialogTitle}>
        <Typography variant='h4'>{translate('RestartServersModal.Title')}</Typography>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <Typography variant='h6' align='left'>
          {translate('RestartServersModal.RestartOptions')}
        </Typography>
        <Grid container direction='column' spacing={2} className={classes.gridContainer}>
          <Grid item>
            <Grid container className={classes.checkboxContainer} spacing={1.5}>
              <Grid item>
                <Checkbox
                  checked={restartOutdatedOnly}
                  onChange={(e) => {
                    setRestartOutdatedOnly((e.target as HTMLInputElement).checked);
                  }}
                  size='large'
                  color='secondary'
                />
              </Grid>
              <Grid item className={classes.flexItem}>
                <Typography variant='h6' fontWeight='bold' className={classes.titleMedium}>
                  {translate('RestartServersModal.RestartOutdatedOnly')}
                </Typography>
                <Typography variant='body2' className={classes.bodyText}>
                  {translate('RestartServersModal.RestartOutdatedOnlyDescription')}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Grid container className={classes.checkboxContainerWithSpacing} spacing={1.5}>
              <Grid item>
                <Checkbox
                  checked={bleedOffEnabled}
                  onChange={(e) => setBleedOffEnabled((e.target as HTMLInputElement).checked)}
                  size='large'
                  color='secondary'
                />
              </Grid>
              <Grid item className={classes.flexItem}>
                <Typography variant='h6' fontWeight='bold'>
                  {translate('RestartServersModal.BleedOffEnabled')}
                </Typography>
                <Typography variant='body2' className={classes.bodyText}>
                  {translate('RestartServersModal.BleedOffEnabledDescription')}
                </Typography>
                <div className={classes.timeLabel}>
                  <Typography variant='body2' className={classes.bodyText2}>
                    {translate('RestartServersModal.BleedOffTimeLabel', {
                      min: VALIDATION_CONSTANTS.BLEED_OFF_MIN_MINUTES.toString(),
                      max: bleedOffMaxMinutes.toString(),
                    })}
                  </Typography>
                </div>
                <Grid container direction='column' spacing={0}>
                  <Grid item>
                    <TextField
                      type='text'
                      value={bleedOffMinutes}
                      onChange={(e) => handleBleedOffMinutesChange(e.target.value)}
                      placeholder='10'
                      disabled={!bleedOffEnabled}
                      className={classes.textField}
                      label={undefined}
                      id=''
                      error={bleedOffEnabled && !isBleedOffValid}
                      helperText={
                        bleedOffEnabled && !isBleedOffValid
                          ? translate('Modal.bleedOffEnabled', {
                              min: VALIDATION_CONSTANTS.BLEED_OFF_MIN_MINUTES.toString(),
                              max: bleedOffMaxMinutes.toString(),
                            })
                          : ''
                      }
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <div className={classes.impactSection}>
          <Typography variant='h6' className={classes.impactTitle}>
            {translate('RestartServersModal.ImpactTitle')}
          </Typography>
          {impactData.warning && (
            <Alert severity='warning' variant='standard' style={{ marginTop: 12 }}>
              {impactData.warning}
            </Alert>
          )}
        </div>
        <Grid container spacing={2}>
          <Grid item XSmall={4}>
            <Card variant='outlined' className={classes.impactCard}>
              <Typography variant='smallLabel2'>
                {translate('RestartServersModal.PlacesToRestart')}
              </Typography>
              <Typography variant='h5' className={classes.impactValue}>
                {getPlacesImpactedDisplay()}
              </Typography>
            </Card>
          </Grid>
          <Grid item XSmall={4}>
            <Card variant='outlined' className={classes.impactCard}>
              <Typography variant='smallLabel2'>
                {translate('RestartServersModal.ServersToShutDown')}
              </Typography>
              <Typography variant='h5' className={classes.impactValue}>
                {getServersImpactedDisplay()}
              </Typography>
            </Card>
          </Grid>
          <Grid item XSmall={4}>
            <Card variant='outlined' className={classes.impactCard}>
              <Typography variant='smallLabel2'>
                {translate('RestartServersModal.PlayersToMigrate')}
              </Typography>
              <Typography variant='h5' className={classes.impactValue}>
                {getPlayersImpactedDisplay()}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        <Button variant='contained' color='secondary' onClick={onClose}>
          {translate('Button.Cancel')}
        </Button>
        <Button
          variant='contained'
          color='primaryBrand'
          disabled={!canConfirm}
          onClick={() => {
            onConfirm({
              restartOutdatedOnly,
              bleedOffMinutes: bleedOffEnabled && bleedOffMinutes ? bleedOffMinutes : undefined,
            });
          }}>
          {translate('Button.Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestartServersModal;
