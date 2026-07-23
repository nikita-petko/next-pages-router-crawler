import type { TTheme } from '@rbx/ui';

// Public keys for getting stripePromise for rendering Stripe form. They are public so we can expose them.
const STAGING_PUBLIC_KEY =
  'pk_test_51LNOeQHDRNiW7vlLcKH8TGCpJ7zhaidLdSegE22GCuvQbVUX2xDiGJY6WYaldYyo6qgVxmy1SnSVpSdaqyjfqclU00NQwWntIe';
const DEV_PUBLIC_KEY =
  'pk_test_51LNM0XG5RADBkfjhYJlpADA2ArzWIh7gTWTodYNbpEzSiT55dul3VJhaBIVHL0CNyO0gECOz1vPnWArAkjwQ8NBO00Cdf2PxED';
const PROD_PUBLIC_KEY =
  'pk_live_51LKpO9C8tJWGhK4HEHtny9Dg7xXiQJ1i349cq6KBDusbl8bRHO7QmCKKhX18LPjSirMNTvj3tesq6mhIQuPioeAd0062ZCgoF3';

export const getStripePublicAPIKeyForEnv = () => {
  if (process.env.targetEnvironment === 'production') {
    return PROD_PUBLIC_KEY;
  }
  if (process.env.targetEnvironment === 'sitetest3') {
    return STAGING_PUBLIC_KEY;
  }
  return DEV_PUBLIC_KEY;
};

export enum CardVerificationResultEnum {
  SUCCESS = 'SUCCESS',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CARD_AUTHENTICATION_FAILED = 'CARD_AUTHENTICATION_FAILED',
  UPDATE = 'UPDATE',
}

export enum DialogResponseStatusEnum {
  SUCCESS = 'SUCCESS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FAILED = 'FAILED',
}

export type labelType = 'above' | 'floating' | undefined;

// We hardcode the hex colours according to the Figma, this is because Stripe elements do not know about our theme.
// The values of the colours for each component will vary depending on whether or not the user's theme is dark or light mode
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- we do not know the type of a stripe options
export const getThemedStripeOptions = (theme: TTheme): any => {
  const isDarkTheme = theme.palette.mode === 'dark';
  return {
    appearance: {
      labels: 'floating' as labelType,
      variables: {
        colorPrimary: isDarkTheme ? '#0570de' : '#d1d1d1',
        colorBackground: isDarkTheme ? '#313131' : '#d1d1d1',
        colorTextPlaceholder: isDarkTheme ? '#FFFFFF' : '#1f1f1f',
        colorText: isDarkTheme ? '#BBBCBE' : '#1f1f1f',
        colorDanger: isDarkTheme ? '#df1b41' : '#df1b41',
        spacingUnit: '2px',
        borderRadius: '8px',
        spacingGridColumn: '24px',
        spacingGridRow: '24px',
      },
      rules: {
        '.Input': {
          borderBottom: 'solid',
          borderLeft: 'solid',
          borderRight: 'solid',
          borderTop: 'solid',
          borderWidth: '1px',
          borderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.16)' : '#b8b8b8',
          backgroundColor: isDarkTheme ? '#25272C' : '#d1d1d1',
        },
      },
    },
  };
};
