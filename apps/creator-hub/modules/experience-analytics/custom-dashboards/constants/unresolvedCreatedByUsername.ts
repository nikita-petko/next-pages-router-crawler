/**
 * Validator-satisfying placeholder when the custom-dashboards API returns
 * attribution ids without usernames. Rendering surfaces must treat this
 * sentinel as unresolved and show their translated fallback instead of
 * displaying it as a real username.
 */
export const UNRESOLVED_CREATED_BY_USERNAME = 'Unknown';
