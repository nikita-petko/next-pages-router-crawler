import type { ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import { FormHelperText, Grid, Typography } from '@rbx/ui';

type ExperienceSubscriptionFormErrorTextProps = {
  subscriptionErrorMsg: string;
  errorMessageStyle: string;
  communityStandardsLink: (chunks: React.ReactNode) => React.ReactNode;
  /**
   * Optional interpolation values for the error translation (e.g. PriceChangeCooldown
   * supplies `lastChangeDays`, `cooldownDays`, and `daysRemaining`). Ignored for error
   * keys that take no arguments.
   */
  subscriptionErrorArgs?: { [key: string]: string };
};

function ExperienceSubscriptionFormErrorText({
  subscriptionErrorMsg,
  errorMessageStyle,
  communityStandardsLink,
  subscriptionErrorArgs,
}: ExperienceSubscriptionFormErrorTextProps) {
  const { translate, translateHTML } = useTranslation();

  if (!subscriptionErrorMsg) {
    return null;
  }

  let errorBody: ReactNode;
  if (subscriptionErrorMsg === 'Error.SubscriptionContentModerated') {
    errorBody = translateHTML(subscriptionErrorMsg, [
      {
        opening: 'LinkStart',
        closing: 'LinkEnd',
        content(chunks: React.ReactNode) {
          return communityStandardsLink(chunks);
        },
      },
    ]);
  } else {
    const translated = translate(subscriptionErrorMsg, subscriptionErrorArgs);
    errorBody = translated || subscriptionErrorMsg;
  }

  return (
    <FormHelperText error>
      <Grid container item direction='row' XSmall={12}>
        <Typography color='error' classes={{ root: errorMessageStyle }}>
          {errorBody}
        </Typography>
      </Grid>
    </FormHelperText>
  );
}

export default ExperienceSubscriptionFormErrorText;
