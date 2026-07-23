import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';

// This is a "private" endpoint (exposed for the "AMP Wizard") we are using for the age verification banner feature.
// Please reach out to the access-management team if you would like to call into AMP; this is a one-off client.

const basePath = getBEDEV2ServiceBasePath('access-management');

const NAMESPACE = encodeURIComponent('studio/CollaborationSettings');

const AGE_VERIFICATION_UPSELL_FEATURE_NAME = 'ShouldShowCreatorHubBanner';
const ESTABLISH_TRUST_FEATURE_NAME = 'ShowEstablishTrustBanner';

const HAS_ACCESS_LITERAL = 'Granted';

const getFeatureUrl = (featureName: string) =>
  `${basePath}/v1/upsell-feature-access?nameSpace=${NAMESPACE}&featureName=${featureName}`;

/*
Example GET request:
apis.roblox.com/v1/upsell-feature-access?nameSpace=studio%2FCollaborationSettings&featureName=ShouldShowCreatorHubBanner

Example GET response:
{
  "featureName": "ShouldShowCreatorHubBanner",
  "access": "Granted",
  "recourse": null,
  "recourses": null,
  "v2Recourses": null,
  "shouldPrompt": true
}
*/

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
  if (!('access' in json)) {
    throw new Error('"access" not found in response');
  }
  return json.access;
};

export const getAgeVerificationUpsellFeatureAccess = async (): Promise<boolean> => {
  // GRANTED -> Eligible for FAE and has not completed FAE
  // DENIED -> Not eligible for FAE or has completed FAE
  return (
    (await sendWithRetry(getFeatureUrl(AGE_VERIFICATION_UPSELL_FEATURE_NAME))) ===
    HAS_ACCESS_LITERAL
  );
};

export const getEstablishTrustFeatureAccess = async (): Promise<boolean> => {
  // GRANTED -> U16 and has completed FAE but has not enabled trusted connections
  // DENIED -> Not U16 or has not completed FAE or has enabled trusted connections
  return (await sendWithRetry(getFeatureUrl(ESTABLISH_TRUST_FEATURE_NAME))) === HAS_ACCESS_LITERAL;
};
