import React from 'react';
import { useLocalization, useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import {
  UserRestrictionLog,
  convertTimestampToDateStringWithTime,
} from '@modules/safety-controls/utils/userBansDataUtils';
import { Flex } from '@modules/miscellaneous/common/components';
import UseBanEventStyles from './BanEvent.styles';
import {
  ONE_DAY_IN_SECONDS,
  ONE_HOUR_IN_SECONDS,
} from '@modules/safety-controls/constants/userBansConstants';

type BanEventProps = {
  isFirstBanEvent: boolean;
  userRestrictionLog: UserRestrictionLog;
  moderatorName: string;
};

const BanEvent = ({ isFirstBanEvent, userRestrictionLog, moderatorName }: BanEventProps) => {
  const {
    classes: { timelineContainer, banHistoryContentContainer, banHistoryText },
  } = UseBanEventStyles(isFirstBanEvent)();
  const { locale } = useLocalization();
  const { translate } = useTranslation();

  const banDurationSeconds =
    userRestrictionLog.duration?.seconds === undefined
      ? null
      : Number(userRestrictionLog.duration.seconds);

  let banTitle;
  if (banDurationSeconds == null) {
    banTitle = translate(userRestrictionLog.active ? 'Label.BannedPermanently' : 'Label.Unbanned');
  } else if (banDurationSeconds > ONE_DAY_IN_SECONDS) {
    const numDaysBanned = Math.floor(banDurationSeconds / ONE_DAY_IN_SECONDS);
    // TODO: For Label.BannedForXDays, add ICU Syntax Pluralization support
    banTitle = translate(numDaysBanned === 1 ? 'Label.BannedForOneDay' : 'Label.BannedForXDays', {
      daysBanned: numDaysBanned.toString(),
    });
  } else if (banDurationSeconds > ONE_HOUR_IN_SECONDS) {
    const numHoursBanned = Math.floor(banDurationSeconds / ONE_HOUR_IN_SECONDS);
    // TODO: For Label.BannedForXHours, add ICU Syntax Pluralization support
    banTitle = translate(
      numHoursBanned === 1 ? 'Label.BannedForOneHour' : 'Label.BannedForXHours',
      {
        hoursBanned: numHoursBanned.toString(),
      },
    );
  } else {
    banTitle = translate('Label.BannedForLessThanOneHour');
  }

  const textColor = isFirstBanEvent ? 'primary' : 'secondary';
  // Body of the current ban. For unbans, we show very little info. For bans, we show more.
  const banDescription = !userRestrictionLog.active ? (
    <Typography classes={{ root: banHistoryText }} color={textColor} variant='subtitle2'>
      {translate('Label.UserUnbanned')}
    </Typography>
  ) : (
    <React.Fragment>
      {!userRestrictionLog.excludeAltAccounts && (
        <Typography classes={{ root: banHistoryText }} color={textColor} variant='subtitle2'>
          {translate('Description.AltAccountsBanned')}
        </Typography>
      )}
      <Typography classes={{ root: banHistoryText }} color={textColor}>
        {translate('Description.PublicReason')} {userRestrictionLog.displayReason}
      </Typography>
      <Typography classes={{ root: banHistoryText }} color={textColor}>
        {translate('Description.PrivateReason')} {userRestrictionLog.privateReason}
      </Typography>
    </React.Fragment>
  );

  return (
    <Flex classes={{ root: banHistoryContentContainer }} flexDirection='row'>
      <div className={timelineContainer} />
      <Flex flexDirection='column'>
        <Typography
          classes={{ root: banHistoryText }}
          color={isFirstBanEvent ? 'primary' : 'secondary'}
          component='h5'
          variant='h5'>
          {banTitle}
        </Typography>
        <Typography
          classes={{ root: banHistoryText }}
          color={isFirstBanEvent ? 'primary' : 'secondary'}>
          {userRestrictionLog.createTime &&
            translate('Label.LastUpdated', {
              timestamp: convertTimestampToDateStringWithTime(
                userRestrictionLog.createTime,
                locale,
              ),
              username: moderatorName,
            })}
        </Typography>
        {banDescription}
      </Flex>
    </Flex>
  );
};

export default BanEvent;
