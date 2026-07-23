import {
  STRIPE_DEV_PUBLIC_KEY,
  STRIPE_PROD_PUBLIC_KEY,
  STRIPE_STAGING_PUBLIC_KEY,
} from '@constants/billing';

export const GetStripePublicAPIKeyForEnv = () => {
  if (process.env.environment === 'production') {
    return STRIPE_PROD_PUBLIC_KEY;
  }
  if (process.env.environment === 'staging') {
    return STRIPE_STAGING_PUBLIC_KEY;
  }
  return STRIPE_DEV_PUBLIC_KEY;
};
