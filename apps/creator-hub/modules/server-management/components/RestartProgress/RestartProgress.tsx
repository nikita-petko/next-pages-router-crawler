import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Card, Stepper, Step, StepLabel, StepContent, CircularProgress } from '@rbx/ui';
import { Icon } from '@rbx/foundation-ui';
import { GameUpdateStatus } from '@rbx/clients/matchmakingApi/v1';
import { RestartStatus, RestartState } from '@rbx/clients/serverManagementService';
import { useTranslation, Locale, useLocalization } from '@rbx/intl';
import { DISPLAY_CONSTANTS, STEP_STATE_CONSTANTS } from '../../constants';
import useRestartProgressStyles from './RestartProgress.styles';
import UpdatePhase from '../../enums/UpdatePhase';
import useServerManagementV2Gate from '../../hooks/useServerManagementV2Gate';

enum NormalizedPhase {
  Delaying = 'Delaying',
  Restarting = 'Restarting',
  Succeeded = 'Succeeded',
}

type NormalizedPlaceStatus = {
  phase: NormalizedPhase;
  remainingInstances: number;
  remainingPlayers: number;
  endTime?: Date | null;
};

type NormalizedUpdate = {
  placeStatuses: NormalizedPlaceStatus[];
  bleedOffEnabled: boolean;
  closeOldVersionsOnly: boolean;
  bleedOffEndTime: Date | undefined;
  startTime: Date | undefined;
};

function isGameUpdateStatus(update: GameUpdateStatus | RestartStatus): update is GameUpdateStatus {
  return 'placeUpdateStatuses' in update;
}

function normalizeV1Phase(phase: string | null | undefined): NormalizedPhase {
  switch (phase) {
    case UpdatePhase.BleedOff:
      return NormalizedPhase.Delaying;
    case UpdatePhase.Migrate:
      return NormalizedPhase.Restarting;
    case UpdatePhase.Done:
      return NormalizedPhase.Succeeded;
    default:
      return NormalizedPhase.Succeeded;
  }
}

function normalizeV2State(state: RestartState | undefined): NormalizedPhase {
  switch (state) {
    case RestartState.Delaying:
      return NormalizedPhase.Delaying;
    case RestartState.Restarting:
      return NormalizedPhase.Restarting;
    case RestartState.Succeeded:
      return NormalizedPhase.Succeeded;
    default:
      return NormalizedPhase.Succeeded;
  }
}

function normalizeUpdate(update: GameUpdateStatus | RestartStatus): NormalizedUpdate {
  if (isGameUpdateStatus(update)) {
    const statuses = Object.values(update.placeUpdateStatuses ?? {});
    return {
      placeStatuses: statuses.map((s) => ({
        phase: normalizeV1Phase(s.phase),
        remainingInstances: s.instancesToBeClosed ?? 0,
        remainingPlayers: s.numPlayersToBeKicked ?? 0,
        endTime: s.endTime ? new Date(s.endTime) : undefined,
      })),
      bleedOffEnabled: !!update.bleedOffServers,
      closeOldVersionsOnly: !!update.closeOldVersionsOnly,
      bleedOffEndTime: update.bleedOffEndTime ? new Date(update.bleedOffEndTime) : undefined,
      startTime: update.startTime ? new Date(update.startTime) : undefined,
    };
  }

  const statuses = Object.values(update.placeRestartStatuses ?? {});
  const hasScheduledDelay =
    update.scheduledTime &&
    update.startTime &&
    new Date(update.scheduledTime).getTime() !== new Date(update.startTime).getTime();

  const closeOldOnly = statuses.some((s) => s.filter?.excludeCurrentVersion);

  return {
    placeStatuses: statuses.map((s) => ({
      phase: normalizeV2State(s.state),
      remainingInstances: s.remainingInstances ?? 0,
      remainingPlayers: s.remainingPlayers ?? 0,
      endTime: s.endTime ? new Date(s.endTime) : undefined,
    })),
    bleedOffEnabled: !!hasScheduledDelay,
    closeOldVersionsOnly: closeOldOnly,
    bleedOffEndTime: update.startTime ? new Date(update.startTime) : undefined,
    startTime: update.scheduledTime ? new Date(update.scheduledTime) : undefined,
  };
}

type RestartProgressProps = {
  update: GameUpdateStatus | RestartStatus;
  className?: string;
};

