import { useMutation } from '@tanstack/react-query';
import { useCloudPricingClient } from '@modules/cloud-services/pricing/CloudPricingClientProvider';

export default function useDeletePaymentInfo(
  creatorId: number | null,
  getPaymentId: () => string | null, // Change this parameter to a function that returns a string or null
) {
  const cloudPricingClient = useCloudPricingClient();
  const deletePayment = async () => {
    const paymentId = getPaymentId(); // Call the function to get the current value of paymentId
    if (creatorId && paymentId) {
      await cloudPricingClient.deletePaymentProfile(creatorId, paymentId);
    }
    return null;
  };

  return useMutation({ mutationFn: deletePayment, retry: 5 });
}
