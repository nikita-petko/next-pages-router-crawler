// Orchestrates recipient proposal review and terms steps before submitting the acceptance mutation.
import { useCallback, useMemo, useRef, useState, type FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareRecipientReviewView from '../components/RevShareRecipientReviewView';
import RevShareRecipientTermsView from '../components/RevShareRecipientTermsView';
import type { RevShareDiffRowData } from '../components/tables/RevShareDiffTable';
import {
  RevShareAcceptOrDecline,
  RevShareRecipientType,
  type RecipientAgreement,
  type RecipientProposalChanges,
  type ResolvedRevShareParty,
  type RevShareConfirmationStatus,
  type RevShareRecipient,
} from '../interface/RevShareViewModel';
import { useRevShareRespondMutation } from '../queries/revShareQueries';
import { AGGREGATE_REMAINING_COLOR, UNALLOCATED_COLOR } from '../utils/revShareSplitColors';
import { getRevShareRecipientKey } from '../utils/revShareUtils';

export type RevShareRespondFlowStep = 'review' | 'terms';

type RevShareRecipientRowLabels = {
  recipientName: string;
  remainingName: string;
  unallocatedName: string;
};

const buildRecipientDiffRows = (
  changes: RecipientProposalChanges,
  recipient: RevShareRecipient,
  recipientParty: ResolvedRevShareParty,
  confirmation: RevShareConfirmationStatus,
  labels: RevShareRecipientRowLabels,
): RevShareDiffRowData[] => {
  const rows: RevShareDiffRowData[] = [
    {
      key: getRevShareRecipientKey(recipient),
      ...recipient,
      name: labels.recipientName,
      identity: {
        target: recipientParty.target,
        targetType:
          recipient.type === RevShareRecipientType.User ? CreatorType.User : CreatorType.Group,
      },
      previousBasisPoints: changes.recipient.fromBasisPoints,
      newBasisPoints: changes.recipient.toBasisPoints,
      status: confirmation,
    },
    {
      key: 'remaining',
      id: 'remaining',
      type: RevShareRecipientType.Group,
      name: labels.remainingName,
      thumbnailColorOverride: AGGREGATE_REMAINING_COLOR,
      previousBasisPoints: changes.remaining.fromBasisPoints,
      newBasisPoints: changes.remaining.toBasisPoints,
    },
  ];

  if (changes.unallocated.fromBasisPoints !== changes.unallocated.toBasisPoints) {
    rows.push({
      key: 'unallocated',
      id: 'unallocated',
      type: RevShareRecipientType.Group,
      name: labels.unallocatedName,
      thumbnailColorOverride: UNALLOCATED_COLOR,
      previousBasisPoints: changes.unallocated.fromBasisPoints,
      newBasisPoints: changes.unallocated.toBasisPoints,
    });
  }

  return rows;
};

export type RevShareRespondFlowContainerProps = {
  agreement: RecipientAgreement;
  recipient: RevShareRecipient;
  recipientParty: ResolvedRevShareParty;
  canRespond: boolean;
  onDone: () => void;
  onStepChange?: (step: RevShareRespondFlowStep) => void;
};

const RevShareRespondFlowContainer: FunctionComponent<RevShareRespondFlowContainerProps> = ({
  agreement,
  recipient,
  recipientParty,
  canRespond,
  onDone,
  onStepChange,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [step, setStep] = useState<RevShareRespondFlowStep>('review');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isRespondPendingRef = useRef(false);
  const { mutateAsync: respond, isPending: isResponding } = useRevShareRespondMutation(recipient);
  const proposal = agreement.proposed;
  const labels = useMemo<RevShareRecipientRowLabels>(
    () => ({
      recipientName: tPendingTranslation(
        'You',
        'Label for the current recipient in a revenue-share split.',
        translationKey('Label.You', TranslationNamespace.RevenueShareAgreements),
      ),
      remainingName: tPendingTranslation(
        'All other parties',
        'Label for the aggregate of other parties in a recipient revenue-share projection.',
        translationKey('Label.AllOtherParties', TranslationNamespace.RevenueShareAgreements),
      ),
      unallocatedName: tPendingTranslation(
        'Unallocated',
        'Label for the unallocated portion of a revenue-share split.',
        translationKey('Label.Unallocated', TranslationNamespace.RevenueShareAgreements),
      ),
    }),
    [tPendingTranslation],
  );
  const rows = useMemo(
    () =>
      proposal
        ? buildRecipientDiffRows(
            proposal.changes,
            recipient,
            recipientParty,
            proposal.confirmation,
            labels,
          )
        : [],
    [labels, proposal, recipient, recipientParty],
  );
  const transitionToStep = useCallback(
    (nextStep: RevShareRespondFlowStep) => {
      setStep(nextStep);
      onStepChange?.(nextStep);
    },
    [onStepChange],
  );
  const handleShowTerms = useCallback(() => {
    setHasError(false);
    transitionToStep('terms');
  }, [transitionToStep]);
  const handleBackToReview = useCallback(() => {
    transitionToStep('review');
  }, [transitionToStep]);
  const handleAccept = useCallback(async () => {
    if (!proposal || !canRespond || isResponding || isRespondPendingRef.current) {
      return;
    }
    isRespondPendingRef.current = true;
    setHasError(false);
    try {
      await respond({
        proposedRevShareId: proposal.id,
        response: RevShareAcceptOrDecline.Accept,
      });
      onDone();
    } catch {
      // The query hook invalidates on settlement so stale/already-accepted proposals reconcile.
      setHasError(true);
      transitionToStep('review');
    } finally {
      isRespondPendingRef.current = false;
    }
  }, [canRespond, isResponding, onDone, proposal, respond, transitionToStep]);

  if (!proposal) {
    return null;
  }

  if (step === 'terms') {
    return (
      <RevShareRecipientTermsView
        isAccepted={hasAcceptedTerms}
        onAcceptedChange={setHasAcceptedTerms}
        onBack={handleBackToReview}
        onSubmit={handleAccept}
        isDisabled={!canRespond}
        isSubmitting={isResponding}
      />
    );
  }

  return (
    <RevShareRecipientReviewView
      rows={rows}
      confirmation={proposal.confirmation}
      canRespond={canRespond}
      isSubmitting={isResponding}
      hasError={hasError}
      onBack={onDone}
      onAccept={handleShowTerms}
    />
  );
};

export default RevShareRespondFlowContainer;
