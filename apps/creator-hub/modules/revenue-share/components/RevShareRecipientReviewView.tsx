// Presents recipient pending-proposal review with the shared diff table and Back and Accept actions before terms.
import { useEffect, useMemo, useRef, type FunctionComponent } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RevShareConfirmationStatus } from '../interface/RevShareViewModel';
import type { ClassifiedRevShareMutationError } from '../utils/revShareMutationError';
import { translateRevShareMutationError } from '../utils/revShareMutationErrorPresentation';
import { translateRevShareRecipientSettledStatusBanner } from '../utils/revShareRecipientProposalStatusPresentation';
import RevShareBanner from './RevShareBanner';
import RevShareReviewShell from './RevShareReviewShell';
import type { RevShareDiffRowData } from './tables/RevShareDiffTable';

export type RevShareRecipientReviewViewProps = {
  rows: readonly RevShareDiffRowData[];
  confirmation: RevShareConfirmationStatus;
  canRespond: boolean;
  isSubmitting?: boolean;
  mutationError?: ClassifiedRevShareMutationError | null;
  onRefreshStaleError?: () => void;
  isRefreshingStaleError?: boolean;
  onBack: () => void;
  onAccept: () => void;
};

const RevShareRecipientReviewView: FunctionComponent<RevShareRecipientReviewViewProps> = ({
  rows,
  confirmation,
  canRespond,
  isSubmitting = false,
  mutationError = null,
  onRefreshStaleError,
  isRefreshingStaleError = false,
  onBack,
  onAccept,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const errorBannerRef = useRef<HTMLDivElement>(null);
  const isPending = confirmation === RevShareConfirmationStatus.Pending;
  const hasError = mutationError != null;
  useEffect(() => {
    if (hasError) {
      errorBannerRef.current?.focus();
    }
  }, [hasError, mutationError?.kind, mutationError?.result]);
  const backLabel = tPendingTranslation(
    'Back',
    'Label on a button that returns to the previous step in a multi-step wizard.',
    translationKey('Action.Back', TranslationNamespace.Controls),
  );
  const acceptLabel = tPendingTranslation(
    'Accept',
    'Button label for continuing to accept a recipient revenue-share proposal.',
    translationKey('Action.Accept', TranslationNamespace.RevenueShareAgreements),
  );
  const refreshLabel = tPendingTranslation(
    'Refresh',
    'Button label to refresh revenue-share data after a stale mutation error.',
    translationKey('Action.Refresh', TranslationNamespace.Controls),
  );
  const controlsDisabled = isSubmitting || isRefreshingStaleError;
  const footer = useMemo(() => {
    if (isPending && canRespond) {
      return (
        <div className='flex justify-end gap-medium'>
          <Button
            type='button'
            variant='Standard'
            size='Medium'
            isDisabled={controlsDisabled}
            onClick={onBack}>
            {backLabel}
          </Button>
          <Button
            type='button'
            variant='Emphasis'
            size='Medium'
            isDisabled={controlsDisabled}
            onClick={onAccept}>
            {acceptLabel}
          </Button>
        </div>
      );
    }
    return (
      <div className='flex justify-end'>
        <Button type='button' variant='Standard' size='Medium' onClick={onBack}>
          {backLabel}
        </Button>
      </div>
    );
  }, [acceptLabel, backLabel, canRespond, controlsDisabled, isPending, onAccept, onBack]);
  const banner = useMemo(() => {
    if (mutationError != null) {
      const presentation = translateRevShareMutationError(
        'respond',
        mutationError,
        tPendingTranslation,
      );
      const showRefresh = presentation.kind === 'stale' && onRefreshStaleError !== undefined;
      return showRefresh ? (
        <RevShareBanner
          ref={errorBannerRef}
          tabIndex={-1}
          tone='alert'
          message={presentation.message}
          actionLabel={refreshLabel}
          onAction={onRefreshStaleError}
        />
      ) : (
        <RevShareBanner
          ref={errorBannerRef}
          tabIndex={-1}
          tone='alert'
          message={presentation.message}
        />
      );
    }
    const settledBanner = translateRevShareRecipientSettledStatusBanner(
      confirmation,
      tPendingTranslation,
    );
    if (settledBanner !== null) {
      return <RevShareBanner tone={settledBanner.tone} message={settledBanner.message} />;
    }
    return (
      <RevShareBanner
        tone={canRespond ? 'warning' : 'emphasis'}
        message={
          canRespond
            ? tPendingTranslation(
                'Review the proposed split, then accept it or go back for now.',
                'Instructions for a recipient reviewing a revenue-share proposal.',
                translationKey(
                  'Message.ReviewRecipientProposal',
                  TranslationNamespace.RevenueShareAgreements,
                ),
              )
            : tPendingTranslation(
                'You can view this proposal, but you do not have permission to accept it.',
                'Read-only notice for a recipient without permission to respond.',
                translationKey(
                  'Message.RecipientProposalReadOnly',
                  TranslationNamespace.RevenueShareAgreements,
                ),
              )
        }
      />
    );
  }, [
    canRespond,
    confirmation,
    mutationError,
    onRefreshStaleError,
    refreshLabel,
    tPendingTranslation,
  ]);

  return <RevShareReviewShell banner={banner} rows={rows} footer={footer} />;
};

export default RevShareRecipientReviewView;
