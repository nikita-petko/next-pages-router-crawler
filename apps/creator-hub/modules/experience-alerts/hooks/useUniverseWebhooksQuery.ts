import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Webhook } from '@modules/react-query/webhooks';
import { fetchUniverseWebhooks } from '@modules/react-query/webhooks/universeWebhooksRequests';

/**
 * Query key that mirrors `UniverseWebhooksProvider` in
 * `@modules/react-query/webhooks/universeWebhooksProvider`. Reusing the key
 * means the alert form's read-only listing shares a React Query cache slot
 * with the Experience Webhooks settings page, so opening one warms the other.
 */
export const universeWebhooksQueryKey = (universeId: number | undefined) =>
  ['universeWebhooks', universeId ?? 0] as const;

/**
 * Read-only React Query hook returning the webhooks configured for an
 * experience. Lives in the experience-alerts module (rather than mounting the
 * heavier `UniverseWebhooksProvider`) so the alert pages do not have to set up
 * a `SnackbarProvider` just to consume a list. Mutations remain owned by the
 * Experience Webhooks settings page; this hook only reads.
 */
export default function useUniverseWebhooksQuery(
  universeId: number | undefined,
): UseQueryResult<Webhook[]> {
  return useQuery({
    queryKey: universeWebhooksQueryKey(universeId),
    queryFn: () => {
      if (universeId == null || !Number.isFinite(universeId) || universeId <= 0) {
        return [];
      }
      return fetchUniverseWebhooks({ universeId });
    },
    enabled: universeId != null && Number.isFinite(universeId) && universeId > 0,
  });
}
