import type { ReactNode } from 'react';
import { FormHelperText, Grid, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

type ExperienceSubscriptionFormErrorTextProps = {
  subscriptionErrorMsg: string;
  subscriptionBackendErrorMessage: string;
  errorMessageStyle: string;
  communityStandardsLink: (chunks: React.ReactNode) => React.ReactNode;
};

/**
 * Renders subscription form error text.
 *
 * **Why we sometimes show raw `errorMessage`:** For a small allowlist (see
 * `experienceSubscriptionVerbatimErrorMessages`), the API returns policy copy that does not yet
 * have a dedicated i18n key; `failureReason` often maps to a generic `Error.SubscriptionError`,
 * so we surface the server string instead of a vague translation.
 *
 * **Long term:** Prefer distinct `failureReason` values (or stable codes) from the OpenAPI spec,
 * each mapped to a translation key in locales—same pattern as other `Error.*` keys—so user-facing
 * text stays in the translation system and can be localized.
 */
function ExperienceSubscriptionFormErrorText({
  subscriptionErrorMsg,
  subscriptionBackendErrorMessage,
  errorMessageStyle,
  communityStandardsLink,
}: ExperienceSubscriptionFormErrorTextProps) {
  const { translate, translateHTML } = useTranslation();

  const backendMessage = subscriptionBackendErrorMessage.trim();
  if (!subscriptionErrorMsg && !backendMessage) {
    return null;
  }

  let errorBody: ReactNode;
  // Verbatim path: temporary until each policy case has its own i18n key + failureReason mapping.
  if (backendMessage) {
    errorBody = backendMessage;
  } else if (subscriptionErrorMsg === 'Error.SubscriptionContentModerated') {
    errorBody = translateHTML(subscriptionErrorMsg, [
      {
        opening: 'LinkStart',
        closing: 'LinkEnd',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- translateHTML callback type
        content(chunks: any) {
          return communityStandardsLink(chunks);
        },
      },
    ]);
  } else {
    errorBody = translate(subscriptionErrorMsg);
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
