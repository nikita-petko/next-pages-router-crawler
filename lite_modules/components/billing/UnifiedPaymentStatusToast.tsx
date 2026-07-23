import FailedCardAuthToast from '@components/billing/FailedCardAuthToast';
import NoPaymentMethodToast from '@components/billing/NoPaymentMethodToast';
import PaymentFailedToast from '@components/billing/PaymentFailedToast';
import SomethingWentWrongToast from '@components/billing/SomethingWentWrongToast';
import UnknownStripeSaveErrorToast from '@components/billing/UnknownStripeSaveErrorToast';
import UnverifiedCardToast from '@components/billing/UnverifiedCardToast';

interface UnifiedPaymentStatusToastProps {
  failedCardAuthorization: boolean;
  hasActiveChallenge?: boolean;
  hasFailedPayment: boolean;
  hasNoPaymentMethod: boolean;
  hasUnknownError: boolean;
  hasUnverifiedCard: boolean;
  paymentProfileId?: string;
  refreshFunc?: () => Promise<boolean>;
  somethingWentWrong: boolean;
}

// Component for all toasts that accommodates toast priority so no
// more than one toast is showed at any time
const UnifiedPaymentStatusToast = ({
  failedCardAuthorization,
  hasActiveChallenge = false,
  hasFailedPayment,
  hasNoPaymentMethod,
  hasUnknownError,
  hasUnverifiedCard,
  paymentProfileId,
  refreshFunc = () => Promise.resolve(true),
  somethingWentWrong,
}: UnifiedPaymentStatusToastProps) => {
  // For errors that occur while adding new payment method
  if (failedCardAuthorization) {
    return <FailedCardAuthToast />;
  }

  if (somethingWentWrong) {
    return <SomethingWentWrongToast />;
  }

  if (hasUnknownError) {
    return <UnknownStripeSaveErrorToast />;
  }

  // For expected states
  if (hasNoPaymentMethod) {
    return <NoPaymentMethodToast />;
  }

  if (hasUnverifiedCard && paymentProfileId) {
    return (
      <UnverifiedCardToast
        hasActiveChallenge={hasActiveChallenge}
        paymentProfileId={paymentProfileId}
        refreshFunc={refreshFunc}
      />
    );
  }

  // For errors that occur after payment method successfully added
  if (hasFailedPayment) {
    return <PaymentFailedToast />;
  }

  return null;
};

export default UnifiedPaymentStatusToast;
