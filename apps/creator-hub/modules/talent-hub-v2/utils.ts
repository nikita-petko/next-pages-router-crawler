import { hasResponseStatus } from './api/apiUtils';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const RELATIVE_DATE_CUTOFF_DAYS = 30;
const SHORT_WEEK_CUTOFF_DAYS = 7;
const SHORT_ABSOLUTE_CUTOFF_DAYS = 60;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const ROBLOX_COMMUNITY_PATH = 'https://www.roblox.com/communities';
const ROBLOX_COMMUNITY_ABOUT_HASH = '#!/about';

export function toRobloxCommunityAboutHref(
  groupHref?: string | null,
  groupId?: number | null,
): string | undefined {
  if (groupHref?.trim()) {
    const [base] = groupHref.trim().split('#');
    const normalizedBase = base.replace(
      /^https:\/\/www\.roblox\.com\/groups\/(\d+)(\/.*)?$/i,
      `${ROBLOX_COMMUNITY_PATH}/$1$2`,
    );
    return `${normalizedBase}${ROBLOX_COMMUNITY_ABOUT_HASH}`;
  }
  if (groupId != null) {
    return `${ROBLOX_COMMUNITY_PATH}/${groupId}${ROBLOX_COMMUNITY_ABOUT_HASH}`;
  }
  return undefined;
}

/**
 * Whether to use mock data instead of hitting the real API.
 *
 * Enabled by NEXT_PUBLIC_USE_TALENT_HUB_MOCKS=true at build time,
 * or ?mocks=1 at runtime (persisted to sessionStorage for the tab).
 * ?mocks=0 clears the persisted flag.
 */
const ENV_MOCKS = ['true', '1'].includes(
  (process.env.NEXT_PUBLIC_USE_TALENT_HUB_MOCKS ?? '').toLowerCase(),
);

const MOCKS_STORAGE_KEY = 'th2_mocks';
const LOCAL_MODE_STORAGE_KEY = 'th2_local_mode';

/**
 * Runtime URL overrides are allowed in non-production targets and sitetest hosts.
 * This keeps QA toggles available for st1/design validation without exposing them on prod hosts.
 *
 * TEMPORARY: remove this override gate in the first TH2 cleanup PR after the
 * Arrakis/Organizations/Talent Hub permissions chain is merged and deployed,
 * and st1 QA sign-off is complete.
 */
export function isQaOverrideHostAllowed(hostname?: string, targetEnvironment?: string): boolean {
  const resolvedHost =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '');
  const resolvedTargetEnvironment = (
    targetEnvironment ??
    process.env.targetEnvironment ??
    ''
  ).toLowerCase();

  const isProductionTarget = resolvedTargetEnvironment === 'production';
  const isSitetestHost = resolvedHost.includes('sitetest');

  return !isProductionTarget || isSitetestHost;
}

