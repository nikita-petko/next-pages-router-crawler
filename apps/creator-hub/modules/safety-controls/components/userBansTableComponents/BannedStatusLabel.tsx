import React from 'react';
import { useTranslation } from '@rbx/intl';
import type { google } from '@rbx/open-cloud/dist/v2/protos/protos';
import { Label } from '@rbx/ui';
import {
  ONE_DAY_IN_SECONDS,
  ONE_HOUR_IN_SECONDS,
} from '@modules/safety-controls/constants/userBansConstants';
import { convertTimestampToDate } from '@modules/safety-controls/utils/userBansDataUtils';

type BannedStatusLabelProps = {
  active: boolean;
  duration: google.protobuf.IDuration | null;
  startTime: google.protobuf.ITimestamp;
};

// This component currently assumes statuses are one of: Expired, Permanent or Non-Permanent Active.
// If unbans are added, the logic will need to be updated to handle that case.
const BannedStatusLabel = ({ active, duration, startTime }: BannedStatusLabelProps) => {
  const { translate } = useTranslation();

  const expiredLabelComponent = <Label labelText={translate('Label.Expired')} severity='success' />;
  if (!active) {
    return expiredLabelComponent;
  }
  if (!duration) {
    return <Label labelText={translate('Label.Permanent')} severity='error' />;
  }

  const currentDate = new Date();
  const banExpiryDate = convertTimestampToDate(startTime);
  banExpiryDate.setSeconds(banExpiryDate.getSeconds() + Number(duration.seconds));

  const banRemainingSeconds = Math.floor((banExpiryDate.getTime() - currentDate.getTime()) / 1000);

  let banDurationRemainingLabel;
  if (banRemainingSeconds > ONE_DAY_IN_SECONDS) {
    const daysRemaining = Math.floor(banRemainingSeconds / ONE_DAY_IN_SECONDS);
    // TODO: For Label.XDaysLeft, add ICU Syntax Pluralization support
    banDurationRemainingLabel = translate(
      daysRemaining === 1 ? 'Label.OneDayLeft' : 'Label.XDaysLeft',
      {
        daysLeft: daysRemaining.toString(),
      },
    );
  } else if (banRemainingSeconds > ONE_HOUR_IN_SECONDS) {
    const hoursRemaining = Math.floor(banRemainingSeconds / ONE_HOUR_IN_SECONDS);
    // TODO: For Label.XHoursLeft, add ICU Syntax Pluralization support
    banDurationRemainingLabel = translate(
      hoursRemaining === 1 ? 'Label.OneHourLeft' : 'Label.XHoursLeft',
      {
        hoursLeft: hoursRemaining.toString(),
      },
    );
  } else if (banRemainingSeconds > 0) {
    banDurationRemainingLabel = translate('Label.LessThanOneHourLeft');
  } else {
    return expiredLabelComponent;
  }

  return <Label labelText={banDurationRemainingLabel} severity='warning' />;
};

export default BannedStatusLabel;
