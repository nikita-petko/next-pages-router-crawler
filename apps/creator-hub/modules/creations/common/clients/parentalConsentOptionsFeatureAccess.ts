import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';

// This is a "private" endpoint (exposed for the "AMP Wizard") we are using for the age verification banner feature.
// Please reach out to the access-management team if you would like to call into AMP; this is a one-off client.

const basePath = getBEDEV2ServiceBasePath('access-management');

const NAMESPACE = encodeURIComponent('collaborative_tools/TeamCreateCollaborationAgeGate');

const SHOW_PARENTAL_CONSENT_OPTIONS_FEATURE_NAME = 'ShowParentalConsentOptions';

const HAS_ACCESS_LITERAL = 'Granted';

const getFeatureUrl = (featureName: string) =>
  `${basePath}/v1/upsell-feature-access?nameSpace=${NAMESPACE}&featureName=${featureName}`;

const sendWithRetry = async (url: string, count: number = 0): Promise<string> => {
  const response = await fetch(url, { credentials: 'include' });
  const status = (response.status % 100) * 100;

  // retry with exponential backoff; max 3 attempts
  // try, fail, wait 1s, try, fail, wait 2s, try, fail, error
  if (!response.ok && status === 500 && count < 2) {
    await new Promise((resolve) => setTimeout(resolve, 2 ** (count + 1) * 500));
    return sendWithRetry(url, count + 1);
  }
  if (status === 500 && count === 2) {
    throw new Error('Failed to get feature access after 3 attempts');
  }

  const json = await response.json();
  if (!('access' in json)) throw new Error('"access" not found in response');
  return json.access;
};

const getShowParentalConsentOptionsFeatureAccess = async (): Promise<boolean> => {
  return (
    (await sendWithRetry(getFeatureUrl(SHOW_PARENTAL_CONSENT_OPTIONS_FEATURE_NAME))) ===
    HAS_ACCESS_LITERAL
  );
};

export default getShowParentalConsentOptionsFeatureAccess;
