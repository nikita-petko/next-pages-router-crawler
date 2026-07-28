import type { FunctionComponent } from 'react';
import type { RestartStatus } from '@rbx/client-server-management-service/v1';
import { RestartState } from '@rbx/client-server-management-service/v1';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Grid, ListItemText } from '@rbx/ui';
import { DISPLAY_CONSTANTS } from '../../constants';
import { formatStartTime } from '../../utils/RestartActivityUtils';

export interface RestartImpactDetailsProps {
  update: RestartStatus;
}

const RestartImpactDetails: FunctionComponent<RestartImpactDetailsProps> = ({ update }) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const placeStatuses = Object.values(update.placeRestartStatuses ?? {});

  const getServersToShutDown = () => {
    const totalServers = placeStatuses.reduce((sum, status) => {
      return sum + (status.totalInstances ?? 0);
    }, 0);

    return Intl.NumberFormat(locale ?? Locale.English, {}).format(totalServers);
  };

  const getPlayersToMigrate = () => {
    const totalPlayers = placeStatuses.reduce((sum, status) => {
      return sum + (status.totalPlayers ?? 0);
    }, 0);

    return Intl.NumberFormat(locale ?? Locale.English, {}).format(totalPlayers);
  };

  const getDelayTime = () => {
    if (!update.scheduledTime || !update.startTime) {
      return translate('RestartDetails.DelayTime');
    }

    const startTime = new Date(update.startTime).getTime();
    const scheduledTime = new Date(update.scheduledTime).getTime();
    const delayMs = startTime - scheduledTime;

    const totalSeconds = Math.floor(delayMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0 && seconds === 0) {
      return DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER;
    }
    if (minutes === 0) {
      if (seconds !== 1) {
        return translate('RestartDetails.DelayTimeSeconds', { seconds: seconds.toString() });
      }
      return translate('RestartDetails.DelayTimeSecond', { seconds: seconds.toString() });
    }
    if (seconds === 0) {
      if (minutes !== 1) {
        return translate('RestartDetails.DelayTimeMinutes', { minutes: minutes.toString() });
      }
      return translate('RestartDetails.DelayTimeMinute', { minutes: minutes.toString() });
    }
    // we have 4 cases left
    // minute = 1, second = 1
    // minute = 1, second != 1
    // minute != 1, second = 1
    // minute != 1, second != 1
    if (minutes === 1 && seconds === 1) {
      return translate('RestartDetails.DelayTimeMinuteSecond', {
        minutes: minutes.toString(),
        seconds: seconds.toString(),
      });
    }
    if (minutes === 1 && seconds !== 1) {
      return translate('RestartDetails.DelayTimeMinuteSeconds', {
        minutes: minutes.toString(),
        seconds: seconds.toString(),
      });
    }
    if (minutes !== 1 && seconds === 1) {
      return translate('RestartDetails.DelayTimeMinutesSecond', {
        minutes: minutes.toString(),
        seconds: seconds.toString(),
      });
    }
    // minutes !== 1 && seconds !== 1 final case
    return translate('RestartDetails.DelayTimeMinutesSeconds', {
      minutes: minutes.toString(),
      seconds: seconds.toString(),
    });
  };

  const getTotalDuration = () => {
    const allPlacesDone = placeStatuses.every((status) => status.state === RestartState.Succeeded);
    if (!allPlacesDone || placeStatuses.length === 0) {
      return DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER;
    }

    const lastCompletedPlace = placeStatuses.reduce((latest, current) => {
      const latestTime = latest.endTime ? new Date(latest.endTime).getTime() : 0;
      const currentTime = current.endTime ? new Date(current.endTime).getTime() : 0;
      return currentTime > latestTime ? current : latest;
    });

    if (!update.startTime || !lastCompletedPlace.endTime) {
      return DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER;
    }

    const startTime = new Date(update.startTime).getTime();
    const endTime = new Date(lastCompletedPlace.endTime).getTime();
    const durationMs = endTime - startTime;

    const minutes = Math.floor(durationMs / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    return translate('RestartDetails.TotalDuration', {
      minutes: minutes.toString(),
      seconds: seconds.toString(),
    });
  };

  const infoItems = [
    { label: translate('RestartDetails.ServersToShutDown'), value: getServersToShutDown() },
    { label: translate('RestartDetails.PlayersToMigrate'), value: getPlayersToMigrate() },
    {
      label: translate('RestartFilterDetails.StartTime'),
      value: formatStartTime(update.startTime, translate),
    },
    { label: translate('RestartDetails.DelayTimeSet'), value: getDelayTime() },
    { label: translate('RestartFilterDetails.TotalDuration'), value: getTotalDuration() },
  ];

  return (
    <Grid container>
      {infoItems.map(({ label, value }) => (
        <Grid item XSmall={6} key={label}>
          <ListItemText primary={label} secondary={value} />
        </Grid>
      ))}
    </Grid>
  );
};

export default RestartImpactDetails;
