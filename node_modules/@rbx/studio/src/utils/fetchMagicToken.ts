import { PermissionRequestApi } from '@rbx/client-application-authorizations-api/v1';
import { Configuration } from '@rbx/clients-core';
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

function generateRandomBase64(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

// Generates a 44-character URL-safe base64 code
function generateUrlSafeBase64Code(): string {
  // 44 base64 chars = 33 bytes (since 33 * 4 / 3 = 44)
  return generateRandomBase64(33)
    .replaceAll('+', '-') // URL safe: replace + with -
    .replaceAll('/', '_') // URL safe: replace / with _
    .replace(/=+$/, ''); // Remove any trailing =
}

const fetchMagicToken = async ({
  clientId,
  bedev2BasePath,
}: {
  clientId: string;
  bedev2BasePath: string;
}): Promise<string | undefined> => {
  const config = new Configuration({
    basePath: `${bedev2BasePath}/oauth`,
    credentials: 'include',
    enableMrRouter: true,
  });
  const client = new PermissionRequestApi(config) as PermissionRequestApiWithMagicGrant;

  const nonce = generateRandomBase64(64);
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
