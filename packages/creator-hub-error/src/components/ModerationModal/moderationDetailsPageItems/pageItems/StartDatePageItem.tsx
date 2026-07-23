import React, { useMemo } from 'react';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { HttpControllerGetNotApprovedResponseViolation } from '@rbx/client-behavior-intervention/v1';
import useModerationModalStyles from '../../ModerationModal.styles';
import isPlatformEvidenceVisibleInView from '../../../../utils/isPlatformEvidenceVisibleInView';

type TStartDateProps = {
  violation?: HttpControllerGetNotApprovedResponseViolation;
  beginDate?: Date;
};

/**
 * The time at which the consequence is issued
 */
const StartDatePageItem: React.FC<TStartDateProps> = ({ violation, beginDate }) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const {
    classes: { boldText },
  } = useModerationModalStyles();

  const dateFormatter = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    return formatter.format;
  }, [locale]);

  if (isPlatformEvidenceVisibleInView(violation)) {
    return null;
  }

  return (
    <div data-testid='start-date'>
      <Typography variant='body2'>{translate('Label.Reviewed')}: </Typography>
      <Typography variant='body2' className={boldText}>
        {dateFormatter(beginDate)}
      </Typography>
    </div>
  );
};

export default StartDatePageItem;
