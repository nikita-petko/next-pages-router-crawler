/**
 * Reads the per-universe dashboard cap from a list-capabilities payload.
 *
 * The backend contract treats `0` (and protobuf-omitted defaults) as "cap
 * disabled". Non-integers and non-positive values are also ignored so the
 * UI never invents a hard-coded limit independently of runtime config.
 */
export function readMaxDashboardsPerUniverse(
  capabilities: { readonly limits?: { readonly maxDashboardsPerUniverse?: number } } | undefined,
): number | undefined {
  const limit = capabilities?.limits?.maxDashboardsPerUniverse;
  return typeof limit === 'number' && Number.isSafeInteger(limit) && limit > 0 ? limit : undefined;
}
