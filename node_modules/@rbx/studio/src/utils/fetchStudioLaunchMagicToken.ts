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
  permissionRequestCreateMagicAuthorizationGrant: (
    requestParameters: PermissionRequestCreateMagicAuthorizationGrantOperationRequest,
  ) => Promise<{ code: string }>;
};

function hasMagicGrant(api: PermissionRequestApi): api is PermissionRequestApiWithMagicGrant {
  return (
    'permissionRequestCreateMagicAuthorizationGrant' in api &&
    typeof api.permissionRequestCreateMagicAuthorizationGrant === 'function'
  );
}

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

// Byte length of the cryptographic nonce. 64 bytes (512 bits) far exceeds the
// 128-bit minimum for unpredictability, giving a comfortable margin against
// brute-force/collision attacks while staying small enough to embed in the URL.
const NONCE_BYTE_LENGTH = 64;

function generateRandomBase64(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

// Mints a single-use magic authorization code to embed in the roblox-studio:
// launch deeplink so Studio can auto-login as the current Creator Hub user.
// This is a distinct code from the installer download code (fetchMagicToken) so
// the two flows redeem independently, and it is gated on its own Studio-launch
// IXP parameters. The generated PermissionRequestApi client (Configuration from
// @rbx/clients-core) already performs the XSRF 403 retry, so no manual CSRF
// handling is needed here. Returns undefined (no auto-login) when the gate is
// off or on any failure, so callers fall back to today's launch behavior.
const fetchStudioLaunchMagicToken = async ({
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
  const client = new PermissionRequestApi(config);

  const nonce = generateRandomBase64(NONCE_BYTE_LENGTH);
  try {
    const ixpResults = await fetchIXPParameters(bedev2BasePath);

    if (
      !ixpResults ||
      (!ixpResults.enablePersonalizedStudioLaunch &&
        !ixpResults.enablePersonalizedStudioLaunchInMac)
    ) {
      return undefined;
    }

    if (!hasMagicGrant(client)) {
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

export default fetchStudioLaunchMagicToken;
