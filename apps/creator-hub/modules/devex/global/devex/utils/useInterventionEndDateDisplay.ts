import { useEffect, useMemo, useState } from 'react';
import { getFormattedDateTime } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { formatInterventionCountdown } from './formatInterventionCountdown';

const INTERVENTION_COUNTDOWN_POLL_INTERVAL_MS = 1000;

function toDate(value?: Date | string | null): Date | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

type UseInterventionEndDateDisplayResult = {
  formattedEndDate?: string;
  countdownText?: string;
};

function useInterventionEndDateDisplay(
  endDateValue?: Date | string | null,
): UseInterventionEndDateDisplayResult {
  const { translate } = useTranslation();
  const endDate = toDate(endDateValue);
  const endTimestamp = endDate?.getTime();
  const [now, setNow] = useState(() => Date.now());

  const formattedEndDate = useMemo(() => {
    if (endTimestamp === undefined) {
      return undefined;
    }

    return getFormattedDateTime(new Date(endTimestamp));
  }, [endTimestamp]);

  const countdownText = useMemo(() => {
    if (endTimestamp === undefined || endTimestamp <= now) {
      return undefined;
    }

    return formatInterventionCountdown(new Date(endTimestamp), translate);
  }, [endTimestamp, now, translate]);

  useEffect(() => {
    if (endTimestamp === undefined || endTimestamp <= Date.now()) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, INTERVENTION_COUNTDOWN_POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [endTimestamp]);

  return { formattedEndDate, countdownText };
}

export default useInterventionEndDateDisplay;
