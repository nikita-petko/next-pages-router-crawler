import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { RobloxItemConfigurationApiCollectiblesMetadataResponse } from '@rbx/client-itemconfiguration/v1';
import { useTranslation } from '@rbx/intl';
import {
  TextField,
  Typography,
  Grid,
  Divider,
  useTheme,
  Button,
  DateTimePicker,
  useSnackbar,
  InfoOutlinedIcon,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  PickersUtilsProvider,
} from '@rbx/ui';

interface ScheduleReleaseDialogProps {
  collectiblesMetadata: RobloxItemConfigurationApiCollectiblesMetadataResponse | undefined;
  showScheduleReleaseDialog: boolean;
  setShowScheduleReleaseDialog: (show: boolean) => void;
  setStartDate: (startDate: Date | null) => void;
  setEndDate: (endDate: Date | null) => void;
  startDate: Date | null;
  endDate: Date | null;
  setIsOnSale: (isOnSale: boolean) => void;
  isOnSale: boolean;
  isCollectible: boolean;
}

const SCHEDULE_RELEASE_CACHE_KEY = 'creatorHub.scheduleRelease.lastDates';

interface CachedScheduleDates {
  startDate: string | null;
  endDate: string | null;
}

const parseTimeSpan = (timeSpan: string): number => {
  const [seconds, minutes, hours, days] = timeSpan.split(/[:.]/).toReversed().map(Number);
  return ((((days || 0) * 24 + (hours || 0)) * 60 + (minutes || 0)) * 60 + (seconds || 0)) * 1000;
};

function getCachedScheduleDates(): CachedScheduleDates | null {
  try {
    const raw =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(SCHEDULE_RELEASE_CACHE_KEY)
        : null;
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CachedScheduleDates;
    return parsed;
  } catch {
    return null;
  }
}

function setCachedScheduleDates(startDate: Date | null, endDate: Date | null): void {
  try {
    const value: CachedScheduleDates = {
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
    };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SCHEDULE_RELEASE_CACHE_KEY, JSON.stringify(value));
    }
  } catch {
    // ignore
  }
}

// If the cached date is now invalid, null initial dates
function areCachedDatesValid(
  cachedStart: Date | null,
  cachedEnd: Date | null,
  minStartDate: Date,
  maxEndDate: Date,
  minEventDuration: Date,
  maxEventDuration: Date,
): { startDate: Date | null; endDate: Date | null } | null {
  const minDurationMs = minEventDuration.getTime();
  const maxDurationMs = maxEventDuration.getTime();
  const maxEndTime = maxEndDate.getTime();

  const startValid =
    cachedStart === null ||
    (cachedStart.getTime() >= minStartDate.getTime() && cachedStart.getTime() <= maxEndTime);
  if (!startValid && cachedStart !== null) {
    return null;
  }

  const effectiveMinEnd = cachedStart
    ? cachedStart.getTime() + minDurationMs
    : minStartDate.getTime();
  const endValid =
    cachedEnd === null ||
    (cachedEnd.getTime() >= effectiveMinEnd &&
      cachedEnd.getTime() <= maxEndTime &&
      (cachedStart === null || cachedEnd.getTime() - cachedStart.getTime() <= maxDurationMs));
  if (cachedEnd !== null && !endValid) {
    return null;
  }

  if (cachedStart !== null && cachedEnd !== null) {
    const duration = cachedEnd.getTime() - cachedStart.getTime();
    if (duration < minDurationMs) {
      return null;
    }
  }

  return { startDate: cachedStart, endDate: cachedEnd };
}

