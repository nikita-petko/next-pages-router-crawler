// Presents proposal submission terms with wizard chrome, consent checkbox, and controlled submit for the propose wizard.
import type { FunctionComponent, ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareTermsShell from './RevShareTermsShell';

type RevShareProposalTermsViewProps = {
  stepIndicator?: ReactNode;
  isAccepted: boolean;
  onAcceptedChange: (isAccepted: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

const RevShareProposalTermsView: FunctionComponent<RevShareProposalTermsViewProps> = ({
  stepIndicator,
  isAccepted,
  onAcceptedChange,
  onBack,
  onSubmit,
  isSubmitting = false,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  return (
    <RevShareTermsShell
      chrome={stepIndicator}
      heading={tPendingTranslation(
        'Terms & implications',
        'Heading for the revenue-share proposal consent step.',
        translationKey('Heading.TermsAndImplications', TranslationNamespace.RevenueShareAgreements),
      )}
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
        'Submit proposal',
        'Button label for submitting a revenue-share proposal after accepting terms.',
        translationKey('Action.SubmitProposal', TranslationNamespace.RevenueShareAgreements),
      )}
      isAccepted={isAccepted}
      onAcceptedChange={onAcceptedChange}
      onBack={onBack}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default RevShareProposalTermsView;
