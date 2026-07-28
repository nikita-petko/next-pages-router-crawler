import { LEADERBOARD_CONFIG_KEY_PREFIX } from '../types';

const FALLBACK_SLUG = 'leaderboard';
const MAX_COLLISION_SUFFIX = 1000;

// Lowercase + [a-z0-9_] only; collapse whitespace; trim underscores; FALLBACK_SLUG if empty.
function slugifyLeaderboardName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9_\s]/g, '')
    .replaceAll(/\s+/g, '_')
    .replaceAll(/_+/g, '_')
    .replaceAll(/^_|_$/g, '');

  return slug === '' ? FALLBACK_SLUG : slug;
}

// PRD format: `leaderboard_config_<slug>`. Collisions get `_2`, `_3`, ... appended silently.
export function generateLeaderboardKey(name: string, existingKeys: readonly string[]): string {
  const base = `${LEADERBOARD_CONFIG_KEY_PREFIX}${slugifyLeaderboardName(name)}`;
  const taken = new Set(existingKeys);
  if (!taken.has(base)) {
    return base;
  }
  for (let i = 2; i <= MAX_COLLISION_SUFFIX; i += 1) {
    const candidate = `${base}_${i}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
  // Astronomically unlikely fallback so we never throw on the create path.
  return `${base}_${Date.now()}`;
}
