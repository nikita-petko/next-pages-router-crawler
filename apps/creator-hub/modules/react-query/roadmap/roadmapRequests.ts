import {
  getRoadmapItems,
  getRoadmapLikes,
  upsertRoadmapLike,
  type ApiRoadmapItem,
} from '@modules/clients/creatorUpdatesApi';
import type {
  DevStage,
  RoadmapCategory,
  RoadmapItem,
  RoadmapLink,
  TimeFrame,
} from '@modules/roadMap/v2/types';

// The generated client types every field as optional and the enum-like ones loosely, so these guard
// the enum values at the wire boundary rather than trusting the payload.
const DEV_STAGES: readonly DevStage[] = [
  'Live',
  'Early Access',
  'Beta',
  'In Development',
  'On Hold',
];
const TIME_FRAMES: readonly TimeFrame[] = ['Early', 'Mid', 'Late'];
const CATEGORIES: readonly RoadmapCategory[] = [
  'Featured',
  'Studio',
  'Engine',
  'APIs',
  'Social',
  'Discovery',
  'Safety',
  'Policy',
  'Analytics',
  'Monetization',
  'Avatar',
  'AI',
  'Ads',
  'Creator Hub',
];

const asDevStage = (value: unknown): DevStage | null =>
  DEV_STAGES.find((stage) => stage === value) ?? null;

const asTimeFrame = (value: unknown): TimeFrame | null =>
  TIME_FRAMES.find((frame) => frame === value) ?? null;

const asCategories = (values: unknown): RoadmapCategory[] =>
  Array.isArray(values)
    ? values.flatMap((value) => {
        const match = CATEGORIES.find((category) => category === value);
        return match ? [match] : [];
      })
    : [];

const mapLinks = (links: ApiRoadmapItem['links']): RoadmapLink[] =>
  (links ?? []).flatMap((link) => {
    const url = link.url ?? '';
    if (!url) {
      return [];
    }
    const label = link.label ?? '';
    return [{ label: label.length > 0 ? label : url, url }];
  });

/**
 * Maps one API roadmap item to the UI shape, returning null for hidden/incomplete items. The backend
 * already drops invalids, but the generated types are permissive so we guard the enum-like fields
 * (e.g. dev stage) again here. `isLiked` defaults to false and is merged in separately via
 * `applyLikedState` — per-user likes come from a different, user-scoped endpoint.
 */
const mapRoadmapItem = (item: ApiRoadmapItem): RoadmapItem | null => {
  const devStage = asDevStage(item.devStage);
  if (item.visible === false || !item.id || !item.title || !devStage) {
    return null;
  }

  return {
    id: item.id,
    title: item.title,
    summary: item.summary ?? '',
    description: item.description ?? '',
    devStage,
    timeFrame: asTimeFrame(item.timeFrame),
    year: item.year ?? 0,
    category: asCategories(item.category),
    media: item.media ?? null,
    links: mapLinks(item.links),
    likeCount: item.likeCount ?? 0,
    isLiked: false,
  };
};

export async function fetchRoadmapItems(locale?: string): Promise<RoadmapItem[]> {
  const items = await getRoadmapItems({ locale });
  return items.map(mapRoadmapItem).filter((item): item is RoadmapItem => item !== null);
}

export async function fetchRoadmapLikes(): Promise<string[]> {
  return getRoadmapLikes();
}

export async function toggleRoadmapLike(id: string, liked: boolean): Promise<number | null> {
  return upsertRoadmapLike(id, liked);
}
