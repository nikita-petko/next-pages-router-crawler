/**
 * Permission checking for search result filtering.
 *
 * NOTE(@neoxu 2026-02-13): For MVP this is duplicated from creator-hub's navigation logic.
 * Post-MVP, move permission control into a shared package across products.
 *
 * Source of truth: apps/creator-hub/modules/experience-navigation/constants/index.ts
 * Each page's `isEnabledOnSettings` in the nav constants defines its permission
 * requirements. This file replicates that logic so search results are filtered
 * before they reach the user.
 *
 * Algorithm (shouldShowPage):
 *   1. Strip the experience base path prefix (numeric IDs only via \d+ regex)
 *   2. Strip query parameters (no tab-level permission control)
 *   3. Look up the remaining path suffix in EXPERIENCE_PAGE_PERMISSION_RULES
 *   4. If no exact match, walk up parent path segments until a rule is found
 *   5. If no rule matches at any level → default to NOT visible (fail-closed)
 *
 * Feature-flag checks (enableEnvironments, isPriceOptimizationEnabled, etc.)
 * are intentionally skipped for MVP — the page-level gate handles those.
 */

/**
 * Subset of TNavigationSettings used for search result permission filtering.
 *
 * Field mapping to TNavigationSettings (experience-navigation/hooks/navigationSettings.tsx):
 *   canConfigure              → TNavigationSettings.canConfigure
 *   userCanViewAnalyticsForUniverse → TNavigationSettings.userCanViewAnalyticsForUniverse
 *                                     (sourced from Analytics Feature Flags / Obelix)
 *   monetizeExperience        → TNavigationSettings.permissions.monetizeExperience
 *
 * @TODO(@neoxu 2026-02-18): Add more fields from TNavigationSettings as needed
 *   (e.g. isOwner, isLuobu, locale, feature flags).
 */
export interface ExperiencePermissions {
  /** TNavigationSettings.canConfigure — whether the user can edit/configure the experience */
  canConfigure: boolean;
  /** TNavigationSettings.userCanViewAnalyticsForUniverse — analytics access (from Obelix feature permissions) */
  userCanViewAnalyticsForUniverse: boolean;
  /** TNavigationSettings.permissions.monetizeExperience — monetization access */
  monetizeExperience: boolean;
}

/**
 * Full permissions for experience owners (personal experiences).
 * Owner always has all permissions — no API calls needed.
 */
export const OWNER_PERMISSIONS: ExperiencePermissions = {
  canConfigure: true,
  userCanViewAnalyticsForUniverse: true,
  monetizeExperience: true,
};

const DEFAULT_PERMISSION = false;

// ─── URL path → permission check mapping ─────────────────────────────────────
//
// Each key is the path suffix after stripping the experience base path,
// e.g. "/analytics/retention". shouldShowPage() first tries an exact lookup,
// then walks up parent segments until a match is found.
//
// Source of truth: experience-navigation/constants/index.ts isEnabledOnSettings
//
// Pages NOT listed here are hidden by default (fail-closed). If a sub-path
// like "/places/{placeId}/configure" has no entry, the walk-up algorithm
// resolves it to "/places" (canConfigure).
//
// Feature flags (enableEnvironments, isPriceOptimizationEnabled, isLuobu, etc.)
// are intentionally skipped for MVP — the page-level gate handles those.
// ─────────────────────────────────────────────────────────────────────────────

type PermissionCheck = (p: ExperiencePermissions) => boolean;

const viewAnalytics: PermissionCheck = (p) => p.userCanViewAnalyticsForUniverse;
const canConfigure: PermissionCheck = (p) => p.canConfigure;
const alwaysVisible: PermissionCheck = () => true;

