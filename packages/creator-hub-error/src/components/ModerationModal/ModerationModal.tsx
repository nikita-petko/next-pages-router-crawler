import React, { FunctionComponent, useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
} from '@rbx/ui';
import { UnifiedLogger } from '@rbx/unified-logger';
import { BehaviorInterventionClient } from '../../clients/behaviorIntervention';
import {
  PUNISHMENT_TYPE_TO_STRING_KEY,
  REPORT_APPEALS_URL,
  ROBLOX_URL,
  TERMS_OF_USE_URL,
  ProceedAction,
  ModerationModalEvents,
} from '../../utils/constants';
import ModerationDetailsPageItems from './moderationDetailsPageItems/ModerationDetailsPageItems';
import useTranslateWithLink from '../../hooks/useTranslateWithLink';
import determineProceedAction from '../../utils/determineProceedAction';
import useNotApprovedInfo from '../../hooks/useNotApprovedInfo';
import useModerationModalStyles from './ModerationModal.styles';

export interface ModerationModalProps {
  onLogout: (setIsLogoutLoading: (isLogoutLoading: boolean) => void) => void;
  onReactivate: () => void;
  isOpen: boolean;
  unifiedLoggerClient: UnifiedLogger;
}

const ModerationModal: FunctionComponent<ModerationModalProps> = ({
  onLogout,
  onReactivate,
  isOpen,
  unifiedLoggerClient,
}) => {
  const { translate } = useTranslation();
  const { punishmentData, getNotApprovedInfo, reactivateAccount } = useNotApprovedInfo();

  const [reactivateAckIsChecked, setReactivateAckIsChecked] = useState(false);
  const [isProceedActionLoading, setIsProceedActionLoading] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [reactivateError, setReactivateError] = useState(false);
  const [showGenericError, setShowGenericError] = useState(false);
  const {
    classes: { alert },
  } = useModerationModalStyles();

  const behaviorInterventionClient = useMemo(
    () => new BehaviorInterventionClient(unifiedLoggerClient),
    [unifiedLoggerClient],
  );

  useEffect(() => {
    getNotApprovedInfo(behaviorInterventionClient, setShowGenericError);
  }, [getNotApprovedInfo, behaviorInterventionClient]);

  useEffect(() => {
    if (punishmentData?.verificationCategory) {
      setShowGenericError(true);
    }
  }, [punishmentData]);

  const proceedAction = useMemo(() => {
    if (!punishmentData) {
      return null;
    }
    const proceedActionResult = determineProceedAction(punishmentData);
    unifiedLoggerClient.logImpressionEvent({
      eventName: ModerationModalEvents.ModerationModalImpressionEvent,
      parameters: {
        canReactivateAccount: String(proceedActionResult === ProceedAction.Reactivate),
      },
    });
    return proceedActionResult;
  }, [punishmentData, unifiedLoggerClient]);

  const proceedActionLabel = useMemo(() => {
    switch (proceedAction) {
      case ProceedAction.Reactivate:
        return translate('Action.ReactivateAccount');
      case ProceedAction.RequestAppeal:
        return translate('Action.RequestAppeal');
      case ProceedAction.RobloxRedirect:
        return translate('Action.GoToRoblox');
      default:
        return null;
    }
  }, [proceedAction, translate]);

  const handleOnProceedClick = useCallback(async () => {
    switch (proceedAction) {
      case ProceedAction.Reactivate:
        setIsProceedActionLoading(true);
        try {
          await reactivateAccount(behaviorInterventionClient);
          unifiedLoggerClient.logClickEvent({
            eventName: ModerationModalEvents.ModerationModalReactivateEvent,
          });
          onReactivate();
        } catch {
          setReactivateError(true);
          setIsProceedActionLoading(false);
        }
        break;
      case ProceedAction.RequestAppeal:
        window.open(REPORT_APPEALS_URL, '_blank');
        break;
      case ProceedAction.RobloxRedirect:
        window.open(ROBLOX_URL, '_blank');
        break;
      default:
        break;
    }
  }, [
    proceedAction,
    reactivateAccount,
    behaviorInterventionClient,
    unifiedLoggerClient,
    onReactivate,
  ]);

  const handleOnLogoutClick = useCallback(() => {
    setIsLogoutLoading(true);
    unifiedLoggerClient.logClickEvent({
      eventName: ModerationModalEvents.ModerationModalLogoutEvent,
      parameters: {
        couldReactivateAccount: String(proceedAction === ProceedAction.Reactivate),
      },
    });
    onLogout(setIsLogoutLoading);
  }, [onLogout, proceedAction, unifiedLoggerClient]);

  const punishmentTypeLabel = useMemo(() => {
    if (showGenericError) {
      return translate('Heading.AccountIssue');
    }
    if (punishmentData?.punishmentTypeDescription) {
      return translate(
        PUNISHMENT_TYPE_TO_STRING_KEY[punishmentData.punishmentTypeDescription] ?? '',
      );
    }
    return '';
  }, [punishmentData, translate, showGenericError]);

  const reactivateAckLabel = useTranslateWithLink('Action.UserAgree', TERMS_OF_USE_URL, true);

  const resolveIssueContent = useTranslateWithLink('Description.ResolveIssue', ROBLOX_URL);

  if (!showGenericError && punishmentData === null) {
    return null;
  }

  return (
    <Dialog open={isOpen} maxWidth='Large'>
      <DialogTitle style={{ paddingBottom: 16 }}>{punishmentTypeLabel}</DialogTitle>
      <DialogContent>
        {showGenericError ? (
          resolveIssueContent
        ) : (
          <ModerationDetailsPageItems {...punishmentData} />
        )}
        {proceedAction === ProceedAction.Reactivate ? (
          <FormControlLabel
            control={
              <Checkbox
                onClick={() => {
                  setReactivateAckIsChecked(!reactivateAckIsChecked);
                }}
              />
            }
            label={reactivateAckLabel}
          />
        ) : null}
      </DialogContent>
      {reactivateError ? (
        <Alert severity='error' className={alert}>
          {translate('Response.UnknownError')}
        </Alert>
      ) : null}
      <DialogActions>
        <Button
          variant='outlined'
          color='secondary'
          size='large'
          type='button'
          loading={isLogoutLoading}
          onClick={handleOnLogoutClick}>
          {translate('Action.Logout')}
        </Button>
        {proceedAction !== null ? (
          <Button
            variant='contained'
            size='large'
            type='submit'
            disabled={proceedAction === ProceedAction.Reactivate && !reactivateAckIsChecked}
            loading={isProceedActionLoading}
            onClick={handleOnProceedClick}
            data-testid='proceed-action'>
            {proceedActionLabel}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default ModerationModal;
