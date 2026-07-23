import React, { FunctionComponent, useEffect, useState } from 'react';
import { Typography, Skeleton } from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { FormattedText } from '@modules/analytics-translations';
import { dateTimeFormatter } from '@rbx/core';

export interface ItemCardScheduledSaleProps {
  startDate: Date | null;
  endDate: Date | null;
  isLoading: boolean;
}

const ItemCardScheduledSale: FunctionComponent<
  React.PropsWithChildren<ItemCardScheduledSaleProps>
> = ({ startDate, endDate, isLoading }) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const [scheduledSaleText, setScheduledSaleText] = useState<string | null>(null);

  const formatShortDateWithoutYear = (dateLocale: Locale, timestamp: Date): FormattedText => {
    return dateTimeFormatter(dateLocale).getCustomDateTime(timestamp, {
      month: '2-digit',
      day: '2-digit',
    }) as FormattedText;
  };

  useEffect(() => {
    if (startDate !== null) {
      setScheduledSaleText(
        `${translate('Label.OnSaleOn')} ${formatShortDateWithoutYear(locale ?? Locale.English, startDate)}`,
      );
    } else if (endDate !== null) {
      setScheduledSaleText(
        `${translate('Label.OffSaleOn')} ${formatShortDateWithoutYear(locale ?? Locale.English, endDate)}`,
      );
    }
  }, [startDate, endDate, translate, locale]);

  return (
    <Typography variant='body2' color='secondary' noWrap>
      {isLoading ? <Skeleton /> : scheduledSaleText}
    </Typography>
  );
};

export default ItemCardScheduledSale;