const RestartProgress: React.FC<RestartProgressProps> = ({ update, className }) => {
  const { classes } = useRestartProgressStyles();
  const { greyIcon, stepDescription, card, stepperContainer } = classes;
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const isV2Enabled = useServerManagementV2Gate();
  const [currentTime, setCurrentTime] = useState(Date.now());

  const normalized = useMemo(() => normalizeUpdate(update), [update]);
  const { placeStatuses, bleedOffEnabled, closeOldVersionsOnly, bleedOffEndTime } = normalized;

  const phaseState = useMemo(() => {
    const phases = placeStatuses.map((s) => s.phase);
    return {
      hasDelaying: phases.some((p) => p === NormalizedPhase.Delaying),
      hasRestarting: phases.some((p) => p === NormalizedPhase.Restarting),
      hasSucceeded: phases.some((p) => p === NormalizedPhase.Succeeded),
      allSucceeded: phases.every((p) => p === NormalizedPhase.Succeeded),
      allDoneWithBleedOff: phases.every(
        (p) => p === NormalizedPhase.Succeeded || p === NormalizedPhase.Restarting,
      ),
      anyStillDelaying: phases.some((p) => p === NormalizedPhase.Delaying),
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
          if (hasDelaying || hasRestarting || hasSucceeded) return STEP_STATE_CONSTANTS.COMPLETED;
          return STEP_STATE_CONSTANTS.PENDING;
        case 1:
          if (allDoneWithBleedOff) return STEP_STATE_CONSTANTS.COMPLETED;
          if (anyStillDelaying) return STEP_STATE_CONSTANTS.IN_PROGRESS;
          return STEP_STATE_CONSTANTS.PENDING;
        case 2:
          if (allSucceeded) return STEP_STATE_CONSTANTS.COMPLETED;
          if (hasRestarting) return STEP_STATE_CONSTANTS.IN_PROGRESS;
          return STEP_STATE_CONSTANTS.PENDING;
        default:
          return STEP_STATE_CONSTANTS.PENDING;
      }
    } else {
      switch (stepIndex) {
        case 0:
          if (hasRestarting || hasSucceeded) return STEP_STATE_CONSTANTS.COMPLETED;
          return STEP_STATE_CONSTANTS.PENDING;
        case 1:
          if (allSucceeded) return STEP_STATE_CONSTANTS.COMPLETED;
          if (hasRestarting) return STEP_STATE_CONSTANTS.IN_PROGRESS;
          return STEP_STATE_CONSTANTS.PENDING;
        default:
          return STEP_STATE_CONSTANTS.PENDING;
      }
    }
  };

  const getSteps = () => {
    const stoppingText = closeOldVersionsOnly
      ? translate('RestartProgress.StoppingMatchmakingToOutdatedServers')
      : translate('RestartProgress.StoppingMatchmakingToExistingServer');

    const baseSteps = [stoppingText, translate('RestartProgress.RestartingServers')];

    if (bleedOffEnabled) {
      return [
        stoppingText,
        translate('RestartProgress.DelayingServerRestart'),
        translate('RestartProgress.RestartingServers'),
      ];
    }

    return baseSteps;
  };

  const steps = getSteps();

  const getActiveStep = () => {
    const { hasRestarting, allSucceeded, allDoneWithBleedOff, anyStillDelaying } = phaseState;

    if (bleedOffEnabled) {
      if (allSucceeded) return 2;
      if (hasRestarting) return 2;
      if (allDoneWithBleedOff) return 2;
      if (anyStillDelaying) return 1;
      return 0;
    }
    if (allSucceeded) return 1;
    if (hasRestarting) return 1;
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
    const remainingServers = placeStatuses.reduce((sum, status) => {
      return sum + status.remainingInstances;
    }, 0);

    return `${Intl.NumberFormat(locale ?? Locale.English, {}).format(remainingServers)}`;
  }, [placeStatuses, locale]);

  const playerCounts = useMemo(() => {
    const remainingPlayers = placeStatuses.reduce((sum, status) => {
      return sum + status.remainingPlayers;
    }, 0);

    return `${Intl.NumberFormat(locale ?? Locale.English, {}).format(remainingPlayers)}`;
  }, [placeStatuses, locale]);

  const getStepDescription = (stepIndex: number) => {
    const { hasRestarting, anyStillDelaying } = phaseState;
    const activeStep = getActiveStep();

    if (stepIndex !== activeStep) return null;

    const renderServerRestartDescription = () => (
      <div className={stepDescription}>
        <div>
          {translate(
            'RestartProgress.RestartingServersAndTeleportingAllRemainingPlayersToNewServers',
          )}
        </div>
        <div>
          {translate('RestartProgress.ServersShutdownAndPlayersMigrated', {
            serverCounts: serverCounts.toString(),
            playerCounts: playerCounts.toString(),
          })}
        </div>
      </div>
    );

    if (bleedOffEnabled) {
      switch (stepIndex) {
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
                    timeRemaining: timeRemaining.toString(),
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
    } else {
      switch (stepIndex) {
        case 1:
          if (hasRestarting) {
            return renderServerRestartDescription();
          }
          return null;
        default:
          return null;
      }
    }
  };

  return (
    <Card
      variant='outlined'
      className={`${card} ${className ?? ''}`}
      data-testid='restart-progress'>
      {!isV2Enabled && (
        <Typography variant='h6' component='h6'>
          {translate('RestartProgress.RealTimeProgress')}
        </Typography>
      )}
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
