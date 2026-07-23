import React, { useState, useEffect, useMemo } from 'react';
import type { RestartStatus } from '@rbx/client-server-management-service/v1';
import { RestartState } from '@rbx/client-server-management-service/v1';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation, Locale, useLocalization } from '@rbx/intl';
import { Card, Stepper, Step, StepLabel, StepContent, CircularProgress } from '@rbx/ui';
import { DISPLAY_CONSTANTS, STEP_STATE_CONSTANTS } from '../../constants';
import useRestartProgressStyles from './RestartProgress.styles';

type RestartProgressProps = {
  update: RestartStatus;
  className?: string;
};

function isRestartComplete(state: RestartState | undefined): boolean {
  return state === undefined || state === RestartState.Succeeded;
}

const RestartProgress: React.FC<RestartProgressProps> = ({ update, className }) => {
  const { classes } = useRestartProgressStyles();
  const { greyIcon, stepDescription, card, stepperContainer } = classes;
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const [currentTime, setCurrentTime] = useState(Date.now());

  const placeStatuses = useMemo(
    () => Object.values(update.placeRestartStatuses ?? {}),
    [update.placeRestartStatuses],
  );

  const bleedOffEnabled = useMemo(() => {
    return (
      !!update.scheduledTime &&
      !!update.startTime &&
      new Date(update.scheduledTime).getTime() !== new Date(update.startTime).getTime()
    );
  }, [update.scheduledTime, update.startTime]);

  const closeOldVersionsOnly = useMemo(
    () => placeStatuses.some((status) => status.filter?.excludeCurrentVersion),
    [placeStatuses],
  );

  const bleedOffEndTime = useMemo(
    () => (update.startTime ? new Date(update.startTime) : undefined),
    [update.startTime],
  );

  const phaseState = useMemo(() => {
    const states = placeStatuses.map((status) => status.state);
    return {
      hasDelaying: states.some((state) => state === RestartState.Delaying),
      hasRestarting: states.some((state) => state === RestartState.Restarting),
      hasSucceeded: states.some((state) => isRestartComplete(state)),
      allSucceeded: states.every((state) => isRestartComplete(state)),
      allDoneWithBleedOff: states.every(
        (state) => isRestartComplete(state) || state === RestartState.Restarting,
      ),
      anyStillDelaying: states.some((state) => state === RestartState.Delaying),
    };
  }, [placeStatuses]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStepState = (stepIndex: number) => {
    const {
      hasDelaying,
      hasRestarting,
      hasSucceeded,
      allSucceeded,
      allDoneWithBleedOff,
      anyStillDelaying,
    } = phaseState;

    if (bleedOffEnabled) {
      switch (stepIndex) {
        case 0:
          if (hasDelaying || hasRestarting || hasSucceeded) {
            return STEP_STATE_CONSTANTS.COMPLETED;
          }
          return STEP_STATE_CONSTANTS.PENDING;
        case 1:
          if (allDoneWithBleedOff) {
            return STEP_STATE_CONSTANTS.COMPLETED;
          }
          if (anyStillDelaying) {
            return STEP_STATE_CONSTANTS.IN_PROGRESS;
          }
          return STEP_STATE_CONSTANTS.PENDING;
        case 2:
          if (allSucceeded) {
            return STEP_STATE_CONSTANTS.COMPLETED;
          }
          if (hasRestarting) {
            return STEP_STATE_CONSTANTS.IN_PROGRESS;
          }
          return STEP_STATE_CONSTANTS.PENDING;
        default:
          return STEP_STATE_CONSTANTS.PENDING;
      }
    }

    switch (stepIndex) {
      case 0:
        if (hasRestarting || hasSucceeded) {
          return STEP_STATE_CONSTANTS.COMPLETED;
        }
        return STEP_STATE_CONSTANTS.PENDING;
      case 1:
        if (allSucceeded) {
          return STEP_STATE_CONSTANTS.COMPLETED;
        }
        if (hasRestarting) {
          return STEP_STATE_CONSTANTS.IN_PROGRESS;
        }
        return STEP_STATE_CONSTANTS.PENDING;
      default:
        return STEP_STATE_CONSTANTS.PENDING;
    }
  };

  const getSteps = () => {
    const stoppingText = closeOldVersionsOnly
      ? translate('RestartProgress.StoppingMatchmakingToOutdatedServers')
      : translate('RestartProgress.StoppingMatchmakingToExistingServer');

    if (bleedOffEnabled) {
      return [
        stoppingText,
        translate('RestartProgress.DelayingServerRestart'),
        translate('RestartProgress.RestartingServers'),
      ];
    }

    return [stoppingText, translate('RestartProgress.RestartingServers')];
  };

  const steps = getSteps();

  const getActiveStep = () => {
    const { hasRestarting, allSucceeded, allDoneWithBleedOff, anyStillDelaying } = phaseState;

    if (bleedOffEnabled) {
      if (allSucceeded) {
        return 2;
      }
      if (hasRestarting) {
        return 2;
      }
      if (allDoneWithBleedOff) {
        return 2;
      }
      if (anyStillDelaying) {
        return 1;
      }
      return 0;
    }
    if (allSucceeded) {
      return 1;
    }
    if (hasRestarting) {
      return 1;
    }
    return 0;
  };

  const renderStepIcon = (stepIndex: number) => {
    const state = getStepState(stepIndex);

    switch (state) {
      case STEP_STATE_CONSTANTS.COMPLETED:
        return <Icon name='icon-filled-circle-check' />;
      case STEP_STATE_CONSTANTS.IN_PROGRESS:
        return <CircularProgress size={16} color='inherit' />;
      case STEP_STATE_CONSTANTS.PENDING:
      default:
        return <Icon name='icon-regular-circle-three-dots-horizontal' className={greyIcon} />;
    }
  };

  const getStepLabelColor = (stepIndex: number) => {
    const state = getStepState(stepIndex);
    return state === STEP_STATE_CONSTANTS.PENDING ? 'secondary' : 'primary';
  };

  const getTimeRemaining = () => {
    if (!bleedOffEndTime) {
      return DISPLAY_CONSTANTS.EMPTY_PLACEHOLDER;
    }

    const endTime = bleedOffEndTime.getTime();
    const remainingMs = endTime - currentTime;

    if (remainingMs <= 0) {
      return translate('RestartDetails.TotalDurationSeconds', { seconds: '0' });
    }

    const minutes = Math.floor(remainingMs / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    if (minutes === 0) {
      return translate('RestartDetails.TotalDurationSeconds', { seconds: seconds.toString() });
    }
    return translate('RestartDetails.TotalDuration', {
      minutes: minutes.toString(),
      seconds: seconds.toString(),
    });
  };

  const serverCounts = useMemo(() => {
    const remainingServers = placeStatuses.reduce(
      (sum, status) => sum + (status.remainingInstances ?? 0),
      0,
    );

    return Intl.NumberFormat(locale ?? Locale.English, {}).format(remainingServers);
  }, [placeStatuses, locale]);

  const playerCounts = useMemo(() => {
    const remainingPlayers = placeStatuses.reduce(
      (sum, status) => sum + (status.remainingPlayers ?? 0),
      0,
    );

    return Intl.NumberFormat(locale ?? Locale.English, {}).format(remainingPlayers);
  }, [placeStatuses, locale]);

  const getStepDescription = (stepIndex: number) => {
    const { hasRestarting, anyStillDelaying } = phaseState;
    const activeStep = getActiveStep();

    if (stepIndex !== activeStep) {
      return null;
    }

    const renderServerRestartDescription = () => (
      <div className={stepDescription}>
        <div>
          {translate(
            'RestartProgress.RestartingServersAndTeleportingAllRemainingPlayersToNewServers',
          )}
        </div>
        <div>
          {translate('RestartProgress.ServersShutdownAndPlayersMigrated', {
            serverCounts,
            playerCounts,
          })}
        </div>
      </div>
    );

    if (bleedOffEnabled) {
      switch (stepIndex) {
        case 0:
          return null;
        case 1:
          if (anyStillDelaying) {
            const timeRemaining = getTimeRemaining();
            return (
              <div className={stepDescription}>
                <div>
                  {translate('RestartProgress.PlayersWillNotBeDisconnectedUnlessTheyLeave')}
                </div>
                <div>
                  {translate('RestartProgress.TimeRemaining', {
                    timeRemaining,
                  })}
                </div>
              </div>
            );
          }
          return null;
        case 2:
          if (hasRestarting) {
            return renderServerRestartDescription();
          }
          return null;
        default:
          return null;
      }
    }

    switch (stepIndex) {
      case 0:
      case 2:
        return null;
      case 1:
        if (hasRestarting) {
          return renderServerRestartDescription();
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <Card
      variant='outlined'
      className={`${card} ${className ?? ''}`}
      data-testid='restart-progress'>
      <div className={stepperContainer}>
        <Stepper activeStep={getActiveStep()} orientation='vertical'>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel icon={renderStepIcon(index)} color={getStepLabelColor(index)}>
                {label}
              </StepLabel>
              <StepContent>{getStepDescription(index)}</StepContent>
            </Step>
          ))}
        </Stepper>
      </div>
    </Card>
  );
};

export default RestartProgress;