const EXPERIENCE_PAGE_PERMISSION_RULES: Record<string, PermissionCheck> = {
  // ── Root pages (no isEnabledOnSettings in nav → always visible) ──
  '/overview': alwaysVisible, // TODO(@neoxu 2026-02-18): To not search result for an experience but a user able to see this experiences in the creations page
  '/activity-history': viewAnalytics,
  '/moderation/bans': viewAnalytics,

  // ── Analytics (viewAnalytics) ──
  '/analytics/engagement': viewAnalytics,
  '/analytics/retention': viewAnalytics,
  '/analytics/acquisition': viewAnalytics,
  '/analytics/performance': viewAnalytics,
  '/analytics/funnels': viewAnalytics,
  '/analytics/economy': viewAnalytics,
  '/analytics/custom': viewAnalytics,
  '/analytics/audience': viewAnalytics,
  '/analytics/explore': viewAnalytics,
  // feedback: viewAnalytics + enablePlayerFeedback flag (flag skipped)
  '/feedback': viewAnalytics,

  // ── Safety (viewAnalytics) ──
  '/safety/overview': viewAnalytics,
  // TODO(@neoxu 2026-02-18): Need to confirm with Hub Team
  '/safety/bans': viewAnalytics,

  // ── Services — analytics dashboards (viewAnalytics) ──
  '/analytics/data-stores': viewAnalytics,
  '/analytics/memory-stores': viewAnalytics,
  // speech-to-text: viewAnalytics + showSpeechToTextDashboard flag (flag skipped)
  '/analytics/speech-to-text': viewAnalytics,
  // text-to-speech: viewAnalytics + showTextToSpeechDashboard flag (flag skipped)
  '/analytics/text-to-speech': viewAnalytics,
  '/analytics/errors': viewAnalytics,
  // remote configs: viewAnalytics + remoteConfigsEnabled flag (flag skipped)
  '/analytics/configs': viewAnalytics,
  // data-stores dashboard (old nav path, different from /analytics/data-stores)
  '/data-stores': viewAnalytics,
  // remote configs (old nav path, different from /analytics/configs)
  '/configs': viewAnalytics,
  // experiments: canConfigure || viewAnalytics + flag (flag skipped, approximate with viewAnalytics)
  '/experiments': viewAnalytics,

  // ── Monetization ──
  '/monetization/overview': viewAnalytics,
  '/monetization/creator-rewards': viewAnalytics,
  // canConfigure && isPriceOptimizationEnabled (flag skipped)
  '/monetization/price-optimization': canConfigure,
  // old URL still in crawled data — same rule as price-optimization
  '/monetization/price-check': canConfigure,
  // canConfigure && (enableCommerce || isCommercePilotEnabled) (flags skipped)
  '/monetization/commerce': canConfigure,
  '/monetization/immersive-ads': (p) => p.canConfigure && p.userCanViewAnalyticsForUniverse,
  '/monetization/avatar-items': (p) => p.canConfigure && p.userCanViewAnalyticsForUniverse,
  '/monetization/developer-products': (p) => p.canConfigure || p.userCanViewAnalyticsForUniverse,
  '/monetization/passes': (p) => p.canConfigure || p.userCanViewAnalyticsForUniverse,
  '/monetization/subscriptions': (p) => p.canConfigure || p.userCanViewAnalyticsForUniverse,
  // isAvatarCreationTokensEnabled (feature flag only — hidden without flag)
  '/monetization/avatar-creation-tokens': () => false,

  // ── Content — engage ──
  // TODO(@neoxu 2026-02-18): Add `canConfigureExperienceEvents`
  // (canConfigureExperienceEvents && isOwner) || viewAnalytics — approximate with viewAnalytics
  '/events': viewAnalytics,
  // viewAnalytics + recommendationServiceEnabled flag (flag skipped)
  '/recommendation-service': viewAnalytics,
  '/notifications': canConfigure,
  // canConfigure && isOwner (isOwner unavailable — approximate with canConfigure)
  '/referral-reward-details': canConfigure,
  // !isLuobu && canConfigure && locale.startsWith('en-') (isLuobu/locale unavailable)
  '/community': canConfigure,
  '/localization': canConfigure,
  '/social-links': canConfigure,

  // ── Content — build (canConfigure) ──
  '/places': canConfigure,
  '/permissions': canConfigure,
  '/associated-items': canConfigure,
  // canConfigure && enableEnvironments flag (flag skipped)
  '/environments': canConfigure,

  // ── Content — create actions (canConfigure) ──
  '/developer-products': canConfigure,
  '/passes': canConfigure,
  '/experience-subscriptions': canConfigure,

  // ── Services — configure (canConfigure) ──
  '/extended-services': canConfigure,
  '/data-stores-manager': canConfigure,
  // !isLuobu && canConfigure (isLuobu unavailable)
  '/api-settings': canConfigure,
  // !isLuobu && canConfigure (isLuobu unavailable)
  '/secrets': canConfigure,
  '/matchmaking': canConfigure,
  '/server-management': canConfigure,

  // ── Settings (canConfigure) ──
  '/configure': canConfigure,
  // !isLuobu && canConfigure (isLuobu unavailable)
  '/access': canConfigure,
  // canConfigure + questionnaire version flags (flags skipped)
  '/experience-questionnaire': canConfigure,
  // !isLuobu && canConfigure (isLuobu unavailable)
  '/communication-settings': canConfigure,
  '/collaborators': alwaysVisible,
};

/**
 * Regex to match the experience base path prefix.
 * Matches any non-slash segment after /experiences/ — handles both numeric IDs
 * (e.g. "123456") and template variables (e.g. "{experienceId}") because
 * buildDataset passes doc.identifier before template substitution.
 */
const EXPERIENCE_PATH_PREFIX = /^\/dashboard\/creations\/experiences\/[^/]+/;

export const removeExperienceBasePath = (identifier: string): string => {
  return identifier.replace(EXPERIENCE_PATH_PREFIX, '').trim();
};

/**
 * Determines if a page should be shown to the user based on their permissions.
 *
 * 1. Strips the experience base path prefix → page suffix (e.g. "/analytics/retention")
 * 2. Strips query parameters (e.g. "?tab=Analytics")
 * 3. Exact lookup on the suffix in EXPERIENCE_PAGE_PERMISSION_RULES
 * 4. If no exact match, pops the last path segment and retries (walk-up).
 *    e.g. "/places/{placeId}/configure" → "/places/{placeId}" → "/places" (match)
 * 5. If no rule matches at any level → returns false (fail-closed, page hidden)
 *
 * @param identifier - Full document URL path (e.g. "/dashboard/creations/experiences/123/analytics/retention")
 * @param permissions - The user's resolved permissions for this experience's group
 * @returns true if the page should appear in search results, false otherwise
 */
export function shouldShowPage(identifier: string, permissions: ExperiencePermissions): boolean {
  const experienceIdentifier = removeExperienceBasePath(identifier);
  // NOTE(@neoxu 2026-02-18): We need to strip the query parameters from the experience identifier since we don't support tab level permission control
  const experienceIdentifierWithoutQueryParams = experienceIdentifier.split('?')[0];
  const experienceIdentifierPillar = experienceIdentifierWithoutQueryParams.split('/');
  while (experienceIdentifierPillar.length > 0) {
    const candidatePath = `${experienceIdentifierPillar.join('/')}`;
    if (EXPERIENCE_PAGE_PERMISSION_RULES[candidatePath]) {
      return EXPERIENCE_PAGE_PERMISSION_RULES[candidatePath](permissions);
    }
    experienceIdentifierPillar.pop();
  }
  return DEFAULT_PERMISSION;
}
