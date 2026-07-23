import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { pickEffectiveDevExIntervention } from '@modules/clients/behaviorInterventionMapper';
import type { GetDevExInfoResponse } from '@modules/clients/economy';
import type { DevExInterventionDetail } from '@modules/clients/userModerationTypes';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DEVEX_APPEAL_URL } from '../../constants/externalLinkConstants';
import {
  getDevExSuspensionEndTimeUtc,
  shouldShowDevExAtRiskDialog,
  shouldShowDevExSuspensionDialog,
} from '../utils/devexEligibility';
import { formatInterventionCountdown } from '../utils/formatInterventionCountdown';
import { getDevExViolationReason } from '../utils/getDevExViolationReason';
import useDevExIntervention from '../utils/useDevExIntervention';
import {
  useDevExAtRiskDialogCopy,
  useDevExSuspensionDialogCopy,
} from '../utils/useDevExModerationDialogCopy';
import useInterventionEndDateDisplay from '../utils/useInterventionEndDateDisplay';
import DevExInterventionDetailsCard from './DevExInterventionDetailsCard';
import DevExInterventionDialogLayout from './DevExInterventionDialogLayout';

type DevExAtRiskDialogProps = {
  intervention: DevExInterventionDetail | null;
  onClose: () => void | Promise<void>;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
};

const DevExAtRiskDialog: FunctionComponent<DevExAtRiskDialogProps> = ({
  intervention,
  onClose,
  confirmDisabled,
  confirmLoading,
}) => {
  const { title, body } = useDevExAtRiskDialogCopy();

  return (
    <DevExInterventionDialogLayout
      testId='devex-at-risk-dialog'
      title={title}
      body={body}
      appealUrl={DEVEX_APPEAL_URL}
      onClose={onClose}
      dsaMessage={intervention?.consequenceTransparencyMessage}
      confirmDisabled={confirmDisabled}
      confirmLoading={confirmLoading}
    />
  );
};

type DevExSuspensionDialogProps = {
  cashoutInfo: GetDevExInfoResponse;
  intervention: DevExInterventionDetail | null;
  onClose: () => void | Promise<void>;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
};

const DevExSuspensionDialog: FunctionComponent<DevExSuspensionDialogProps> = ({
  cashoutInfo,
  intervention,
  onClose,
  confirmDisabled,
  confirmLoading,
}) => {
  const { translate } = useTranslation();
  const { title, body, hasLiftDate } = useDevExSuspensionDialogCopy(
    cashoutInfo,
    intervention?.endDate,
  );
  const liftDate = hasLiftDate
    ? (getDevExSuspensionEndTimeUtc(cashoutInfo) ??
      (intervention?.endDate ? new Date(intervention.endDate) : undefined))
    : undefined;
  const { formattedEndDate, countdownText } = useInterventionEndDateDisplay(liftDate);
  const violationReason = getDevExViolationReason(intervention?.badUtterances, translate);

  return (
    <DevExInterventionDialogLayout
      testId='devex-suspension-dialog'
      title={title}
      body={body}
      appealUrl={DEVEX_APPEAL_URL}
      onClose={onClose}
      showAppealPrompt={false}
      confirmDisabled={confirmDisabled}
      confirmLoading={confirmLoading}
      dsaMessage={intervention?.consequenceTransparencyMessage}
      detailsCard={
        violationReason || liftDate ? (
          <DevExInterventionDetailsCard
            violationReason={violationReason}
            formattedEndDate={liftDate ? formattedEndDate : undefined}
            countdownText={
              liftDate
                ? (countdownText ?? formatInterventionCountdown(liftDate, translate))
                : undefined
            }
          />
        ) : undefined
      }
    />
  );
};

type DevExModerationDismissContext = 'at-risk' | 'suspension';

type DevExModerationDialogsProps = {
  cashoutInfo: GetDevExInfoResponse;
  /** Refetch economy cashout info after acknowledge so at-risk state clears on the server. */
  onModerationDismissed?: (context: DevExModerationDismissContext) => void | Promise<void>;
  pageLoadIntervention?: DevExInterventionDetail | null;
  isPageLoadInterventionReady?: boolean;
};

