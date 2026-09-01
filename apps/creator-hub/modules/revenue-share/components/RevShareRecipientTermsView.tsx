// Presents dialog-owned recipient acceptance terms with controlled back and submit actions.
import type { FunctionComponent, ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useRevShareMutationErrorBanner, {
  type RevShareRefreshStaleErrorHandler,
} from '../hooks/useRevShareMutationErrorBanner';
import type { ClassifiedRevShareMutationError } from '../utils/revShareMutationError';
import type { RevShareTermsActionProps } from './revShareTermsActionProps';
import RevShareTermsShell from './RevShareTermsShell';

export type RevShareRecipientTermsViewProps = RevShareTermsActionProps & {
  /** Optional wizard progress supplied by the flow that owns this presentational step. */
  stepIndicator?: ReactNode;
  mutationError?: ClassifiedRevShareMutationError | null;
  onRefreshStaleError?: RevShareRefreshStaleErrorHandler;
};

const RevShareRecipientTermsView: FunctionComponent<RevShareRecipientTermsViewProps> = ({
  stepIndicator,
  isAccepted,
  onAcceptedChange,
  onBack,
  onSubmit,
  isDisabled = false,
  isSubmitting = false,
  mutationError = null,
  onRefreshStaleError,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const banner = useRevShareMutationErrorBanner({
    operation: 'respond',
    mutationError,
    onRefreshStaleError,
  });

  return (
    <RevShareTermsShell
      chrome={stepIndicator}
      footerBanner={banner}
      description={tPendingTranslation(
        'Please read and accept before submitting. These terms apply to everyone in the agreement.',
        'Instructions shown above the revenue-share proposal terms and consent control.',
        translationKey('Label.TermsInstructions', TranslationNamespace.RevenueShareAgreements),
      )}
      consentLabel={tPendingTranslation(
        'I understand and accept these terms. All parties must accept before the agreement takes effect, and submitting requires two-step verification.',
        'Consent checkbox for submitting a revenue-share proposal; explains unanimous acceptance and two-step verification.',
        translationKey(
          'Label.AcceptRevenueShareTerms',
          TranslationNamespace.RevenueShareAgreements,
        ),
      )}
      backLabel={tPendingTranslation(
        'Back',
        'Label on a button that returns to the previous step in a multi-step wizard.',
        translationKey('Action.Back', TranslationNamespace.Controls),
      )}
      submitLabel={tPendingTranslation(
        'Agree & continue',
        'Button label for confirming revenue-share terms and continuing.',
        translationKey('Action.AgreeAndContinue', TranslationNamespace.RevenueShareAgreements),
      )}
      isAccepted={isAccepted}
      onAcceptedChange={onAcceptedChange}
      onBack={onBack}
      onSubmit={onSubmit}
      isDisabled={isDisabled}
      isSubmitting={isSubmitting}
    />
  );
};

export default RevShareRecipientTermsView;
