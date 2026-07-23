export type TAuthorizationEndpointOptions = {
  state?: string;
  redirectUri?: string;
};

export const getAuthorizationEndpoint = async (options: TAuthorizationEndpointOptions = {}) => {
  const redirectUrl = options.redirectUri ?? window.location.href;
  // OIDC discovery (`/oauth/.well-known/openid-configuration`) is not reliably CORS-enabled for browsers.
  // The discovery document's `authorization_endpoint` is `${bedev2BaseUrl}/oauth/v1/authorize`, so we
  // build it deterministically to avoid a blocking fetch during app init.
  const authUrl = new URL('/oauth/v1/authorize', process.env.bedev2BaseUrl);

  const params: { [id: string]: string } = {
    client_id: process.env.creatorDashboardClientId,
    response_type: 'none',
    redirect_uri: redirectUrl,
    scope: 'openid',
    prompt: 'none',
    // Taken from https://gist.github.com/gordonbrander/2230317 we just need a hash to verify redirect uri
    // state: (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase()
  };

  if (options.state !== undefined) {
    params.state = options.state;
  }

  // TODO(arthur): when we need to implement sso w/ Creator Dashboard instead of Cookies we need to verify
  // state passed by redirect matches what we issued
  // explanation here: https://auth0.com/docs/protocols/state-parameters
  // localStorage.setItem('CreatorDashboardOauthState', params.state);
  // Create the url to SSO
  const searchParams = new URLSearchParams(params);
  authUrl.search = searchParams.toString();
  return authUrl.href;
};

export default { getAuthorizationEndpoint };
