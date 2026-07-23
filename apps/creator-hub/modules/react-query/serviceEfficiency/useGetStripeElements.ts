import { loadStripe } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';

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
