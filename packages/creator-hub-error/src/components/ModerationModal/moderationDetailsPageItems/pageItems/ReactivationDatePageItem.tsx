import React, { useCallback, useMemo } from 'react';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import useModerationModalStyles from '../../ModerationModal.styles';

type TReactivationDateProps = {
  endDate?: Date;
  punishmentTypeDescription?: string;
};

/**
 * Ban description. Shown to banned users
 */
const ReactivationDatePageItem: React.FC<TReactivationDateProps> = ({
  endDate,
  punishmentTypeDescription,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { locale } = useLocalization();
  const {
    classes: { boldText },
  } = useModerationModalStyles();

  const dateFormatter = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatter.format;
  }, [locale]);

  const makeReactivationDateContent = useCallback(() => {
    return (
      <Typography variant='body2' className={boldText}>
        {dateFormatter(endDate)}
      </Typography>
    );
  }, [dateFormatter, endDate, boldText]);

  if (!punishmentTypeDescription?.startsWith('Ban')) {
    return null;
  }

  return (
    <Grid container direction='column' rowGap='8px' data-testid='reactivation-date'>
      <Typography variant='h6'>{translate('Label.ReactivationDate')}</Typography>
      <div>
        {translateHTML('Description.Reactivate', [
          {
            opening: 'dateStart',
            closing: 'dateEnd',
            content: makeReactivationDateContent,
          },
        ])}
      </div>
    </Grid>
  );
};

export default ReactivationDatePageItem;