/**
 * Shows intervention modals when the user lands on DevEx with an active suspension or at-risk
 * nudge. At-risk takes precedence: AMP sets isDevExSuspended true for unacknowledged nudges until
 * dismiss + refetch clears both flags.
 */
const DevExModerationDialogs: FunctionComponent<DevExModerationDialogsProps> = ({
  cashoutInfo,
  onModerationDismissed,
  pageLoadIntervention,
  isPageLoadInterventionReady = true,
}) => {
  const showAtRisk = shouldShowDevExAtRiskDialog(cashoutInfo);
  const showSuspension = shouldShowDevExSuspensionDialog(cashoutInfo);
  const [suspensionDismissed, setSuspensionDismissed] = useState(false);
  const [atRiskDismissed, setAtRiskDismissed] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [prevShowAtRisk, setPrevShowAtRisk] = useState(showAtRisk);
  const [prevShowSuspension, setPrevShowSuspension] = useState(showSuspension);

  // Only reset local dismiss when server flags turn on again after being fully cleared.
  // Do not reset when showAtRisk briefly drops during optimistic refetch after OK.
  if (showAtRisk !== prevShowAtRisk) {
    setPrevShowAtRisk(showAtRisk);
    if (showAtRisk && !atRiskDismissed) {
      setAtRiskDismissed(false);
    }
  }

  if (showSuspension !== prevShowSuspension) {
    setPrevShowSuspension(showSuspension);
    if (showSuspension && !suspensionDismissed) {
      setSuspensionDismissed(false);
    }
  }

  const activeModal =
    showAtRisk && !atRiskDismissed
      ? 'at-risk'
      : showSuspension && !suspensionDismissed
        ? 'suspension'
        : null;

  const { intervention, isInterventionLoading, dismissIntervention } = useDevExIntervention({
    enabled: activeModal !== null,
    fetchKey: activeModal ?? 'none',
    pageLoadIntervention,
    isPageLoadInterventionReady,
  });

  const effectiveIntervention = pickEffectiveDevExIntervention(
    intervention,
    pageLoadIntervention ?? null,
  );

  const requiresInterventionAck =
    effectiveIntervention?.acknowledgeable === true &&
    Boolean(effectiveIntervention.interventionId);
  const isWaitingForInterventionId =
    isInterventionLoading && !effectiveIntervention?.interventionId;
  const confirmDisabled =
    isAcknowledging ||
    (activeModal === 'at-risk' && !effectiveIntervention?.interventionId) ||
    (activeModal === 'suspension' && requiresInterventionAck && isWaitingForInterventionId);
  const confirmLoading = isAcknowledging || isWaitingForInterventionId;

  const handleSuspensionClose = async () => {
    setIsAcknowledging(true);
    try {
      if (requiresInterventionAck) {
        const dismissed = await dismissIntervention(effectiveIntervention);
        if (!dismissed) {
          return;
        }
      }
      setSuspensionDismissed(true);
      await onModerationDismissed?.('suspension');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleAtRiskClose = async () => {
    setIsAcknowledging(true);
    try {
      const dismissed = await dismissIntervention(effectiveIntervention);
      if (!dismissed) {
        return;
      }
      setAtRiskDismissed(true);
      await onModerationDismissed?.('at-risk');
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (showAtRisk && !atRiskDismissed) {
    return (
      <DevExAtRiskDialog
        intervention={effectiveIntervention}
        onClose={handleAtRiskClose}
        confirmDisabled={confirmDisabled}
        confirmLoading={confirmLoading}
      />
    );
  }

  if (showSuspension && !suspensionDismissed) {
    return (
      <DevExSuspensionDialog
        cashoutInfo={cashoutInfo}
        intervention={effectiveIntervention}
        onClose={handleSuspensionClose}
        confirmDisabled={confirmDisabled}
        confirmLoading={confirmLoading}
      />
    );
  }

  return null;
};

export default withTranslation(DevExModerationDialogs, [
  TranslationNamespace.DevEx,
  TranslationNamespace.NotApproved,
]);
