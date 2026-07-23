import { Configuration } from '@rbx/clients-core';
import { PermissionRequestApi } from '@rbx/client-application-authorizations-api/v1';
import crypto from 'crypto';
import fetchIXPParameters from './fetchIXPParameters';

type PermissionRequestCreateMagicAuthorizationGrantRequest = {
  clientId: string;
  scopes: typeof SCOPES;
  nonce: string;
};

type PermissionRequestCreateMagicAuthorizationGrantOperationRequest = {
  permissionRequestCreateMagicAuthorizationGrantRequest: PermissionRequestCreateMagicAuthorizationGrantRequest;
};

type PermissionRequestApiWithMagicGrant = PermissionRequestApi & {
  permissionRequestCreateMagicAuthorizationGrant?: (
    requestParameters: PermissionRequestCreateMagicAuthorizationGrantOperationRequest,
  ) => Promise<{ code: string }>;
};

const SCOPES = [
  {
    scopeType: 'openid',
    operations: ['read'],
  },
  {
    scopeType: 'credentials',
    operations: ['read'],
  },
  {
    scopeType: 'profile',
    operations: ['read'],
  },
  {
    scopeType: 'age',
    operations: ['read'],
  },
  {
    scopeType: 'roles',
    operations: ['read'],
  },
  {
    scopeType: 'premium',
    operations: ['read'],
  },
  {
    scopeType: 'verification',
    operations: ['read'],
  },
];

// Generates a 44-character URL-safe base64 code
function generateUrlSafeBase64Code(): string {
  // 44 base64 chars = 33 bytes (since 33 * 4 / 3 = 44)
  const bytes = crypto.randomBytes(33);
  return bytes
    .toString('base64')
    .replace(/\+/g, '-') // URL safe: replace + with -
    .replace(/\//g, '_') // URL safe: replace / with _
    .replace(/=+$/, ''); // Remove any trailing =
}

const fetchMagicToken = async ({
  clientId,
  bedev2BasePath,
}: {
  clientId: string;
  bedev2BasePath: string;
}) => {
  const config = new Configuration({ basePath: `${bedev2BasePath}/oauth`, credentials: 'include' });
  const client = new PermissionRequestApi(config) as PermissionRequestApiWithMagicGrant;

  const nonce = crypto.randomBytes(64).toString('base64');
  try {
    const ixpResults = await fetchIXPParameters(bedev2BasePath);

    // If enableDummyCode is true, return a dummy code
    if (ixpResults?.enableDummyCodeInInstaller) {
      return generateUrlSafeBase64Code();
    }

    // Only proceed if enablePersonalizedInstaller or enablePersonalizedInstallerInMac is true
    if (
      !ixpResults ||
      (!ixpResults.enablePersonalizedInstaller && !ixpResults.enablePersonalizedInstallerInMac)
    ) {
      return undefined;
    }

    if (typeof client.permissionRequestCreateMagicAuthorizationGrant !== 'function') {
      return undefined;
    }

    const createTokenRequest: PermissionRequestCreateMagicAuthorizationGrantOperationRequest = {
      permissionRequestCreateMagicAuthorizationGrantRequest: {
        clientId,
        scopes: SCOPES,
        nonce,
      },
    };
    const magicTokenResponse =
      await client.permissionRequestCreateMagicAuthorizationGrant(createTokenRequest);

    return magicTokenResponse.code;
  } catch {
    return undefined;
  }
};

export default fetchMagicToken;
