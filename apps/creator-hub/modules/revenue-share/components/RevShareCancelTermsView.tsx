// Presents cancellation terms with consent checkbox and controlled submit for cancelling a pending revenue share proposal.
import { useEffect, useMemo, useRef, type FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ClassifiedRevShareMutationError } from '../utils/revShareMutationError';
import { translateRevShareMutationError } from '../utils/revShareMutationErrorPresentation';
import RevShareBanner from './RevShareBanner';
import type { RevShareTermsActionProps } from './revShareTermsActionProps';
import RevShareTermsShell from './RevShareTermsShell';

type RevShareCancelTermsViewProps = RevShareTermsActionProps & {
  mutationError?: ClassifiedRevShareMutationError | null;
  onRefreshStaleError?: () => void;
};

const RevShareCancelTermsView: FunctionComponent<RevShareCancelTermsViewProps> = ({
  isAccepted,
  onAcceptedChange,
  onBack,
  onSubmit,
  isSubmitting = false,
  mutationError = null,
  onRefreshStaleError,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const errorBannerRef = useRef<HTMLDivElement>(null);
  const refreshLabel = tPendingTranslation(
    'Refresh',
    'Button label to refresh revenue-share data after a stale mutation error.',
    translationKey('Action.Refresh', TranslationNamespace.Controls),
  );
  useEffect(() => {
    if (mutationError != null) {
      errorBannerRef.current?.focus();
    }
  }, [mutationError]);
  const banner = useMemo(() => {
    if (mutationError == null) {
      return undefined;
    }
    const presentation = translateRevShareMutationError(
      'cancel',
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
  }, [mutationError, onRefreshStaleError, refreshLabel, tPendingTranslation]);

  return (
    <RevShareTermsShell
      footerBanner={banner}
      description={tPendingTranslation(
        'Cancelling withdraws this proposal. Recipients who already responded will no longer be asked to accept these changes.',
        'Instructions shown above the revenue-share cancellation terms and consent control.',
        translationKey(
          'Label.CancelProposalTermsInstructions',
          TranslationNamespace.RevenueShareAgreements,
        ),
      )}
      termsHeading={tPendingTranslation(
        'Terms and conditions',
        'Heading for the terms and conditions shown when cancelling a revenue-share proposal.',
        translationKey(
          'Heading.CancelProposalTermsAndConditions',
          TranslationNamespace.RevenueShareAgreements,
        ),
      )}
      consentLabel={tPendingTranslation(
        'I understand that cancelling withdraws this proposal.',
        'Consent checkbox for cancelling a pending revenue-share proposal.',
        translationKey(
          'Label.AcceptCancelProposalTerms',
          TranslationNamespace.RevenueShareAgreements,
        ),
      )}
      backLabel={tPendingTranslation(
        'Back',
        'Label on a button that returns to the previous step in a multi-step wizard.',
        translationKey('Action.Back', TranslationNamespace.Controls),
      )}
      submitLabel={tPendingTranslation(
        'Cancel proposal',
        'Button label for cancelling a pending revenue share proposal.',
        translationKey('Action.CancelProposal', TranslationNamespace.RevenueShareAgreements),
      )}
      submitVariant='Alert'
      isAccepted={isAccepted}
      onAcceptedChange={onAcceptedChange}
      onBack={onBack}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default RevShareCancelTermsView;
