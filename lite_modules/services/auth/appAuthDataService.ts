const DEV_CLIENT_ID = '1817995170432034672';
const STAGING_CLIENT_ID = '6398105824995460311';
const PROD_CLIENT_ID = '4273917941353191905';

let redirectUrl: string;
if (process.env.environment === 'production') {
  redirectUrl = 'https://create.roblox.com/advertise/';
} else if (process.env.environment === 'staging') {
  redirectUrl = 'https://create.sitetest1.robloxlabs.com/advertise/';
} else {
  redirectUrl = 'https://create.sitetest3.robloxlabs.com/advertise/';
}

let discoveryUrl: string;
// Check the environment
if (process.env.environment === 'production') {
  discoveryUrl = 'https://apis.roblox.com/oauth/.well-known/openid-configuration';
} else if (process.env.environment === 'staging') {
  discoveryUrl = 'https://apis.sitetest1.robloxlabs.com/oauth/.well-known/openid-configuration';
} else {
  discoveryUrl = 'https://apis.sitetest3.robloxlabs.com/oauth/.well-known/openid-configuration';
}

export const getClientIdForEnv = () => {
  if (process.env.environment === 'production') {
    return PROD_CLIENT_ID;
  }

  if (process.env.environment === 'staging') {
    return STAGING_CLIENT_ID;
  }
  return DEV_CLIENT_ID;
};

export const getAuthorizationEndpoint = async () => {
  const res = await fetch(discoveryUrl);
  const { authorization_endpoint: authorizationEndpoint } = await res.json();
  const authUrl = new URL(authorizationEndpoint);
  // Format it to hit Roblox SSO w/ correct query params
  const params: { [id: string]: string } = {
    client_id: getClientIdForEnv(),
    prompt: 'none',
    redirect_uri: redirectUrl,
    response_type: 'none',
    scope: 'openid',
    // Taken from https://gist.github.com/gordonbrander/2230317 we just need a hash to verify redirect uri
    // state: (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase()
  };
  // TODO(arthur): when we need to implement sso w/ Creator Dashboard instead of Cookies we need to verify
  // state passed by redirect matches what we issued
  // explanation here: https://auth0.com/docs/protocols/state-parameters
  // localStorage.setItem('CreatorDashboardOauthState', params.state);
  // Create the url to SSO
  const searchParams = new URLSearchParams(params);
  authUrl.search = searchParams.toString();
  return authUrl.href;
};
