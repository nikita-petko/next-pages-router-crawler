// Loads recipient agreements, resolves recipient identity, and routes landing, detail, and proposal-response views.
import { useCallback, useEffect, useMemo, useState, type FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import PageLoading from '@modules/miscellaneous/components/PageLoading';
import LoadError from '@modules/miscellaneous/error/LoadError';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareLandingView from '../components/RevShareLandingView';
import RevShareLifecycleDialog from '../components/RevShareLifecycleDialog';
import RevShareRecipientDetail from '../components/RevShareRecipientDetail';
import type {
  ManagerAgreement,
  RecipientAgreement,
  RevShareRecipient,
} from '../interface/RevShareViewModel';
import {
  useRevShareForRecipient,
  useRevShareRecipientNames,
  type ResolvedRevShareParty,
} from '../queries/revShareQueries';
import { REV_SHARE_QUERY_KEYS, normalizeRevShareRouteQuery } from '../utils/revShareRouteState';
import {
  findRecipientAgreementByTarget,
  parseRevShareTargetQuery,
} from '../utils/revShareTargetSelection';
import RevShareRespondFlowContainer, {
  type RevShareRespondFlowStep,
} from './RevShareRespondFlowContainer';

const EMPTY_MANAGER_AGREEMENTS: ManagerAgreement[] = [];
const EMPTY_RECIPIENT_AGREEMENTS: RecipientAgreement[] = [];
const EMPTY_RECIPIENT_REFS: RevShareRecipient[] = [];
const QUERY_TRANSITION_OPTIONS = { scroll: false } as const;

export type RevShareRecipientContainerSurface = 'page' | 'embedded';

export type RevShareRecipientContainerProps = {
  recipient: RevShareRecipient | undefined;
  canRespond: boolean;
  isReady: boolean;
  surface?: RevShareRecipientContainerSurface;
};

type RecipientRespondLifecycleDialogProps = {
  agreement: RecipientAgreement;
  recipient: RevShareRecipient;
  recipientParty: ResolvedRevShareParty;
  canRespond: boolean;
  closeLabel: string;
  onDone: () => void;
};

// Keyed by proposal identity so remounts reset dialog title state with the flow.
const RecipientRespondLifecycleDialog: FunctionComponent<RecipientRespondLifecycleDialogProps> = ({
  agreement,
  recipient,
  recipientParty,
  canRespond,
  closeLabel,
  onDone,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const [respondFlowStep, setRespondFlowStep] = useState<RevShareRespondFlowStep>('review');
  const lifecycleTitle =
    respondFlowStep === 'review'
      ? tPendingTranslation(
          'Review changes',
          'Heading for reviewing a proposed revenue share split.',
          translationKey('Heading.ReviewChanges', TranslationNamespace.RevenueShareAgreements),
        )
      : tPendingTranslation(
          'Terms & implications',
          'Heading for the revenue-share proposal consent step.',
          translationKey(
            'Heading.TermsAndImplications',
            TranslationNamespace.RevenueShareAgreements,
          ),
        );

  return (
    <RevShareLifecycleDialog open title={lifecycleTitle} closeLabel={closeLabel} onClose={onDone}>
      <RevShareRespondFlowContainer
        agreement={agreement}
        recipient={recipient}
        recipientParty={recipientParty}
        canRespond={canRespond}
        onDone={onDone}
        onStepChange={setRespondFlowStep}
      />
    </RevShareLifecycleDialog>
  );
};

const RevShareRecipientContainer: FunctionComponent<RevShareRecipientContainerProps> = ({
  recipient,
  canRespond,
  isReady,
  surface = 'page',
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const isEmbedded = surface === 'embedded';
  const recipientQuery = useRevShareForRecipient(isReady ? recipient : undefined);
  const rows = recipientQuery.data ?? EMPTY_RECIPIENT_AGREEMENTS;
  const refetchAgreements = recipientQuery.refetch;
  const recipientRefs = useMemo(
    () => (isReady && recipient ? [recipient] : EMPTY_RECIPIENT_REFS),
    [isReady, recipient],
  );
  const {
    resolveRecipientParty,
    isLoading: areRecipientNamesLoading,
    error: recipientNamesError,
    refetch: refetchRecipientNames,
  } = useRevShareRecipientNames(recipientRefs);
  const recipientParty = useMemo(
    () => (recipient ? resolveRecipientParty(recipient) : undefined),
    [recipient, resolveRecipientParty],
  );
  const [{ targetType, targetId, action }, setRecipientQuery] = useQueryParams(
    REV_SHARE_QUERY_KEYS,
    QUERY_TRANSITION_OPTIONS,
  );
  const selectedAction = normalizeRevShareRouteQuery({ action }).action;
  const [focusReturnTarget, setFocusReturnTarget] = useState<RecipientAgreement['target'] | null>(
    null,
  );
  const selectedTarget = useMemo(
    () => parseRevShareTargetQuery(targetType, targetId),
    [targetId, targetType],
  );
  const selectedAgreement = useMemo(
    () => findRecipientAgreementByTarget(rows, selectedTarget),
    [rows, selectedTarget],
  );
  const hasDetailQuery = targetType != null || targetId != null;
  const hasActionQuery = action != null;
  const isDetailView = selectedAgreement != null;
  const isIdentityLoading = isDetailView && areRecipientNamesLoading;
  const identityError = isDetailView ? recipientNamesError : null;
  const isActiveEmbedded = isEmbedded && hasDetailQuery;

  useEffect(() => {
    if (
      isEmbedded ||
      !isReady ||
      recipient === undefined ||
      recipientQuery.isLoading ||
      recipientQuery.error ||
      isIdentityLoading
    ) {
      return;
    }

    const normalize = (
      next: Partial<Record<(typeof REV_SHARE_QUERY_KEYS)[number], string | undefined>>,
    ) => {
      setRecipientQuery(next, { skipHistory: true });
    };

    const hasValidRecipientReviewFlow =
      selectedAgreement != null && selectedAgreement.proposed !== null;

    if (hasActionQuery && selectedAction == null) {
      normalize({ action: undefined });
      return;
    }

    if (selectedAction === 'review') {
      if (hasValidRecipientReviewFlow) {
        return;
      }

      if (action != null) {
        normalize({ action: undefined });
      }
      return;
    }

    if (action != null) {
      normalize({ action: undefined });
    }

    if (!hasDetailQuery) {
      return;
    }

    if (!selectedTarget || !selectedAgreement) {
      normalize({
        targetType: undefined,
        targetId: undefined,
        action: undefined,
      });
    }
  }, [
    action,
    hasActionQuery,
    hasDetailQuery,
    isEmbedded,
    isIdentityLoading,
    isReady,
    recipient,
    recipientQuery.error,
    recipientQuery.isLoading,
    selectedAction,
    selectedAgreement,
    selectedTarget,
    setRecipientQuery,
  ]);

  const handleReload = useCallback(async (): Promise<void> => {
    await Promise.all([refetchAgreements(), refetchRecipientNames()]);
  }, [refetchAgreements, refetchRecipientNames]);
  const handleSelectAgreement = useCallback(
    (agreement: RecipientAgreement) => {
      setFocusReturnTarget(agreement.target);
      setRecipientQuery({
        targetType: agreement.target.type,
        targetId: agreement.target.id,
        action: undefined,
      });
    },
    [setRecipientQuery],
  );
  const handleBackToList = useCallback(() => {
    if (selectedAgreement) {
      setFocusReturnTarget(selectedAgreement.target);
    }
    setRecipientQuery({
      targetType: undefined,
      targetId: undefined,
      action: undefined,
    });
  }, [selectedAgreement, setRecipientQuery]);
  const handleReview = useCallback(() => {
    setRecipientQuery({ action: 'review' });
  }, [setRecipientQuery]);
  const handleDoneResponding = useCallback(() => {
    setRecipientQuery({ action: undefined });
  }, [setRecipientQuery]);
  const lifecycleCloseLabel = tPendingTranslation(
    'Close',
    'Accessible label for closing a revenue share lifecycle dialog.',
    translationKey('Action.Close', TranslationNamespace.RevenueShareAgreements),
  );
  const respondFlowIdentityKey =
    recipient !== undefined && selectedAgreement?.proposed != null
      ? `${recipient.type}:${recipient.id}:${selectedAgreement.proposed.id}`
      : null;
  const respondLifecycleDialog =
    recipient !== undefined &&
    selectedAgreement?.proposed != null &&
    selectedAction === 'review' &&
    recipientParty != null &&
    respondFlowIdentityKey != null ? (
      <RecipientRespondLifecycleDialog
        key={respondFlowIdentityKey}
        agreement={selectedAgreement}
        recipient={recipient}
        recipientParty={recipientParty}
        canRespond={canRespond}
        closeLabel={lifecycleCloseLabel}
        onDone={handleDoneResponding}
      />
    ) : null;

  if (!isReady || recipient === undefined) {
    return isEmbedded ? null : <PageLoading />;
  }
  if (recipientQuery.isLoading || isIdentityLoading) {
    if (isEmbedded && !isActiveEmbedded) {
      return null;
    }
    return <PageLoading />;
  }
  if (recipientQuery.error || identityError) {
    if (isEmbedded && !isActiveEmbedded) {
      return null;
    }
    return <LoadError onReload={handleReload} />;
  }
  if (isEmbedded && !isDetailView) {
    return null;
  }
  if (selectedAgreement && recipientParty != null) {
    return (
      <>
        <RevShareRecipientDetail
          agreement={selectedAgreement}
          recipient={recipient}
          recipientParty={recipientParty}
          canRespond={canRespond}
          onBack={handleBackToList}
          onReview={handleReview}
        />
        {respondLifecycleDialog}
      </>
    );
  }

  if (isEmbedded) {
    return null;
  }

  return (
    <RevShareLandingView
      managerRows={EMPTY_MANAGER_AGREEMENTS}
      recipientRows={rows}
      onRecipientRowClick={handleSelectAgreement}
      focusTarget={focusReturnTarget}
      isUserView
    />
  );
};

export default RevShareRecipientContainer;
