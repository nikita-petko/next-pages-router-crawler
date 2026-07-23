/**
 * Short opaque ids for tiles + dashboards. Service code funnels all id
 * generation through `IdFactory` so tests can inject deterministic factories.
 *
 * TODO(server-backend): when M1 localStorage gives way to a real backend
 * service, switch `newOpaqueId` from UUID v4 to v7. v7 ids are time-ordered,
 * friendlier to B-tree indexes if the server uses the id as a clustered
 * primary key, and support cursor pagination on the id alone. The swap is
 * a one-line change here — ids are opaque to consumers so call sites are
 * unaffected. Holding on v4 until the backend lands or the broader Roblox
 * stack moves; today every adjacent service is on v4 (developer-analytics
 * `Guid.NewGuid()`, experience-signals-platform `uuid.New()`).
 */

function newOpaqueId(): string {
  // UUID v4 via native crypto — no deps, secure-context safe in every
  // creator-hub deployment. See top-of-file TODO for the v7 swap path.
  return crypto.randomUUID();
}

export function createTileId(): string {
  return `tile_${newOpaqueId()}`;
}

export function createDashboardId(): string {
  return `dsh_${newOpaqueId()}`;
}

export type IdFactory = {
  nextTileId(): string;
  nextDashboardId(): string;
};

/** Default factory used when callers don't pass options. */
export const defaultIdFactory: IdFactory = {
  nextTileId: createTileId,
  nextDashboardId: createDashboardId,
};

/** Deterministic factory for tests: `tile_t_0`, `dsh_d_0`, … */
export function createDeterministicIdFactory(
  prefix: { tile?: string; dashboard?: string } = {},
): IdFactory {
  let tileCounter = 0;
  let dashboardCounter = 0;
  const tilePrefix = prefix.tile ?? 'tile_t_';
  const dashboardPrefix = prefix.dashboard ?? 'dsh_d_';
  return {
    nextTileId: () => {
      const id = `${tilePrefix}${tileCounter}`;
      tileCounter += 1;
      return id;
    },
    nextDashboardId: () => {
      const id = `${dashboardPrefix}${dashboardCounter}`;
      dashboardCounter += 1;
      return id;
    },
  };
}
