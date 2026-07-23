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
  if (typeof window === 'undefined') return false;
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

export const USE_MOCKS = ENV_MOCKS;

export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
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
    return slug.replace(/-/g, ' ').replace(/#!/g, '').trim() || url;
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

  const status = (error as Error & { response?: { status?: number } }).response?.status;
  return status === 401 || status === 403;
}

export type ApplyTarget =
  | { kind: 'email'; href: string }
  | { kind: 'url'; href: string }
  | { kind: 'none' };

function normalizeUrl(value: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://${value}`;
}

export function resolveApplyTarget(
  applyMethod: string | undefined,
  studioEmail?: string | null,
  studioUrl?: string | null,
): ApplyTarget {
  const raw = applyMethod?.trim() ?? '';
  if (raw.startsWith('mailto:')) return { kind: 'email', href: raw };
  if (raw && raw.includes('@') && !raw.includes('://'))
    return { kind: 'email', href: `mailto:${raw}` };
  const urlCandidate = raw || studioUrl?.trim() || '';
  if (urlCandidate) return { kind: 'url', href: normalizeUrl(urlCandidate) };
  const emailCandidate = raw || studioEmail?.trim() || '';
  if (emailCandidate) return { kind: 'email', href: `mailto:${emailCandidate}` };
  return { kind: 'none' };
}

const TOOLTIP_STUDIO_CONTEXT = 'Switch to your personal account to apply.';
const TOOLTIP_AGE_VERIFICATION =
  'Age verification required. Verify your age in Roblox account settings.';

export function getApplyDisabledTooltip(
  isInStudio: boolean,
  isAgeRequired: boolean,
): string | undefined {
  if (isInStudio) return TOOLTIP_STUDIO_CONTEXT;
  if (isAgeRequired) return TOOLTIP_AGE_VERIFICATION;
  return undefined;
}

export type SocialPlatform = 'x' | 'youtube' | 'twitch' | 'generic';

export function detectPlatform(url: string): SocialPlatform {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('twitch.tv')) return 'twitch';
  } catch {
    /* ignore bad URLs */
  }
  return 'generic';
}
