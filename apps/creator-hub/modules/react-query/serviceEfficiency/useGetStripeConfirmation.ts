import type { Stripe, StripeElements } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';

export default function useGetStripeConfirmation(
  stripe: Stripe | null,
  elements: StripeElements | null,
) {
  type AllowRedisplay = 'always' | 'limited' | 'unspecified';
  const allowRedisplayValue: AllowRedisplay = 'always';
  const confirmStripeSetup = async () => {
    if (stripe && elements) {
      const stripeConfirmResponse = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: '',
          payment_method_data: {
            allow_redisplay: allowRedisplayValue,
          },
        },
      });
      return stripeConfirmResponse;
    }

    return null;
  };

  return useMutation({
    mutationFn: confirmStripeSetup,
    retry: 3,
  });
}
