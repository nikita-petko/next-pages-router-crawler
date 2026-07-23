import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';

export type TItemMetaCreatedDateProps = {
  time: Date;
};

const ItemMetaCreatedDate: FunctionComponent<React.PropsWithChildren<TItemMetaCreatedDateProps>> = (
  props,
) => {
  const { time } = props;
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const dateFormatter = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      dateStyle: 'medium',
    });
    return formatter.format;
  }, [locale]);
  return (
    <Typography variant='body2' color='secondary'>
      {`${translate('Label.Created')} ${dateFormatter(time)}`}
    </Typography>
  );
};

export default ItemMetaCreatedDate;
