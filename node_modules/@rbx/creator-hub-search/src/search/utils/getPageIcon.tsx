import React from 'react';
import { Icon as FoundationIcon } from '@rbx/foundation-ui';
import {
  BuilderHomeIcon,
  BuilderExperiencesIcon,
  BuilderInternIcon,
  BuilderStoreIcon,
  BuilderChatSideIcon,
  BuilderWalletIcon,
  BuilderInsightsIcon,
  BuilderMegaphoneIcon,
} from '@rbx/ui';
import { DocumentationContentType } from '../../clients/docSiteSearchType';
import ExperienceIcon from '../ExperienceIcon';
import { SvgIconDocumentation } from '../searchIcons';
import { isExperienceItem, getExperienceUniverseId } from '../searchListItemUtils';
import StoreAssetIcon from '../StoreAssetIcon';
import type { TSearchListItem } from '../types/SearchListItem';

/**
 * An icon rule is either a static element or a function that resolves one
 * from the search item (e.g. experience thumbnail needs the universe ID).
 */
type IconRule = React.ReactElement | ((item: TSearchListItem) => React.ReactElement);

// ─── URL path → icon mapping ──────────────────────────────────────────────────
//
// Each key is a URL pathname prefix. getPageIcon() first tries an exact lookup,
// then walks up parent path segments until a match is found (same algorithm as
// permissionTypes.ts / shouldShowPage).
//
// e.g. "/dashboard/creations/experiences/123/overview"
//   → "/dashboard/creations/experiences/123" (miss)
//   → "/dashboard/creations/experiences" (match → ExperienceIcon resolver)
//
// Values can be:
//   - React.ReactElement  — static icon (most rules)
//   - (item) => ReactElement — dynamic resolver when the icon depends on item
//     data (e.g. experience thumbnail needs the universe ID)
//
// Source of truth: icons and active-state logic from PrimaryRailContent.tsx
// @see PrimaryRailContent.tsx — `@packages/creator-hub-navigation`
//   primaryRail/components/PrimaryRailContent.tsx
// @see useProductUrls.ts — `@packages/creator-hub-navigation`
//   utils/useProductUrls.ts (defines Dashboard.*, Store.*, etc.)
//
// ┌────────────────────────────────────────────────────────────────────┐
// │ Rail Section  │ Icon (inactive)       │ Key / URL pattern         │
// ├────────────────────────────────────────────────────────────────────┤
// │ Experience    │ ExperienceIcon (thumb) │ /dashboard/creations/    │
// │               │  or BuilderExperiences │   experiences (fn)       │
// │ Creations     │ BuilderExperiencesIcon │ /dashboard/creations     │
// │ Analytics     │ BuilderInsightsIcon    │ /dashboard/analytics     │
// │ Finances      │ BuilderWalletIcon      │ /dashboard/devex, etc.   │
// │ Updates       │ FoundationIcon*        │ /updates                 │
// │ Ads           │ BuilderMegaphoneIcon   │ /advertise               │
// │ Store         │ BuilderStoreIcon       │ /store                   │
// │ Learn         │ BuilderInternIcon      │ /docs                    │
// │ Forum         │ BuilderChatSideIcon    │ /devforum                │
// │ Home          │ BuilderHomeIcon        │ / (exact only)           │
// └────────────────────────────────────────────────────────────────────┘
//
// * Updates uses FoundationIcon (icon-regular-curved-rectangle-megaphone)
//   matching the rail exactly.
// ───────────────────────────────────────────────────────────────────────────────

