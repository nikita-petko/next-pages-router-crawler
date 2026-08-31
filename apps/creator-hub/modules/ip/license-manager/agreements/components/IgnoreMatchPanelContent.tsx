import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import type { AgreementCandidateType } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Typography, Button, CircularProgress, Radio, RadioGroup, FormControlLabel } from '@rbx/ui';
import useIpSnackbar, { useNeutralIpSnackbar } from '../../../hooks/useIpSnackbar';
import {
  LicenseManagerClickEvent,
  LicenseManagerImpressionEvent,
  useLicenseManagerLogger,
} from '../../utils/logger';
import IgnoreReason, { isIgnoreReason } from '../enums/IgnoreReason';
import { useIgnoreAgreementCandidateMutation } from '../hooks/agreements';
import { BUTTON_SPINNER_SIZE } from '../utils/constants';
import MatchPanelLayout from './MatchPanelLayout';

interface IgnoreMatchPanelContentProps {
  /** Agreement candidate id to ignore. */
  candidateId: string | null | undefined;
  candidateType: AgreementCandidateType;
  /** Return to the previous view (e.g. the match details) without ignoring. */
  onBack: () => void;
  /** Dismiss the whole side panel (the header close button). */
  onClose: () => void;
  /** Called after the candidate is successfully ignored (post-200), before the snackbar clears. */
  onIgnored: () => void;
}

/** Shared reason-selection view for dismissing a match (matches-table side panel + preview page). */
const IgnoreMatchPanelContent: FunctionComponent<IgnoreMatchPanelContentProps> = ({
  candidateId,
  candidateType,
  onBack,
  onClose,
  onIgnored,
}) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { enqueueErrorSnackbar } = useIpSnackbar();
  const enqueueNeutralSnackbar = useNeutralIpSnackbar();
  const ignoreMatchMutation = useIgnoreAgreementCandidateMutation();
  const [selectedIgnoreReason, setSelectedIgnoreReason] = useState<IgnoreReason | null>(null);

  const handleReasonChange = useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, value: string) => {
      if (isIgnoreReason(value)) {
        setSelectedIgnoreReason(value);
        logEvent(LicenseManagerClickEvent.IgnoreMatchPanelSelectReasonClickEvent, {
          candidateType,
          ignoreReason: value,
        });
      }
    },
    [candidateType, logEvent],
  );

  const handleBack = useCallback(() => {
    logEvent(LicenseManagerClickEvent.IgnoreMatchPanelBackClickEvent, {
      candidateType,
    });
    onBack();
  }, [candidateType, logEvent, onBack]);

  const handleClose = useCallback(() => {
    logEvent(LicenseManagerClickEvent.IgnoreMatchPanelCloseClickEvent, {
      candidateType,
    });
    onClose();
  }, [candidateType, logEvent, onClose]);

  const notifyMatchIgnored = useCallback(() => {
    enqueueNeutralSnackbar(translate('Label.MatchSuccessfullyIgnored'));
  }, [enqueueNeutralSnackbar, translate]);

  const handleConfirmIgnore = useCallback(() => {
    if (candidateId == null || selectedIgnoreReason == null) {
      return;
    }
    logEvent(LicenseManagerClickEvent.IgnoreMatchPanelConfirmClickEvent, {
      candidateType,
      ignoreReason: selectedIgnoreReason,
    });
    ignoreMatchMutation.mutate(
      { agreementCandidateId: candidateId, reason: selectedIgnoreReason },
      {
        onSuccess: () => {
          logEvent(LicenseManagerImpressionEvent.IgnoreMatchPanelSuccessImpressionEvent, {
            candidateType,
            ignoreReason: selectedIgnoreReason,
          });
          notifyMatchIgnored();
          onIgnored();
        },
        onError: () => {
          logEvent(LicenseManagerImpressionEvent.IgnoreMatchPanelFailureImpressionEvent, {
            candidateType,
            ignoreReason: selectedIgnoreReason,
            failureReason: 'requestError',
          });
          enqueueErrorSnackbar();
        },
      },
    );
  }, [
    candidateId,
    candidateType,
    selectedIgnoreReason,
    ignoreMatchMutation,
    notifyMatchIgnored,
    enqueueErrorSnackbar,
    logEvent,
    onIgnored,
  ]);

  const ignoreButtonLabel = translate('Action.Ignore');

  const ignoreMatchDescription = translate('Label.IgnoreMatchInfo');

  // Each option maps 1:1 to an IgnoreReason enum value; the enum name is what gets sent to the API.
  const ignoreReasonOptions: Array<{ reason: IgnoreReason; label: string }> = [
    {
      reason: IgnoreReason.IgnoredNotInterested,
      label: translate('Label.IgnoreReasonNotInterested'),
    },
    {
      reason: IgnoreReason.IgnoredDoesNotUseMyIp,
      label: translate('Label.IgnoreReasonDoesNotUseMyIp'),
    },
  ];

  const ignoreReasonFooter = (
    <>
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        className='fill [white-space:nowrap] text-align-x-center'
        disabled={selectedIgnoreReason == null || ignoreMatchMutation.isPending}
        onClick={handleConfirmIgnore}>
        {ignoreMatchMutation.isPending ? (
          <CircularProgress color='inherit' size={BUTTON_SPINNER_SIZE} />
        ) : (
          ignoreButtonLabel
        )}
      </Button>
      <Button
        variant='contained'
        color='secondary'
        size='large'
        className='fill [white-space:nowrap] text-align-x-center'
        disabled={ignoreMatchMutation.isPending}
        onClick={handleBack}>
        {translate('Action.Back')}
      </Button>
    </>
  );

  return (
    <MatchPanelLayout
      title={translate('Heading.IgnoreMatch')}
      onClose={handleClose}
      buttons={ignoreReasonFooter}>
      <div className='flex flex-col gap-medium'>
        <Typography variant='body1'>{ignoreMatchDescription}</Typography>
        <Typography variant='h6'>{translate('Label.IgnoreMatchReasonPrompt')}</Typography>
        <RadioGroup value={selectedIgnoreReason ?? ''} onChange={handleReasonChange}>
          {ignoreReasonOptions.map((option) => (
            <FormControlLabel
              key={option.reason}
              value={option.reason}
              control={<Radio color='secondary' aria-label={option.label} />}
              label={option.label}
            />
          ))}
        </RadioGroup>
      </div>
    </MatchPanelLayout>
  );
};

export default IgnoreMatchPanelContent;
