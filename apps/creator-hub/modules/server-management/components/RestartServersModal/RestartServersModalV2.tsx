import { FunctionComponent, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@rbx/ui';
import { Checkbox, Button, TextInput, TextArea } from '@rbx/foundation-ui';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useTranslation } from '@rbx/intl';
import { useSettings } from '@modules/settings';
import type { ForecastRestartResponse } from '@rbx/clients/serverManagementService';
import useServerManagementV2 from '../../hooks/useServerManagementV2';
import styles from './RestartServersModalV2.module.css';
import type { ImpactValues } from '../../types/PlaceSummary';
import {
  VALIDATION_CONSTANTS,
  POLLING_CONSTANTS,
  DISPLAY_CONSTANTS,
  DEFAULT_VALUES,
  DOCUMENTATION_CONSTANTS,
} from '../../constants';
import { calculateImpactV2 } from '../../utils/ImpactCalculation';
import isNumericString from '../../utils/isNumericString';
import RestartServersImpactCard from './RestartServersImpactCard';

type RestartServersOptions = {
  restartOutdatedOnly: boolean;
  bleedOffMinutes?: string;
  customPayload?: string;
};

type BaseRestartProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (options: RestartServersOptions) => void;
  onForecastUpdateFailure?: () => void;
};

type SinglePlace = {
  placeId: number;
  selectedPlaces?: never;
};

type MultiPlace = {
  selectedPlaces: number[];
  placeId?: never;
};

export type RestartServersModalProps = BaseRestartProps & (SinglePlace | MultiPlace);

type ImpactData = {
  placesImpacted: number;
  serversImpacted: number;
  playersImpacted: number;
  isLoading: boolean;
  error?: string;
  warning?: string;
};

const NON_DIGIT_REGEX = /[^0-9]/g;
const LEADING_ZEROES_REGEX = /^0+/;