const PAGE_ICON_RULES: Record<string, IconRule> = {
  // ── Experiences — dynamic resolver ──
  // Returns ExperienceIcon thumbnail when a universe ID can be resolved,
  // otherwise falls back to BuilderExperiencesIcon (same as Creations).
  '/dashboard/creations/experiences': (item) => {
    const universeId = isExperienceItem(item) ? getExperienceUniverseId(item) : null;
    if (universeId) {
      return <ExperienceIcon universeId={universeId} name={item.title} />;
    }
    return <BuilderExperiencesIcon />;
  },

  // ── Creations (walk-up covers all sub-pages) ──
  // Rail: BuilderExperiencesIcon (PrimaryRailContent line 203)
  '/dashboard/creations': <BuilderExperiencesIcon />,

  // ── Analytics ──
  // Rail: BuilderInsightsIcon (PrimaryRailContent line 271)
  '/dashboard/analytics': <BuilderInsightsIcon />,

  // ── Finances — exact pathname matches ──
  // Rail: BuilderWalletIcon (PrimaryRailContent line 261)
  // @see PrimaryRailContent.tsx — `financesPaths` array
  '/dashboard/devex': <BuilderWalletIcon />,
  '/dashboard/transactions': <BuilderWalletIcon />,
  '/dashboard/billing': <BuilderWalletIcon />,
  '/dashboard/account-information': <BuilderWalletIcon />,
  '/dashboard/payments': <BuilderWalletIcon />,
  '/dashboard/group/payouts': <BuilderWalletIcon />,

  // ── Updates ──
  // Rail: FoundationIcon 'icon-regular-curved-rectangle-megaphone' (PrimaryRailContent line 247)
  '/updates': <FoundationIcon name='icon-regular-curved-rectangle-megaphone' size='Medium' />,

  // ── Ads ──
  // Rail: BuilderMegaphoneIcon (PrimaryRailContent line 281)
  '/advertise': <BuilderMegaphoneIcon />,

  // ── Store assets (search results) — dynamic resolver ──
  // Creator Store search results (path /store/asset/<id>) render the asset's
  // own thumbnail instead of the generic store icon. Falls back to
  // BuilderStoreIcon when the item isn't a Store result or has no asset id.
  '/store/asset': (item) => {
    if (
      item.documentationContentType === DocumentationContentType.Store &&
      item.storeThumbnailAssetId
    ) {
      return <StoreAssetIcon assetId={item.storeThumbnailAssetId} name={item.title} />;
    }
    return <BuilderStoreIcon />;
  },

  // ── Store ──
  // Rail: BuilderStoreIcon (PrimaryRailContent line 226)
  '/store': <BuilderStoreIcon />,

  // ── Learn ──
  // Rail: BuilderInternIcon (PrimaryRailContent line 214)
  '/docs': <BuilderInternIcon />,

  // ── Forum ──
  // Rail: BuilderChatSideIcon (PrimaryRailContent line 236)
  '/devforum': <BuilderChatSideIcon />,
};

const HOME_ICON = <BuilderHomeIcon />;
const DEFAULT_ICON = <SvgIconDocumentation />;

/**
 * Extracts the pathname from a full URL or relative path.
 * Handles both "https://host:port/path?query" and "/path?query".
 */
function extractPathname(urlOrPath: string): string {
  try {
    return new URL(urlOrPath).pathname;
  } catch {
    return urlOrPath.split('?')[0];
  }
}

/**
 * Walk-up resolution: splits the pathname on "/" and pops segments until a
 * match is found in PAGE_ICON_RULES, mirroring the algorithm in
 * permissionTypes.ts / shouldShowPage().
 *
 * When the matched rule is a function, it is called with the item so it
 * can resolve dynamic icons (e.g. experience thumbnail).
 */
function resolvePathIcon(pathname: string, item: TSearchListItem): React.ReactElement {
  if (pathname === '/') {
    return HOME_ICON;
  }

  const segments = pathname.split('/');
  while (segments.length > 1) {
    const candidatePath = segments.join('/');
    const rule = PAGE_ICON_RULES[candidatePath];
    if (rule) {
      return typeof rule === 'function' ? rule(item) : rule;
    }
    segments.pop();
  }
  return DEFAULT_ICON;
}

/**
 * Resolves the IA (Information Architecture) icon for a Creator Hub page.
 * Matches the icons used in the navigation rail.
 *
 * Resolution order (via walk-up):
 * 1. Exact pathname lookup in PAGE_ICON_RULES
 * 2. Pop last segment and retry until a match (layered resolution)
 * 3. Fallback — SvgIconDocumentation
 *
 * Function-valued rules (e.g. /dashboard/creations/experiences) receive the
 * full item so they can resolve dynamic icons like experience thumbnails.
 *
 * Accepts both full URLs (e.g. "https://host/dashboard/creations")
 * and relative paths (e.g. "/dashboard/creations").
 */
export default function getPageIcon(item: TSearchListItem): React.ReactElement {
  if (!item.path) {
    return DEFAULT_ICON;
  }

  const pathname = extractPathname(item.path).replace(/\/$/, '') || '/';
  return resolvePathIcon(pathname, item);
}
