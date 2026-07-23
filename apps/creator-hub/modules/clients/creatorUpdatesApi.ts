import type {
  ChangelogGetPinnedPostsRequest,
  ChangelogGetPostsRequest,
  ChangelogPost,
  RoadmapItem,
} from '@rbx/client-creator-updates-api/v1';
import { ChangelogApi, RoadmapApi, RoadmapLikesApi } from '@rbx/client-creator-updates-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PINNED_POSTS = 2;
const DEFAULT_LOCALE = 'en-us';

export type CreatorUpdatesChangelogPost = Omit<
  ChangelogPost,
  'id' | 'title' | 'createdAt' | 'updatedAt' | 'tags' | 'attachmentUrl' | 'attachmentYoutubeUrl'
> & {
  id: NonNullable<ChangelogPost['id']>;
  title: NonNullable<ChangelogPost['title']>;
  createdAt: string;
  updatedAt: string;
  tags: NonNullable<ChangelogPost['tags']>;
  imageUrl: ChangelogPost['attachmentUrl'];
  youtubeUrl: ChangelogPost['attachmentYoutubeUrl'];
};

export type GetChangelogPostsOptions = Pick<
  ChangelogGetPostsRequest,
  'tag' | 'page' | 'pageSize' | 'lang'
>;
export type GetPinnedChangelogPostsOptions = Pick<ChangelogGetPinnedPostsRequest, 'lang'>;

/**
 * Generated roadmap item, re-exported under the name the roadmap react-query mapping layer
 * (roadmapRequests.ts) consumes.
 */
export type ApiRoadmapItem = RoadmapItem;

const configuration = createClientConfiguration('creator-updates-api', 'bedev2');

const changelogApi = new ChangelogApi(configuration);
const roadmapApi = new RoadmapApi(configuration);
const roadmapLikesApi = new RoadmapLikesApi(configuration);

const normalizeDate = (value: Date | string | null | undefined): string | null => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value ?? null;
};

const mapChangelogPost = (post: ChangelogPost): CreatorUpdatesChangelogPost | null => {
  const createdAt = normalizeDate(post.createdAt);

  if (!post.id || !post.title || !createdAt) {
    return null;
  }

  return {
    id: post.id,
    title: post.title,
    createdAt,
    updatedAt: normalizeDate(post.updatedAt) ?? createdAt,
    primaryLinkUrl: post.primaryLinkUrl ?? null,
    primaryLinkLabel: post.primaryLinkLabel ?? null,
    postCount: post.postCount ?? null,
    likeCount: post.likeCount ?? null,
    tags: post.tags ?? [],
    author: post.author ?? null,
    imageUrl: post.attachmentUrl ?? null,
    youtubeUrl: post.attachmentYoutubeUrl ?? null,
    views: post.views ?? null,
    keyTakeaways: post.keyTakeaways ?? null,
  };
};

export async function getChangelogPosts({
  tag,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
  lang,
}: GetChangelogPostsOptions = {}): Promise<CreatorUpdatesChangelogPost[]> {
  const response = await changelogApi.changelogGetPosts({ tag, page, pageSize, lang });
  return (response.posts ?? [])
    .map(mapChangelogPost)
    .filter((post): post is CreatorUpdatesChangelogPost => post !== null);
}

export async function getPinnedChangelogPosts({
  lang,
}: GetPinnedChangelogPostsOptions = {}): Promise<CreatorUpdatesChangelogPost[]> {
  const response = await changelogApi.changelogGetPinnedPosts({ lang });
  return (response.posts ?? [])
    .map(mapChangelogPost)
    .filter((post): post is CreatorUpdatesChangelogPost => post !== null)
    .slice(0, MAX_PINNED_POSTS);
}

/**
 * Fetches the roadmap feed for the given locale and returns the raw API items. The wire→UI mapping
 * (and the contract-divergence handling — e.g. defaulting isLiked, which the API does not yet serve)
 * lives in the roadmap react-query layer.
 */
export async function getRoadmapItems({
  locale = DEFAULT_LOCALE,
}: { locale?: string } = {}): Promise<ApiRoadmapItem[]> {
  const response = await roadmapApi.roadmapGetRoadmapItems({ locale });
  return response.items ?? [];
}

/**
 * Fetches the ids of roadmap items the current user has liked. The endpoint identifies the user by
 * session cookie (no id is passed), so this is only meaningful for an authenticated caller — the
 * react-query layer gates the request on a logged-in user.
 */
export async function getRoadmapLikes(): Promise<string[]> {
  const response = await roadmapLikesApi.roadmapLikesGetUserRoadmapLikes();
  return response.likedItemIds ?? [];
}

/**
 * Likes or unlikes a roadmap item for the current user and returns the item's updated aggregate like
 * count (null when the API omits it). Backed by PATCH /v1/roadmap/likes/{id} on creator-updates-api.
 */
export async function upsertRoadmapLike(id: string, liked: boolean): Promise<number | null> {
  const response = await roadmapLikesApi.roadmapLikesUpsertUserRoadmapLike({
    id,
    roadmapLikesUpsertUserRoadmapLikeRequest: { liked },
  });
  return response.likeCount ?? null;
}