const RestartServersModalV2: FunctionComponent<RestartServersModalProps> = ({
  open,
  onClose,
  selectedPlaces,
  placeId,
  onConfirm,
  onForecastUpdateFailure,
}) => {
  const { gameDetails } = useCurrentGame();
  const { handleForecastRestart } = useServerManagementV2();
  const { translate, translateHTML } = useTranslation();
  const { settings } = useSettings();

  const multiPlaceEnvironment = useMemo(() => placeId === undefined, [placeId]);
  const effectivePlaces = useMemo(
    () => (multiPlaceEnvironment ? (selectedPlaces ?? []) : [placeId ?? DEFAULT_VALUES.PLACE_ID]),
    [placeId, selectedPlaces, multiPlaceEnvironment],
  );

  const [impactData, setImpactData] = useState<ImpactData>({
    placesImpacted: effectivePlaces.length,
    serversImpacted: 0,
    playersImpacted: 0,
    isLoading: false,
    warning: undefined,
  });

  const [restartOptions, setRestartOptions] = useState({
    restartOutdatedOnly: multiPlaceEnvironment,
    bleedOffEnabled: false,
    customPayloadEnabled: false,
    bleedOffMinutes: '10',
    customPayload: '',
  });
  const [apiResponse, setApiResponse] = useState<ForecastRestartResponse | null>(null);
  const [previousImpactValues, setPreviousImpactValues] = useState<ImpactValues | null>(null);

  const handleBleedOffMinutesChange = (value: string) => {
    const integerOnly = value.replace(NON_DIGIT_REGEX, '');
    const cleanValue = integerOnly.replace(LEADING_ZEROES_REGEX, '') ?? '';
    setRestartOptions((prev) => ({ ...prev, bleedOffMinutes: cleanValue }));
  };

  const recalculateImpactData = useCallback(() => {
    if (!apiResponse) return;

    const result = calculateImpactV2({
      apiResponse,
      selectedPlaces: effectivePlaces,
      restartOutdatedOnly: restartOptions.restartOutdatedOnly,
      translate,
    });

    setImpactData((prev) => ({
      ...prev,
      ...result,
      isLoading: false,
    }));
  }, [apiResponse, effectivePlaces, restartOptions.restartOutdatedOnly, translate]);

  const bleedOffMaxMinutes = settings.serverManagementIncreaseRestartDelay
    ? VALIDATION_CONSTANTS.BLEED_OFF_MAX_MINUTES
    : VALIDATION_CONSTANTS.BLEED_OFF_MAX_MINUTES_D;
  const isBleedOffValid =
    !restartOptions.bleedOffEnabled ||
    (restartOptions.bleedOffMinutes &&
      isNumericString(restartOptions.bleedOffMinutes) &&
      Number(restartOptions.bleedOffMinutes) >= VALIDATION_CONSTANTS.BLEED_OFF_MIN_MINUTES &&
      Number(restartOptions.bleedOffMinutes) <= bleedOffMaxMinutes);
  const canConfirm = isBleedOffValid && impactData.serversImpacted > 0 && !impactData.error;

  const isPayloadValid = (() => {
    if (!restartOptions.customPayloadEnabled || !restartOptions.customPayload) return true;
    try {
      JSON.parse(restartOptions.customPayload);
      return true;
    } catch {
      return false;
    }
  })();

  const placesImpactedDisplay = impactData.error
    ? DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER
    : impactData.placesImpacted;

  const serversImpactedDisplay = impactData.error
    ? DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER
    : impactData.serversImpacted.toLocaleString();

  const playersImpactedDisplay = (() => {
    if (impactData.error) return DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER;

    const { playersImpacted } = impactData;
    const threshold = VALIDATION_CONSTANTS.PLAYER_COUNT_THRESHOLD_FOR_K_FORMAT;

    return playersImpacted >= threshold
      ? `${Math.round(playersImpacted / threshold)}k`
      : playersImpacted;
  })();

  useEffect(() => {
    if (open) {
      setRestartOptions({
        restartOutdatedOnly: multiPlaceEnvironment,
        bleedOffEnabled: false,
        customPayloadEnabled: false,
        bleedOffMinutes: '10',
        customPayload: '',
      });
      setApiResponse(null);
      setPreviousImpactValues(null);
      setImpactData((prev) => ({
        ...prev,
        placesImpacted: effectivePlaces.length,
        serversImpacted: 0,
        playersImpacted: 0,
        isLoading: false,
      }));
    }
  }, [open, multiPlaceEnvironment, effectivePlaces.length]);

  const fetchImpactData = useCallback(async () => {
    if (!open || !gameDetails?.id) return;

    const isInitialFetch = !apiResponse;
    if (isInitialFetch) {
      setImpactData((prev) => ({ ...prev, isLoading: true, error: undefined }));
    }

    try {
      const response = await handleForecastRestart();

      const result = calculateImpactV2({
        apiResponse: response,
        selectedPlaces: effectivePlaces,
        restartOutdatedOnly: restartOptions.restartOutdatedOnly,
        translate,
      });

      const currentImpactValues: ImpactValues = {
        places: result.placesImpacted,
        servers: result.serversImpacted,
        players: result.playersImpacted,
        warning: result.warning,
      };

      const hasImpactValuesChanged =
        !previousImpactValues ||
        previousImpactValues.places !== result.placesImpacted ||
        previousImpactValues.servers !== result.serversImpacted ||
        previousImpactValues.players !== result.playersImpacted ||
        previousImpactValues.warning !== result.warning;

      if (hasImpactValuesChanged) {
        setPreviousImpactValues(currentImpactValues);
        setApiResponse(response);

        setImpactData((prev) => ({
          ...prev,
          ...result,
          isLoading: false,
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
    handleForecastRestart,
    effectivePlaces,
    restartOptions.restartOutdatedOnly,
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
  }, [restartOptions.restartOutdatedOnly, apiResponse, recalculateImpactData]);

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
      PaperProps={{ style: { maxWidth: 900, width: '100%' } }}>
      <DialogTitle className='padding-y-xxlarge padding-x-xxlarge'>
        <Typography variant='h4'>{translate('RestartServersModal.Title')}</Typography>
      </DialogTitle>
      <DialogContent className='padding-y-none padding-x-xxlarge'>
        <Grid container direction='column' className='flex flex-col gap-large'>
          <Grid item>
            <Typography variant='h6'>{translate('RestartServersModal.RestartOptions')}</Typography>
          </Grid>
          {multiPlaceEnvironment && (
            <Grid item>
              <Checkbox
                isChecked={restartOptions.restartOutdatedOnly}
                onCheckedChange={(checked) =>
                  setRestartOptions((prev) => {
                    return { ...prev, restartOutdatedOnly: checked === true };
                  })
                }
                label={translate('RestartServersModal.RestartOutdatedOnly')}
                hint={translate('RestartServersModal.RestartOutdatedOnlyDescription')}
                placement='Start'
                size='Large'
                color='secondary'
              />
            </Grid>
          )}
          <Grid item>
            <Grid container className='flex flex-col gap-medium'>
              <Checkbox
                isChecked={restartOptions.bleedOffEnabled}
                onCheckedChange={(checked) =>
                  setRestartOptions((prev) => {
                    return { ...prev, bleedOffEnabled: checked === true };
                  })
                }
                label={translate('RestartServersModal.BleedOffEnabled')}
                hint={translate('RestartServersModal.BleedOffEnabledDescription')}
                placement='Start'
                size='Large'
                color='secondary'
              />
              <TextInput
                label={translate('RestartServersModal.BleedOffTimeLabel', {
                  min: VALIDATION_CONSTANTS.BLEED_OFF_MIN_MINUTES.toString(),
                  max: bleedOffMaxMinutes.toString(),
                })}
                value={restartOptions.bleedOffMinutes}
                onChange={(e) => handleBleedOffMinutesChange(e.target.value)}
                placeholder='10'
                size='Medium'
                isDisabled={!restartOptions.bleedOffEnabled}
                hasError={restartOptions.bleedOffEnabled && !isBleedOffValid}
                error={
                  restartOptions.bleedOffEnabled && !isBleedOffValid
                    ? translate('Modal.bleedOffEnabled', {
                        min: VALIDATION_CONSTANTS.BLEED_OFF_MIN_MINUTES.toString(),
                        max: bleedOffMaxMinutes.toString(),
                      })
                    : ''
                }
                className={styles.tightOutline}
                style={{ paddingLeft: 36 }}
                inputContainerClassStyle={{ maxWidth: 100 }}
              />
            </Grid>
          </Grid>
          {settings.serverManagementCustomPayloadReady && (
            <Grid item>
              <Grid container className='flex flex-col gap-medium'>
                <Grid item container direction='column'>
                  <Checkbox
                    isChecked={restartOptions.customPayloadEnabled}
                    onCheckedChange={(checked) =>
                      setRestartOptions((prev) => {
                        return { ...prev, customPayloadEnabled: checked === true };
                      })
                    }
                    label={translate('RestartServersModal.CustomPayload')}
                    placement='Start'
                    size='Large'
                    color='secondary'
                  />
                  <Typography
                    variant='caption'
                    style={{ paddingLeft: 36 }}
                    className={`padding-top-xxsmall ${styles.tightOutline}`}>
                    {translateHTML('RestartServersModal.CustomPayloadDescription', [
                      {
                        opening: 'linkStart',
                        closing: 'linkEnd',
                        content(chunks) {
                          return (
                            <Link
                              href={DOCUMENTATION_CONSTANTS.SERVER_RESTART_DOCS}
                              target='_blank'
                              color='inherit'
                              underline='always'>
                              {chunks}
                            </Link>
                          );
                        },
                      },
                    ])}
                  </Typography>
                </Grid>
                <TextArea
                  value={restartOptions.customPayload}
                  onChange={(e) =>
                    setRestartOptions((prev) => ({ ...prev, customPayload: e.target.value }))
                  }
                  placeholder='{"message": "Servers will restart at the end of the round for an update", "timing": "END_OF_ROUND"}'
                  size='Medium'
                  rows={4}
                  isDisabled={!restartOptions.customPayloadEnabled}
                  hasError={!isPayloadValid} // TODO: Add error message - need to know wording based on Server Restart implementation
                  style={{ paddingLeft: 36 }}
                  textareaStyle={{ maxWidth: 600 }}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
        <div className='margin-top-medium margin-bottom-small'>
          <Typography variant='h6' className='margin-top-small'>
            {translate('RestartServersModal.ImpactTitle')}
          </Typography>
          {impactData.warning && (
            <Alert severity='warning' variant='standard' className='margin-top-small'>
              {impactData.warning}
            </Alert>
          )}
        </div>
        <Grid container className='flex gap-medium'>
          {multiPlaceEnvironment && (
            <RestartServersImpactCard
              label={translate('RestartServersModal.PlacesToRestart')}
              value={placesImpactedDisplay.toString()}
            />
          )}
          <RestartServersImpactCard
            label={translate('RestartServersModal.ServersToShutDown')}
            value={serversImpactedDisplay}
          />
          <RestartServersImpactCard
            label={translate('RestartServersModal.PlayersToMigrate')}
            value={playersImpactedDisplay.toString()}
          />
        </Grid>
      </DialogContent>
      <DialogActions className='flex gap-small justify-end'>
        <Button variant='Standard' onClick={onClose}>
          {translate('Button.Cancel')}
        </Button>
        <Button
          variant='Emphasis'
          isDisabled={!canConfirm}
          onClick={() => {
            onConfirm({
              restartOutdatedOnly: restartOptions.restartOutdatedOnly,
              bleedOffMinutes:
                restartOptions.bleedOffEnabled && restartOptions.bleedOffMinutes
                  ? restartOptions.bleedOffMinutes
                  : undefined,
              customPayload:
                restartOptions.customPayloadEnabled && restartOptions.customPayload
                  ? restartOptions.customPayload
                  : undefined,
            });
          }}>
          {translate('Button.Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestartServersModalV2;
