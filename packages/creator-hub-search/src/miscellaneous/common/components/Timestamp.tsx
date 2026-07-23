import type { FunctionComponent } from 'react';
import React from 'react';
import { dateTimeFormatter } from '@rbx/core';
import { Locale } from '@rbx/intl';
// NOTE (neoxu, 2025-09-25): based on TileTimestamp](https://github.rbx.com/Roblox/creator-hub/blob/4386a9716509e8499c1049efa8a192a55fe4cdf6/packages/knowledge-feed/src/components/Tile/TileTimestamp.tsx)
import { Typography, makeStyles } from '@rbx/ui';

const formatDate = (date: string | Date, locale: Locale): string => {
  const parsedDate: Date = typeof date === 'string' ? new Date(date) : date;
  return dateTimeFormatter(locale).getCustomDateTime(parsedDate, {
    dateStyle: 'medium',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};

type TTimestampProps = {
  utcTime?: string;
  locale: Locale;
  fallbackText?: string;
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

const Timestamp: FunctionComponent<React.PropsWithChildren<TTimestampProps>> = ({
  utcTime,
  locale,
  fallbackText,
}) => {
  const {
    classes: { date },
  } = useStyles();
  return utcTime ? (
    <Typography classes={{ root: date }} component='div' variant='body2' color='secondary'>
      {formatDate(utcTime, locale ?? Locale.English)}
    </Typography>
  ) : (
    (fallbackText ?? null)
  );
};

export default Timestamp;