function ScheduleReleaseDialog({
  collectiblesMetadata,
  showScheduleReleaseDialog,
  setShowScheduleReleaseDialog,
  setStartDate,
  setEndDate,
  startDate,
  endDate,
  setIsOnSale,
  isOnSale,
  isCollectible,
}: ScheduleReleaseDialogProps) {
  const { translate } = useTranslation();
  const theme = useTheme();
  const minStartDate = useMemo(() => new Date(Date.now()), []);

  const maxEventDuration = useMemo(() => {
    return new Date(
      parseTimeSpan(
        collectiblesMetadata?.scheduledPublishingSettings
          ?.scheduledPublishMaxTimeInAdvanceTimeSpan ?? '30.00:00:00',
      ),
    );
  }, [collectiblesMetadata?.scheduledPublishingSettings?.scheduledPublishMaxTimeInAdvanceTimeSpan]);
  const maxEndDate = useMemo(
    () => new Date(minStartDate.getTime() + maxEventDuration.getTime()),
    [minStartDate, maxEventDuration],
  );
  const minEventDuration = useMemo(() => {
    return new Date(
      parseTimeSpan(
        collectiblesMetadata?.scheduledPublishingSettings?.scheduledPublishMinDurationTimeSpan ??
          '0.00:01:00',
      ),
    );
  }, [collectiblesMetadata?.scheduledPublishingSettings?.scheduledPublishMinDurationTimeSpan]);

  // Used to display the user's input before actually storing it in startDate and endDate
  const [displayStartDate, setDisplayStartDate] = useState<Date | null>(startDate);
  const [displayEndDate, setDisplayEndDate] = useState<Date | null>(endDate);

  const { enqueue } = useSnackbar();

  useEffect(() => {
    // Used to ensure the most up-to-date values are displayed in the date/time pickers when the dialog is opened
    if (!showScheduleReleaseDialog) {
      setDisplayStartDate(null);
      setDisplayEndDate(null);
      return;
    }

    setDisplayStartDate(startDate);
    setDisplayEndDate(endDate);
    if (startDate !== null || endDate !== null) {
      return;
    }

    const cached = getCachedScheduleDates();
    if (!cached || (cached.startDate === null && cached.endDate === null)) {
      return;
    }
    const cachedStart = cached.startDate ? new Date(cached.startDate) : null;
    const cachedEnd = cached.endDate ? new Date(cached.endDate) : null;
    if (cachedStart?.toString() === 'Invalid Date' || cachedEnd?.toString() === 'Invalid Date') {
      return;
    }

    const valid = areCachedDatesValid(
      isOnSale ? null : cachedStart,
      cachedStart || isOnSale ? cachedEnd : null,
      minStartDate,
      maxEndDate,
      minEventDuration,
      maxEventDuration,
    );
    if (valid?.startDate != null) {
      setDisplayStartDate(valid.startDate);
    }
    if (valid?.endDate != null) {
      setDisplayEndDate(valid.endDate);
    }
  }, [
    showScheduleReleaseDialog,
    startDate,
    endDate,
    isOnSale,
    minStartDate,
    maxEndDate,
    minEventDuration,
    maxEventDuration,
  ]);

  const showSuccessToast = useCallback(() => {
    enqueue(
      {
        message: <span data-testid='success-message'>Scheduled Sale Set</span>,
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue]);

  const onClickReset = useCallback(async () => {
    setDisplayStartDate(null);
    setDisplayEndDate(null);
  }, [setDisplayStartDate, setDisplayEndDate]);

  const minEndTime = useMemo(() => {
    return displayStartDate
      ? new Date(displayStartDate.getTime() + minEventDuration.getTime())
      : minStartDate;
  }, [displayStartDate, minEventDuration, minStartDate]);

  const startTimeHelperText = useMemo(() => {
    if (!displayStartDate) {
      if (!isOnSale) {
        return translate('Tooltip.InvalidEventStartTime');
      }
    }
    if (displayStartDate && (displayStartDate < minStartDate || displayStartDate > maxEndDate)) {
      return translate('Tooltip.InvalidEventStartTime');
    }
    return;
  }, [displayStartDate, isOnSale, minStartDate, maxEndDate, translate]);

  const endTimeHelperText = useMemo(() => {
    if (!displayEndDate) {
      return;
    }

    if (displayStartDate) {
      if (
        displayStartDate &&
        displayEndDate.getTime() - displayStartDate.getTime() < minEventDuration.getTime()
      ) {
        return translate('Error.EEDurationTooShort', {
          duration: `${minEventDuration.getMinutes()}`,
        });
      }
      if (displayEndDate.getTime() - displayStartDate.getTime() > maxEventDuration.getTime()) {
        return translate('Error.EEDurationTooLong', {
          duration: `${maxEventDuration.getMinutes()}`,
        });
      }
    }

    if (displayEndDate < minEndTime || displayEndDate > maxEndDate) {
      return translate('Tooltip.InvalidEventEndTime');
    }
    return;
  }, [
    displayEndDate,
    displayStartDate,
    minEventDuration,
    maxEventDuration,
    maxEndDate,
    minEndTime,
    translate,
  ]);

  const handleSaveChanges = useCallback(async () => {
    // If scheduled successfully with no errors
    if (
      (displayStartDate !== null || displayEndDate !== null) &&
      startTimeHelperText === undefined &&
      endTimeHelperText === undefined
    ) {
      setStartDate(displayStartDate);
      setEndDate(displayEndDate);
      setCachedScheduleDates(displayStartDate, displayEndDate);
      setShowScheduleReleaseDialog(false);
      // Ensure the toggle is in the correct state
      if (displayStartDate !== null) {
        setIsOnSale(false);
      } else if (displayEndDate !== null) {
        setIsOnSale(true);
      }
      showSuccessToast();
    }
  }, [
    displayEndDate,
    displayStartDate,
    endTimeHelperText,
    startTimeHelperText,
    setIsOnSale,
    setShowScheduleReleaseDialog,
    showSuccessToast,
    setStartDate,
    setEndDate,
  ]);

  return (
    <Dialog onClose={() => setShowScheduleReleaseDialog(false)} open={showScheduleReleaseDialog}>
      <DialogContent style={{ width: '100%' }}>
        <PickersUtilsProvider>
          <div
            style={{
              padding: '0 10px 10px 10px',
              color: theme.palette.mode === 'light' ? 'black' : 'white',
            }}>
            <div style={{ textAlign: 'left' }}>
              <Grid container alignItems='left'>
                <Typography style={{ fontSize: '20px', fontWeight: '450' }}>
                  {translate('Label.ScheduleSale')}
                </Typography>
                <Typography style={{ fontSize: '16px', marginTop: '10px', color: 'GrayText' }}>
                  {translate('Message.ScheduleSaleDialogInfo')}
                </Typography>
              </Grid>
            </div>
            <Divider style={{ margin: '24px 0' }} />
            <Grid container>
              <Grid container direction='column'>
                <Grid item style={{ display: 'flex', alignItems: 'center' }}>
                  <Typography>
                    {isOnSale && isCollectible
                      ? translate('Label.SaleStartAlreadyOnSale')
                      : translate('Label.SaleStart')}
                  </Typography>
                  {isOnSale && (
                    <Tooltip
                      title={translate(
                        isCollectible ? 'Message.AlreadyOnSale' : 'Message.PublishImmediately',
                      )}
                      placement='right'
                      style={{ marginLeft: '5px' }}>
                      <InfoOutlinedIcon />
                    </Tooltip>
                  )}
                </Grid>
                <Grid item marginTop='12px'>
                  <DateTimePicker
                    key={`start-time-picker-${startTimeHelperText}`} // Force re-render when startTimeHelperText changes
                    minDate={minStartDate}
                    maxDate={maxEndDate}
                    onChange={setDisplayStartDate}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required={!isOnSale}
                        variant='outlined'
                        fullWidth
                        id='startTime'
                        label={translate('Label.StartTime')}
                        aria-label={translate('Label.StartTime')}
                        error={!!startTimeHelperText}
                        helperText={startTimeHelperText}
                      />
                    )}
                    value={displayStartDate}
                    disabled={isOnSale && isCollectible}
                  />
                </Grid>
              </Grid>
              <Grid container direction='column' marginTop='24px'>
                <Grid item>
                  <Typography>
                    {isOnSale && isCollectible
                      ? translate('Label.SaleEnd')
                      : translate('Label.SaleEndOptional')}
                  </Typography>
                </Grid>
                <Grid item marginTop='12px'>
                  <DateTimePicker
                    key={`end-time-picker-${endTimeHelperText}`} // Force re-render when endTimeHelperText changes
                    minDate={minEndTime}
                    maxDate={maxEndDate}
                    onChange={setDisplayEndDate}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required={isOnSale}
                        fullWidth
                        variant='outlined'
                        label={translate('Label.EndTime')}
                        id='endTime'
                        aria-label={translate('Label.EndTime')}
                        error={!!endTimeHelperText}
                        helperText={endTimeHelperText}
                      />
                    )}
                    disabled={!isOnSale && displayStartDate === null}
                    value={displayEndDate}
                  />
                </Grid>
              </Grid>
            </Grid>
          </div>
        </PickersUtilsProvider>
      </DialogContent>
      <DialogActions>
        <div style={{ flexGrow: 1 }}>
          <Button size='large' onClick={onClickReset} style={{ color: 'inherit' }}>
            {translate('Action.Reset')}
          </Button>
        </div>
        <Button
          variant='contained'
          size='large'
          color='secondary'
          onClick={() => {
            setShowScheduleReleaseDialog(false);
            onClickReset();
          }}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          variant='contained'
          size='large'
          color='primaryBrand'
          onClick={handleSaveChanges}
          disabled={!!startTimeHelperText || !!endTimeHelperText}>
          {translate('Action.SetDate')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ScheduleReleaseDialog;
