import { getConfig } from './config/base';
import { contextualNamespaceResponseSchema, staticNamespaceResponseSchema } from './schema';
import type { TFlagContext } from './types';

const namespaceCache = new Map<string, Record<string, unknown>>();
const namespaceRequests = new Map<string, Promise<Record<string, unknown>>>();

// * NOTE(@zwang, 04/08/26): prefer simplicity over strict typing here for cache for v1, user
// * defined type guard or advanced type inference can be v1+
export async function fetchFlag<T>(
  namespace: string,
  name: string,
  context?: TFlagContext,
): Promise<T> {
  const config = getConfig();

  // * NOTE(@zwang, 04/24/26): context always has exactly one key (universeId or groupId),
  // * so we extract the single entry to build a context-agnostic cache key.
  const [contextKey, contextValue] =
    typeof context !== 'undefined' ? (Object.entries(context).pop() ?? []) : [];
  const namespaceCacheKey =
    typeof contextKey !== 'undefined' && typeof contextValue !== 'undefined'
      ? `${namespace}:${contextKey}:${contextValue.toString()}`
      : namespace;

  let flags = namespaceCache.get(namespaceCacheKey);
  if (typeof flags === 'undefined') {
    let request = namespaceRequests.get(namespaceCacheKey);
    if (typeof request === 'undefined') {
      const url = new URL(
        `/barista-feature-flags/v1/applications/${config.applicationId}/namespaces/${namespace}/flags`,
        config.baseUrl,
      );
      if (typeof contextKey !== 'undefined' && typeof contextValue !== 'undefined') {
        url.searchParams.set(contextKey, contextValue.toString());
      }

      request = fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`@rbx/flags: failed to fetch namespace ${namespace}`);
          }

          const namespaceResponseSchema =
            typeof contextKey !== 'undefined'
              ? contextualNamespaceResponseSchema
              : staticNamespaceResponseSchema;
          const body = await response
            .json()
            .then((json) => namespaceResponseSchema.parseAsync(json));
          if (body.applicationId !== config.applicationId || body.namespace !== namespace) {
            throw new Error(`@rbx/flags: mismatched response for ${namespace}`);
          }

          namespaceCache.set(namespaceCacheKey, body.flags);
          return body.flags;
        })
        .finally(() => {
          namespaceRequests.delete(namespaceCacheKey);
        });

      namespaceRequests.set(namespaceCacheKey, request);
    }

    flags = await request;
  }

  if (!(name in flags)) {
    throw new Error(`@rbx/flags: flag ${namespace}/${name} does not exist`);
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- intentional for v1, see NOTE above
  return flags[name] as T;
}
