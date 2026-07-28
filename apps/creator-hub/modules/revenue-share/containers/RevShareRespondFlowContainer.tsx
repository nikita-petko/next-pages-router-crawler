// Orchestrates recipient proposal review and terms steps before submitting the acceptance mutation.
import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
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
import {
  classifyRevShareMutationError,
  type ClassifiedRevShareMutationError,
} from '../utils/revShareMutationError';
import { AGGREGATE_REMAINING_COLOR, UNALLOCATED_COLOR } from '../utils/revShareSplitColors';
import { getRevShareRecipientKey, isRevShareCurrentUserRecipient } from '../utils/revShareUtils';

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
  currentUserId: string | number | null | undefined,
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
      isCurrentUser: isRevShareCurrentUserRecipient(recipient, currentUserId),
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
  onStaleRefresh: () => void | Promise<void>;
  onStepChange?: (step: RevShareRespondFlowStep) => void;
};

const RevShareRespondFlowContainer: FunctionComponent<RevShareRespondFlowContainerProps> = ({
  agreement,
  recipient,
  recipientParty,
  canRespond,
  onDone,
  onStaleRefresh,
  onStepChange,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { user } = useAuthentication();
  const currentUserId = user?.id;
  const [step, setStep] = useState<RevShareRespondFlowStep>('review');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [mutationError, setMutationError] = useState<ClassifiedRevShareMutationError | null>(null);
  const [isRefreshingStaleError, setIsRefreshingStaleError] = useState(false);
  const isRespondPendingRef = useRef(false);
  const isRefreshingStaleErrorRef = useRef(false);
  const onStaleRefreshRef = useRef(onStaleRefresh);
  useEffect(() => {
    onStaleRefreshRef.current = onStaleRefresh;
  }, [onStaleRefresh]);
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
            currentUserId,
          )
        : [],
    [currentUserId, labels, proposal, recipient, recipientParty],
  );
  const transitionToStep = useCallback(
    (nextStep: RevShareRespondFlowStep) => {
      setStep(nextStep);
      onStepChange?.(nextStep);
    },
    [onStepChange],
  );
  const handleShowTerms = useCallback(() => {
    setMutationError(null);
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
    setMutationError(null);
    try {
      await respond({
        proposedRevShareId: proposal.id,
        response: RevShareAcceptOrDecline.Accept,
      });
      onDone();
    } catch (error) {
      setMutationError(classifyRevShareMutationError('respond', error));
      transitionToStep('review');
    } finally {
      isRespondPendingRef.current = false;
    }
  }, [canRespond, isResponding, onDone, proposal, respond, transitionToStep]);
  const handleRefreshStaleError = useCallback(async () => {
    if (isRefreshingStaleErrorRef.current) {
      return;
    }
    isRefreshingStaleErrorRef.current = true;
    setIsRefreshingStaleError(true);
    try {
      await onStaleRefreshRef.current();
    } catch {
      // Keep the stale banner open when refresh fails.
    } finally {
      isRefreshingStaleErrorRef.current = false;
      setIsRefreshingStaleError(false);
    }
  }, []);

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
      mutationError={mutationError}
      onRefreshStaleError={
        mutationError?.kind === 'stale' ? () => void handleRefreshStaleError() : undefined
      }
      isRefreshingStaleError={isRefreshingStaleError}
      onBack={onDone}
      onAccept={handleShowTerms}
    />
  );
};

export default RevShareRespondFlowContainer;
