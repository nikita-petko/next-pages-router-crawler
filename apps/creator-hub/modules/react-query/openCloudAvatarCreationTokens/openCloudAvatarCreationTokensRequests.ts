import createFetchClient from '@rbx/client-open-cloud';
import type {
  AvatarCreationToken,
  AvatarCreationTokenPricingPolicy,
  GetAvatarCreationTokensPricingPolicyResponse,
  ListAvatarCreationTokensResponse,
} from '@rbx/client-open-cloud/v2';
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';

const ocApi = createFetchClient({
  baseUrl: getBEDEV2ServiceBasePath('user'),
  credentials: 'include',
  enableMrRouter: true,
});

export type {
  AvatarCreationToken,
  AvatarCreationTokenPricingPolicy,
  GetAvatarCreationTokensPricingPolicyResponse,
  ListAvatarCreationTokensResponse,
};
// `AvatarCreationTokenBody` is intentionally an alias of the model class so
// callers building requests can populate optional fields incrementally. The
// openapi-fetch generated body type marks `displayName`/`description` as
// required; we cast at the call site below since the runtime contract matches.
export type AvatarCreationTokenBody = AvatarCreationToken;

export type CreateAvatarCreationTokenParams = {
  universeId: string;
  avatarCreationToken: AvatarCreationTokenBody;
  idempotencyKey: string;
};

export type GetAvatarCreationTokenParams = {
  universeId: string;
  avatarCreationTokenId: string;
};

export type ListAvatarCreationTokensParams = {
  universeId: string;
  maxPageSize?: number;
  pageToken?: string;
  filter?: string;
};

export type UpdateAvatarCreationTokenParams = {
  universeId: string;
  avatarCreationTokenId: string;
  avatarCreationToken: AvatarCreationTokenBody;
};

export type GetPricingPolicyParams = {
  universeId: string;
};

const PATH_REGEX = /^universes\/(?<universe>[^/]+)\/avatar-creation-tokens\/(?<token>.+)$/;

function parseAvatarCreationTokenPath(path: string | null | undefined): {
  universe: string;
  avatarCreationToken: string;
} {
  const match = path?.match(PATH_REGEX);
  return {
    universe: match?.groups?.universe ?? '',
    avatarCreationToken: match?.groups?.token ?? '',
  };
}

export function getTokenIdFromPath(path: string | null | undefined): string {
  return parseAvatarCreationTokenPath(path).avatarCreationToken;
}

export function getUniverseIdFromPath(path: string | null | undefined): number {
  const universeId = parseAvatarCreationTokenPath(path).universe;
  return universeId === '' ? NaN : Number(universeId);
}

function unwrap<T>(result: { data?: unknown; error?: unknown; response: Response }): T {
  if (result.error !== undefined || !result.response.ok) {
    const reason = result.error ?? result.response;
    if (reason instanceof Error) {
      throw reason;
    }
    // Surface the OC error body's `message` as the thrown Error message so
    // downstream `parseError` can extract the `[ERROR_CODE]` bracket.
    const bodyMessage =
      reason &&
      typeof reason === 'object' &&
      'message' in reason &&
      typeof reason.message === 'string'
        ? reason.message
        : 'Open Cloud request failed';
    const wrapped = new Error(bodyMessage);
    Object.assign(wrapped, { cause: reason, response: result.response, body: result.error });
    throw wrapped;
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- openapi-fetch's response shape uses required fields while our model uses optional fields; runtime payload is structurally compatible
  return result.data as T;
}

export async function createAvatarCreationToken({
  universeId,
  avatarCreationToken,
  idempotencyKey,
}: CreateAvatarCreationTokenParams): Promise<AvatarCreationToken> {
  return unwrap(
    await ocApi.POST('/cloud/v2/universes/{universe_id}/avatar-creation-tokens', {
      params: {
        path: { universe_id: universeId },
        query: { 'idempotencyKey.key': idempotencyKey },
      },
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- model class fields are optional for ergonomic construction; runtime payload satisfies the openapi-fetch schema body type
      body: avatarCreationToken as never,
    }),
  );
}

export async function getAvatarCreationToken({
  universeId,
  avatarCreationTokenId,
}: GetAvatarCreationTokenParams): Promise<AvatarCreationToken> {
  return unwrap(
    await ocApi.GET(
      '/cloud/v2/universes/{universe_id}/avatar-creation-tokens/{avatar_creation_token_id}',
      {
        params: {
          path: {
            universe_id: universeId,
            avatar_creation_token_id: avatarCreationTokenId,
          },
        },
      },
    ),
  );
}

export async function listAvatarCreationTokens({
  universeId,
  maxPageSize,
  pageToken,
  filter,
}: ListAvatarCreationTokensParams): Promise<ListAvatarCreationTokensResponse> {
  return unwrap(
    await ocApi.GET('/cloud/v2/universes/{universe_id}/avatar-creation-tokens', {
      params: {
        path: { universe_id: universeId },
        query: { maxPageSize, pageToken, filter },
      },
    }),
  );
}

export async function updateAvatarCreationToken({
  universeId,
  avatarCreationTokenId,
  avatarCreationToken,
}: UpdateAvatarCreationTokenParams): Promise<AvatarCreationToken> {
  return unwrap(
    await ocApi.PATCH(
      '/cloud/v2/universes/{universe_id}/avatar-creation-tokens/{avatar_creation_token_id}',
      {
        params: {
          path: {
            universe_id: universeId,
            avatar_creation_token_id: avatarCreationTokenId,
          },
        },
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- model class fields are optional for ergonomic construction; runtime payload satisfies the schema body type
        body: avatarCreationToken as never,
      },
    ),
  );
}

export async function getPricingPolicy({
  universeId,
}: GetPricingPolicyParams): Promise<GetAvatarCreationTokensPricingPolicyResponse> {
  return unwrap(
    await ocApi.GET('/cloud/v2/universes/{universe_id}/avatar-creation-tokens:getPricingPolicy', {
      params: { path: { universe_id: universeId } },
    }),
  );
}
