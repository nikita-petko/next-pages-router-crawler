// Presents cancellation terms with consent checkbox and controlled submit for cancelling a pending revenue share proposal.
import type { FunctionComponent } from 'react';
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

type RevShareCancelTermsViewProps = RevShareTermsActionProps & {
  mutationError?: ClassifiedRevShareMutationError | null;
  onRefreshStaleError?: RevShareRefreshStaleErrorHandler;
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
  const banner = useRevShareMutationErrorBanner({
    operation: 'cancel',
    mutationError,
    onRefreshStaleError,
  });

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