function checkRuntimeMocks(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    if (!isQaOverrideHostAllowed()) {
      sessionStorage.removeItem(MOCKS_STORAGE_KEY);
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get('mocks');

    if (paramValue === '1') {
      sessionStorage.setItem(MOCKS_STORAGE_KEY, '1');
      return true;
    }
    if (paramValue === '0') {
      sessionStorage.removeItem(MOCKS_STORAGE_KEY);
      return false;
    }

    return sessionStorage.getItem(MOCKS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isMocksEnabled(): boolean {
  return ENV_MOCKS || checkRuntimeMocks();
}

export function isRuntimeMocksQueryEnabled(value: string | string[] | undefined): boolean {
  if (!isQaOverrideHostAllowed()) {
    return false;
  }
  return value === '1' || (Array.isArray(value) && value.includes('1'));
}

function checkRuntimeLocalMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    if (!isQaOverrideHostAllowed()) {
      sessionStorage.removeItem(LOCAL_MODE_STORAGE_KEY);
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get('local');
    if (paramValue === '1') {
      sessionStorage.setItem(LOCAL_MODE_STORAGE_KEY, '1');
      return true;
    }
    if (paramValue === '0') {
      sessionStorage.removeItem(LOCAL_MODE_STORAGE_KEY);
      return false;
    }
    return sessionStorage.getItem(LOCAL_MODE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Full local TH2 fallback mode: skip auth-dependent gating when ST env auth is down.
 * Must be explicitly enabled via `?local=1` and only works when `mocks=1` is on.
 */
export function isLocalTh2DevModeEnabled(): boolean {
  return isMocksEnabled() && checkRuntimeLocalMode();
}

/**
 * QA-only override that, when combined with mocks, makes `useMyTalentProfile`
 * return `null` so the "create a profile before applying" branch of the
 * Apply dialog can be exercised locally without needing an age-verified
 * account on ST1. Scoped behind the same non-production host gate as
 * `isMocksEnabled` so it never leaks onto prod.
 *
 * Enable with `?mocks=1&noProfile=1`. Disable with `?noProfile=0`.
 */
export function isNoProfileMockEnabled(): boolean {
  if (!isMocksEnabled()) {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    if (!isQaOverrideHostAllowed()) {
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get('noProfile');
    if (paramValue === '1') {
      sessionStorage.setItem('th2_no_profile', '1');
      return true;
    }
    if (paramValue === '0') {
      sessionStorage.removeItem('th2_no_profile');
      return false;
    }
    return sessionStorage.getItem('th2_no_profile') === '1';
  } catch {
    return false;
  }
}

/**
 * QA-only override that, when combined with mocks, makes `useMyApplications`
 * return an empty array so the "No applications yet" empty state can be
 * verified locally. Scoped behind the same non-production host gate as
 * `isMocksEnabled` so it never leaks onto prod.
 *
 * Enable with `?mocks=1&noApps=1`. Disable with `?noApps=0`.
 */
export function isNoApplicationsMockEnabled(): boolean {
  if (!isMocksEnabled()) {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    if (!isQaOverrideHostAllowed()) {
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get('noApps');
    if (paramValue === '1') {
      sessionStorage.setItem('th2_no_apps', '1');
      return true;
    }
    if (paramValue === '0') {
      sessionStorage.removeItem('th2_no_apps');
      return false;
    }
    return sessionStorage.getItem('th2_no_apps') === '1';
  } catch {
    return false;
  }
}

/**
 * QA-only override that, when combined with mocks, starts the apply flow with
 * no default resumes so required-upload validation can be verified locally.
 *
 * Enable with `?mocks=1&noResumes=1`. Disable with `?noResumes=0`.
 */
export function isNoResumesMockEnabled(): boolean {
  if (!isMocksEnabled()) {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    if (!isQaOverrideHostAllowed()) {
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get('noResumes');
    if (paramValue === '1') {
      sessionStorage.setItem('th2_no_resumes', '1');
      return true;
    }
    if (paramValue === '0') {
      sessionStorage.removeItem('th2_no_resumes');
      return false;
    }
    return sessionStorage.getItem('th2_no_resumes') === '1';
  } catch {
    return false;
  }
}

/**
 * QA-only override that, when combined with mocks, makes `useMyStudios` return
 * an empty studios list so the new-studio onboarding flow (empty state →
 * criteria → form) can be verified locally without first deleting the mock
 * studio. Scoped behind the same non-production host gate as `isMocksEnabled`
 * so it never leaks onto prod.
 *
 * Enable with `?mocks=1&noStudios=1`. Disable with `?noStudios=0`.
 */
export function isNoStudiosMockEnabled(): boolean {
  if (!isMocksEnabled()) {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    if (!isQaOverrideHostAllowed()) {
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get('noStudios');
    if (paramValue === '1') {
      sessionStorage.setItem('th2_no_studios', '1');
      return true;
    }
    if (paramValue === '0') {
      sessionStorage.removeItem('th2_no_studios');
      return false;
    }
    return sessionStorage.getItem('th2_no_studios') === '1';
  } catch {
    return false;
  }
}

/**
 * QA-only override that, when combined with mocks, makes job list queries return
 * no jobs so the onboarded-studio empty state can be verified locally.
 *
 * Enable with `?mocks=1&noJobs=1`. Disable with `?noJobs=0`.
 */
export function isNoJobsMockEnabled(): boolean {
  if (!isMocksEnabled()) {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    if (!isQaOverrideHostAllowed()) {
      return false;
    }
    const params = new URLSearchParams(window.location.search);
    const paramValue = params.get('noJobs');
    if (paramValue === '1') {
      sessionStorage.setItem('th2_no_jobs', '1');
      return true;
    }
    if (paramValue === '0') {
      sessionStorage.removeItem('th2_no_jobs');
      return false;
    }
    return sessionStorage.getItem('th2_no_jobs') === '1';
  } catch {
    return false;
  }
}

export const USE_MOCKS = ENV_MOCKS;

/**
 * Shared React Query options for all TH2 queries.
 * Disables retry when hitting the real backend so errors surface immediately
 * instead of waiting ~15 s for 3 exponential-backoff retries to CORS/network failures.
 */
export const TH2_QUERY_OPTIONS = {
  retry: false as const,
};

export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffDays <= 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < RELATIVE_DATE_CUTOFF_DAYS) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Compact variant for job-list meta rows: "3d ago", "2w ago", "4mo ago",
 * falling back to an absolute date once a post crosses ~60 days so the
 * card never renders "9w ago" style noise.
 */
export function formatRelativeTimeShort(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffDays <= 0) {
    return 'Today';
  }
  if (diffDays < SHORT_WEEK_CUTOFF_DAYS) {
    return `${diffDays}d ago`;
  }
  if (diffDays < SHORT_ABSOLUTE_CUTOFF_DAYS) {
    return `${Math.floor(diffDays / SHORT_WEEK_CUTOFF_DAYS)}w ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getEnumLabel(
  mapping: Record<number, string>,
  value: number,
  fallback: string,
): string {
  return mapping[value] ?? fallback;
}

export function extractGameName(url: string): string {
  try {
    const { pathname } = new URL(url);
    const slug = pathname.split('/').pop() ?? '';
    return slug.replaceAll('-', ' ').replaceAll('#!', '').trim() || url;
  } catch {
    return url;
  }
}

export function parseUniverseIdFromUrl(url: string): number | null {
  try {
    const match = new URL(url).pathname.match(/\/games\/(\d+)/);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

export function isPermissionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (hasResponseStatus(error)) {
    const { status } = error.response;
    return status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN;
  }
  return false;
}

export type ApplyTarget =
  | { kind: 'email'; href: string }
  | { kind: 'url'; href: string }
  | { kind: 'none' };

function normalizeUrl(value: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return `https://${value}`;
}

export function resolveApplyTarget(
  applyMethod: string | undefined,
  studioEmail?: string | null,
  studioUrl?: string | null,
): ApplyTarget {
  const raw = applyMethod?.trim() ?? '';
  if (raw.startsWith('mailto:')) {
    return { kind: 'email', href: raw };
  }
  if (raw && raw.includes('@') && !raw.includes('://')) {
    return { kind: 'email', href: `mailto:${raw}` };
  }
  const urlCandidate = raw || (studioUrl?.trim() ?? '');
  if (urlCandidate) {
    return { kind: 'url', href: normalizeUrl(urlCandidate) };
  }
  const emailCandidate = raw || (studioEmail?.trim() ?? '');
  if (emailCandidate) {
    return { kind: 'email', href: `mailto:${emailCandidate}` };
  }
  return { kind: 'none' };
}

export type TranslateFn = (key: string, args?: Record<string, string>) => string;

export function getApplyDisabledTooltip(
  isInStudio: boolean,
  isAgeRequired: boolean,
  translate: TranslateFn,
  hasApplied?: boolean,
): string | undefined {
  if (hasApplied) {
    return translate('Tooltip.AlreadyApplied');
  }
  if (isInStudio) {
    return translate('Tooltip.SwitchToPersonalAccount');
  }
  if (isAgeRequired) {
    return translate('Tooltip.AgeVerificationRequired');
  }
  return undefined;
}

export type ApplyDisabledBanner = {
  message: string;
  actionLabel: string;
  actionHref: string;
  external?: boolean;
};

export function getApplyDisabledBanner(
  isInStudio: boolean,
  isAgeRequired: boolean,
  translate: TranslateFn,
  hasApplied?: boolean,
): ApplyDisabledBanner | undefined {
  if (hasApplied) {
    return {
      message: translate('Banner.AlreadyApplied'),
      actionLabel: translate('Action.ViewApplications'),
      actionHref: '/hire/my-profile/applied',
    };
  }
  if (isInStudio) {
    return {
      message: translate('Banner.SwitchToPersonalAccount'),
      actionLabel: '',
      actionHref: '',
    };
  }
  if (isAgeRequired) {
    return {
      message: translate('Banner.AgeVerificationRequired'),
      actionLabel: translate('Action.VerifyAge'),
      actionHref: 'https://www.roblox.com/my/account#!/info',
      external: true,
    };
  }
  return undefined;
}

export type SocialPlatform = 'x' | 'youtube' | 'twitch' | 'generic';

export function detectPlatform(url: string): SocialPlatform {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('x.com') || host.includes('twitter.com')) {
      return 'x';
    }
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      return 'youtube';
    }
    if (host.includes('twitch.tv')) {
      return 'twitch';
    }
  } catch {
    /* ignore bad URLs */
  }
  return 'generic';
}

// ── Job work arrangement + free-text location (TH2) ─────────────────────────
// OpenAPI has a single `location` string (Remote / Onsite / Hybrid) and no
// `locationDetail` field. Specific places (e.g. "San Francisco, CA") are stored
// in the job description using the suffix below until the API adds a field.

export const JOB_WORK_ARRANGEMENTS = ['Remote', 'Onsite', 'Hybrid'] as const;
export type JobWorkArrangement = (typeof JOB_WORK_ARRANGEMENTS)[number];

export function isJobWorkArrangement(value: string): value is JobWorkArrangement {
  return (JOB_WORK_ARRANGEMENTS as readonly string[]).includes(value);
}

/**
 * Interprets the API `location` string: either a work-arrangement label or
 * legacy free-text stored only in `location`.
 */
export function parseStoredJobLocation(raw: string | undefined | null): {
  arrangement: string;
  legacyDetailFromLocationField: string;
} {
  const v = (raw ?? '').trim();
  if (isJobWorkArrangement(v)) {
    return { arrangement: v, legacyDetailFromLocationField: '' };
  }
  if (v) {
    return { arrangement: 'Onsite', legacyDetailFromLocationField: v };
  }
  return { arrangement: '', legacyDetailFromLocationField: '' };
}

export function splitDescriptionWorkLocation(description: string | undefined | null): {
  body: string;
  detail: string;
} {
  const full = description ?? '';
  const mTrailing = full.match(/\n\nWork location:\s*(.+)$/s);
  if (mTrailing?.index !== undefined) {
    return {
      body: full.slice(0, mTrailing.index).replace(/\s+$/u, ''),
      detail: mTrailing[1].trim(),
    };
  }
  const trimmed = full.trim();
  const mOnly = trimmed.match(/^Work location:\s*(.+)$/s);
  if (mOnly) {
    return { body: '', detail: mOnly[1].trim() };
  }
  return { body: full, detail: '' };
}

export function composeDescriptionWithWorkLocation(
  body: string,
  _arrangement: string,
  detail: string,
): string {
  const b = body.trim();
  const d = detail.trim();
  if (!d) {
    return b;
  }
  const suffix = `\n\nWork location: ${d}`;
  return b ? `${b}${suffix}` : `Work location: ${d}`;
}
