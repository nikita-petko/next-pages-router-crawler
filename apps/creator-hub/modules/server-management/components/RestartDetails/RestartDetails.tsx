import React from 'react';
import { Typography, Card } from '@rbx/ui';
import { GameUpdateStatus } from '@rbx/clients/matchmakingApi/v1';
import { useTranslation, Locale, useLocalization } from '@rbx/intl';
import useRestartDetailsStyles from './RestartDetails.styles';
import UpdatePhase from '../../enums/UpdatePhase';
import { DISPLAY_CONSTANTS } from '../../constants';

type RestartDetailsProps = {
  update: GameUpdateStatus;
  className?: string;
};

const RestartDetails: React.FC<RestartDetailsProps> = ({ update, className }) => {
  const { classes } = useRestartDetailsStyles();
  const { card, title, detailsContainer, detailRow, divider } = classes;
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const placeStatuses = Object.values(update.placeUpdateStatuses || {});

  const getRestartScope = () => {
    return update.closeOldVersionsOnly
      ? translate('SelectablePlacesTable.Column.ServersToClose')
      : translate('RestartDetails.TotalServers');
  };

  const getServersToShutDown = () => {
    const totalServers = placeStatuses.reduce((sum, status) => {
      return sum + (status.startInstancesToBeClosed || 0);
    }, 0);

    return Intl.NumberFormat(locale ?? Locale.English, {}).format(totalServers);
  };

  const getPlayersToMigrate = () => {
    const totalPlayers = placeStatuses.reduce((sum, status) => {
      return sum + (status.startPlayersToBeKicked || 0);
    }, 0);

    return Intl.NumberFormat(locale ?? Locale.English, {}).format(totalPlayers);
  };

  const shouldShowDelayTime = () => {
    return update.bleedOffServers;
  };

  const getDelayTime = () => {
    if (!update.bleedOffEndTime || !update.startTime) {
      return translate('RestartDetails.DelayTime');
    }

    const startTime = new Date(update.startTime).getTime();
    const bleedOffEndTime = new Date(update.bleedOffEndTime).getTime();
    const delayMs = bleedOffEndTime - startTime;

    const totalSeconds = Math.floor(delayMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

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
    const allPlacesDone = placeStatuses.every((status) => status.phase === UpdatePhase.Done);
    if (!allPlacesDone) {
      return DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER;
    }

    const completedPlaces = placeStatuses.filter((status) => status.phase === UpdatePhase.Done);
    if (completedPlaces.length === 0) {
      return DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER;
    }

    const lastCompletedPlace = completedPlaces.reduce((latest, current) => {
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

  const details = [
    { label: translate('RestartDetails.RestartScope'), value: getRestartScope() },
    { label: translate('RestartDetails.ServersToShutDown'), value: getServersToShutDown() },
    { label: translate('RestartDetails.PlayersToMigrate'), value: getPlayersToMigrate() },
    ...(shouldShowDelayTime()
      ? [{ label: translate('RestartDetails.DelayTimeSet'), value: getDelayTime() }]
      : []),
    { label: translate('RestartDetails.TotalDurationLabel'), value: getTotalDuration() },
  ];

  return (
    <Card variant='outlined' className={`${card} ${className || ''}`}>
      <Typography variant='h6' component='h6' className={title}>
        {translate('RestartDetails.Title')}
      </Typography>
      <div className={detailsContainer}>
        {details.map((detail, index) => (
          <div key={detail.label} className={detailRow}>
            <Typography variant='body2'>{detail.label}</Typography>
            <Typography variant='body2'>{detail.value}</Typography>
            {index < details.length - 1 && <div className={divider} />}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RestartDetails;
