import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Typography,
  Grid,
  Button,
  Tooltip,
  ChevronRightIcon,
  AccessTimeIcon,
  useSnackbar,
} from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { RobloxItemConfigurationApiCollectiblesMetadataResponse } from '@rbx/client-itemconfiguration/v1';
import { formatShortDateTimeWithoutYear } from '@modules/charts-generic';
import { Toggle } from '@rbx/foundation-ui';
import ScheduleReleaseDialog from './ScheduleReleaseDialog';

interface ScheduleReleaseToggleProps {
  collectiblesMetadata: RobloxItemConfigurationApiCollectiblesMetadataResponse | undefined;
  setStartDate: (startDate: Date | null) => void;
  setEndDate: (endDate: Date | null) => void;
  startDate: Date | null;
  endDate: Date | null;
  setIsOnSale: (isOnSale: boolean) => void;
  isOnSale: boolean;
  isCollectible: boolean;
  scheduledSaleChanged: boolean;
  setScheduledSaleChanged: (scheduledSaleChanged: boolean) => void;
}

function ScheduleReleaseToggle(props: ScheduleReleaseToggleProps) {
  const {
    collectiblesMetadata,
    setStartDate,
    setEndDate,
    startDate,
    endDate,
    setIsOnSale,
    isOnSale,
    isCollectible,
    scheduledSaleChanged,
    setScheduledSaleChanged,
  } = props;

  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const { enqueue } = useSnackbar();
  const wrapperRef = useRef(null);

  // Scheduled publishing
  const [showScheduleReleaseButton, setShowScheduleReleaseButton] = useState(false);
  const [showScheduleReleaseDialog, setShowScheduleReleaseDialog] = useState(false);

  // Used for displaying the timestamp if the sale is canceled
  const [originalStartDate, setOriginalStartDate] = useState<Date | null>(null);
  const [originalEndDate, setOriginalEndDate] = useState<Date | null>(null);

  const isScheduled = useMemo(() => {
    return startDate !== null || endDate !== null;
  }, [endDate, startDate]);

  const isCancelled = useMemo(() => {
    return (originalStartDate !== null || originalEndDate !== null) && !isScheduled;
  }, [originalStartDate, originalEndDate, isScheduled]);

  useEffect(() => {
    // Reset original dates if user is setting a new scheduled sale
    if (scheduledSaleChanged && isScheduled) {
      setOriginalStartDate(null);
      setOriginalEndDate(null);
    }
  }, [scheduledSaleChanged, isScheduled]);

  const showCancelScheduledSaleSuccessToast = useCallback(() => {
    enqueue(
      {
        message: <span data-testid='success-message'>Scheduled Sale Cleared</span>,
        autoHide: true,
      },
      (reason) => reason === 'timeout',
    );
  }, [enqueue]);

  const cancelScheduledSale = useCallback(() => {
    setOriginalStartDate(startDate);
    setOriginalEndDate(endDate);
    setStartDate(null);
    setEndDate(null);
    setScheduledSaleChanged(true);
    showCancelScheduledSaleSuccessToast();
  }, [
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    setScheduledSaleChanged,
    showCancelScheduledSaleSuccessToast,
  ]);

  const scheduledTimeStamp = useCallback(() => {
    const formatDate = (date: Date | null) => {
      return date ? formatShortDateTimeWithoutYear(date, locale ?? Locale.English) : '';
    };

    const startDateDisplay =
      isCancelled && scheduledSaleChanged ? formatDate(originalStartDate) : formatDate(startDate);
    const endDateDisplay =
      isCancelled && scheduledSaleChanged ? formatDate(originalEndDate) : formatDate(endDate);
    let dateDisplay = '';
    if (startDateDisplay && endDateDisplay) {
      dateDisplay = `${startDateDisplay} - ${endDateDisplay}`;
    } else if (startDateDisplay) {
      dateDisplay = translate('Message.ScheduledStartDate', { date: startDateDisplay });
    } else if (endDateDisplay) {
      dateDisplay = translate('Message.ScheduledEndDate', { date: endDateDisplay });
    }

    return (
      <Tooltip
        title={(() => {
          if (isCancelled) {
            return translate('Message.ScheduledSaleCanceled');
          }
          if (scheduledSaleChanged) {
            return translate('Message.ScheduledSaleChanged');
          }
          return '';
        })()}
        placement='top'>
        <div>
          <Typography
            color={scheduledSaleChanged ? 'warning' : 'secondary'}
            noWrap
            style={{
              overflow: 'visible',
              textDecoration: isCancelled ? 'line-through' : 'none',
            }}>
            {dateDisplay}
          </Typography>
          {scheduledSaleChanged && (
            <Typography
              color='error'
              noWrap
              style={{ paddingLeft: '3px', fontSize: '20px', fontWeight: 'bold' }}>
              !
            </Typography>
          )}
        </div>
      </Tooltip>
    );
  }, [
    originalStartDate,
    startDate,
    originalEndDate,
    endDate,
    scheduledSaleChanged,
    isCancelled,
    locale,
    translate,
  ]);

  function useOutsideAlerter(ref: React.RefObject<HTMLDivElement | null>) {
    useEffect(() => {
      function handleClickOutside(event: { target: unknown }) {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setShowScheduleReleaseButton(false);
        }
      }
      // Bind the event listener
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        // Unbind the event listener on clean up
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [ref]);
  }
  useOutsideAlerter(wrapperRef);

  return (
    <div>
      <Grid
        container
        alignItems='center'
        sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
        <Grid item style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
          <Toggle
            label={isScheduled ? translate('Label.ScheduledSale') : translate('Label.OnSale')}
            placement='Start'
            size='Medium'
            aria-label={isScheduled ? translate('Label.ScheduledSale') : translate('Label.OnSale')}
            isChecked={isOnSale}
            onCheckedChange={() => setIsOnSale(!isOnSale)}
            isDisabled={isScheduled}
          />
          <Button
            color='primary'
            onClick={() => setShowScheduleReleaseButton(!showScheduleReleaseButton)}
            style={{ minWidth: 'auto', padding: 0 }}>
            <ChevronRightIcon style={{ transform: 'rotate(90deg)', fontSize: '25px' }} />
          </Button>
        </Grid>
        {scheduledTimeStamp()}
        <Grid
          container
          sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' }, position: 'relative' }}>
          {showScheduleReleaseButton && (
            <Button
              type='button'
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'absolute',
                zIndex: 1,
                whiteSpace: 'nowrap',
              }}
              variant='contained'
              color='secondary'
              onClick={() => {
                if (isScheduled) {
                  cancelScheduledSale();
                } else {
                  setShowScheduleReleaseDialog(true);
                }
                setShowScheduleReleaseButton(false);
              }}
              ref={wrapperRef}>
              {!isScheduled && <AccessTimeIcon color='secondary' />}
              <Typography
                variant='body2'
                color={isScheduled ? 'error' : 'secondary'}
                style={{ marginLeft: '5px' }}
                noWrap>
                {translate(isScheduled ? 'Label.CancelScheduledSale' : 'Label.ScheduleSale')}
              </Typography>
            </Button>
          )}
        </Grid>
      </Grid>
      <ScheduleReleaseDialog
        collectiblesMetadata={collectiblesMetadata}
        showScheduleReleaseDialog={showScheduleReleaseDialog}
        setShowScheduleReleaseDialog={setShowScheduleReleaseDialog}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        startDate={startDate}
        endDate={endDate}
        setIsOnSale={setIsOnSale}
        isOnSale={isOnSale}
        isCollectible={isCollectible}
      />
    </div>
  );
}

export default ScheduleReleaseToggle;
