// Presents cancellation terms with consent checkbox and controlled submit for cancelling a pending revenue share proposal.
import type { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareTermsShell from './RevShareTermsShell';

type RevShareCancelTermsViewProps = {
  isAccepted: boolean;
  onAcceptedChange: (isAccepted: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

const RevShareCancelTermsView: FunctionComponent<RevShareCancelTermsViewProps> = ({
  isAccepted,
  onAcceptedChange,
  onBack,
  onSubmit,
  isSubmitting = false,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  return (
    <RevShareTermsShell
      heading={tPendingTranslation(
        'Cancel proposal',
        'Heading for the revenue-share proposal cancellation consent step.',
        translationKey('Heading.CancelProposalTerms', TranslationNamespace.RevenueShareAgreements),
      )}
      description={tPendingTranslation(
        'Cancelling withdraws this proposal. Recipients who already responded will no longer be asked to accept these changes.',
        'Instructions shown above the revenue-share cancellation terms and consent control.',
        translationKey(
          'Label.CancelProposalTermsInstructions',
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
