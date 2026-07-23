import type { FunctionComponent } from 'react';
import React from 'react';
import { dateTimeFormatter } from '@rbx/core';
import { Locale } from '@rbx/intl';
import { Typography, makeStyles } from '@rbx/ui';

const formatDate = (date: string | Date, locale: Locale): string => {
  const parsedDate: Date = typeof date === 'string' ? new Date(date) : date;
  return dateTimeFormatter(locale).getCustomDateTime(parsedDate, {
    dateStyle: 'medium',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};

function isSameDay(start: Date, end: Date) {
  return (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  );
}

function formatTime(date: string | Date, locale: Locale): string {
  const parsedDate: Date = typeof date === 'string' ? new Date(date) : date;
  return dateTimeFormatter(locale)
    .getCustomDateTime(parsedDate, {
      timeStyle: 'short',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    .replace(':00', '')
    .replace(/\s+am/i, 'AM')
    .replace(/\s+pm/i, 'PM');
}

const formatDateRange = (start: string | Date, end: string | Date, locale: Locale): string => {
  const parsedStartDate: Date = typeof start === 'string' ? new Date(start) : start;
  const parsedEndDate: Date = typeof end === 'string' ? new Date(end) : end;
  const startDateString = formatDate(parsedStartDate, locale);
  if (isSameDay(parsedStartDate, parsedEndDate)) {
    return `${formatTime(parsedStartDate, locale)} - ${formatTime(parsedEndDate, locale)} ${startDateString}`;
  }
  return `${formatDate(parsedStartDate, locale)} ${formatTime(parsedStartDate, locale)} - ${startDateString} ${formatTime(parsedEndDate, locale)}`;
};

type TTileTimestampProps = {
  authoredUtcTime?: string;
  range?: [string, string];
  locale: Locale | null;
};

const useStyles = makeStyles()(() => ({
  date: {
    textTransform: 'uppercase',
    height: 17,
    marginBottom: 0,
    marginTop: 4,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
  },
}));

const TileTimestamp: FunctionComponent<React.PropsWithChildren<TTileTimestampProps>> = ({
  authoredUtcTime,
  range,
  locale,
}) => {
  const {
    classes: { date },
  } = useStyles();
  if (range) {
    const [startedAtUtcTime, endedAtUtcTime] = range;
    return (
      <Typography classes={{ root: date }} component='div' variant='body2' color='secondary'>
        {formatDateRange(startedAtUtcTime, endedAtUtcTime, locale ?? Locale.English)}
      </Typography>
    );
  }
  return authoredUtcTime ? (
    <Typography classes={{ root: date }} component='div' variant='body2' color='secondary'>
      {formatDate(authoredUtcTime, locale ?? Locale.English)}
    </Typography>
  ) : null;
};

export default TileTimestamp;
