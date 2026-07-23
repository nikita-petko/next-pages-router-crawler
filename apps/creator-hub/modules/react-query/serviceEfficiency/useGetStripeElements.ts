import { useMutation } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';

export default function useGetStripeElements(stripePublicKey: string) {
  const loadStripeElements = async () => {
    const response = await loadStripe(stripePublicKey);
    return response;
  };

  return useMutation({
    mutationFn: loadStripeElements,
    retry: 3,
  });
}
