import { urls } from '@modules/miscellaneous/common';

const {
  creatorHub: { developerForum },
} = urls;

export type TDevForumUser = {
  id: number;
  name: string;
  avatarSrc: string;
};

export type TDevForumAnnouncement = {
  id: number;
  slug: string;
  title: string;
  createdAt: string;
  bumpedAt?: string;
  url: string;
  postsCount: number;
  likeCount: number;
  users: TDevForumUser[];
  tags: string[];
  author: string;
  imageUrl: string | null;
  views: number;
  isNew: boolean;
  subTitle: string | null;
  excerpt: string | null;
};

// Extracts the very first line from a plain-text excerpt.
// Returns null if excerpt is null/empty or first line is blank.
export const extractSubtitleFromExcerpt = (excerpt: string | null): string | null => {
  if (!excerpt) return null;

  const firstLine = excerpt.split(/\r?\n/, 1)[0].trim();

  return firstLine.length ? firstLine : null;
};

export const isPostNewSinceLastViewed = (postDate: string, lastViewedDate: string) => {
  // NOTE (tchu, 2025-06-27): If lastViewedDate is empty string on first visit, we will return true to show all announcements
  if (lastViewedDate === '') {
    return true;
  }
  const postDateObj = new Date(postDate);
  const lastViewedDateObj = new Date(lastViewedDate);
  if (Number.isNaN(postDateObj.getTime())) {
    return false;
  }
  if (Number.isNaN(lastViewedDateObj.getTime())) {
    return true;
  }
  const isNew = postDateObj > lastViewedDateObj;
  return isNew;
};

type AnnRes = { topics: TDevForumAnnouncement[]; hasNewAnnouncements: boolean };
type CacheEntry = { ts: number; promise: Promise<AnnRes> };
const announcementsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5000;

/** Only include announcements created on or after this date. */
const ANNOUNCEMENTS_CUTOFF_DATE = '2025-11-11T00:00:00.000Z';
const ANNOUNCEMENTS_CUTOFF_MS = new Date(ANNOUNCEMENTS_CUTOFF_DATE).getTime();

const isOnOrAfterCutoff = (createdAt: string): boolean => {
  const t = Date.parse(createdAt);
  return !Number.isNaN(t) && t >= ANNOUNCEMENTS_CUTOFF_MS;
};

// TODO: Add infinite scroll to progressively fetch more pages (up to 20) when user scrolls down.
const fetchDevForumAnnouncements = async (lastViewedDate: string): Promise<AnnRes> => {
  const baseUrl = `${developerForum.getCdnBaseUrl()}${developerForum.getAnnouncementsPath()}.json`;
  const pageUrl = (page: number) => (page === 0 ? baseUrl : `${baseUrl}?page=${page}`);

  const getDevForumCdnImageUrl = (raw: string | null): string | null => {
    if (!raw) return null;
    const idx = raw.indexOf('/uploads/');
    if (idx === -1) return null;
    return developerForum.getMediaCdnBaseUrl() + raw.slice(idx);
  };

  const pages = Array.from({ length: 6 }, (_, i) => i);

  type ForumResponse = {
    users: { id: number; name: string; avatar_template: string }[];
    topic_list: {
      topics: {
        id: number;
        title: string;
        slug: string;
        posts_count: number;
        image_url: string | null;
        created_at: string;
        bumped_at?: string;
        pinned: boolean;
        excerpt: string | null;
        last_read_post_number?: number | undefined;
        tags: string[];
        views: number;
        like_count: number;
        last_poster_username: string;
        posters: { user_id: number }[];
      }[];
    };
  };

  type PageOk = { page: number; ok: true; data: ForumResponse };
  type PageErr = { page: number; ok: false };

  const settled = await Promise.allSettled<PageOk | PageErr>(
    pages.map(async (page) => {
      const res = await fetch(pageUrl(page));
      if (!res.ok) return { page, ok: false };

      const data = (await res.json()) as ForumResponse;
      return { page, ok: true, data };
    }),
  );

  if (
    settled[0]?.status !== 'fulfilled' ||
    !(settled[0] as PromiseFulfilledResult<PageOk | PageErr>).value.ok
  ) {
    throw new Error('Failed to fetch announcements');
  }

  // Process successful pages in page order for determinism
  const fulfilled: PageOk[] = settled
    .filter((r): r is PromiseFulfilledResult<PageOk | PageErr> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((v): v is PageOk => v.ok)
    .sort((a, b) => a.page - b.page);

  // Build users map (merge across pages)
  const users: Record<number, TDevForumUser> = fulfilled.reduce(
    (acc, p) => {
      p.data.users.forEach((curr) => {
        const avatarSrc = curr.avatar_template.startsWith('https://')
          ? curr.avatar_template
          : `${developerForum.getCdnBaseUrl()}${curr.avatar_template.replace('{size}', '45')}`;
        acc[curr.id] = { id: curr.id, name: curr.name, avatarSrc };
      });
      return acc;
    },
    {} as Record<number, TDevForumUser>,
  );

  // Collect ALL featured, non-pinned, de-duped topics (no hard cap)
  let hasNewAnnouncements = false;
  const seenTopicIds = new Set<number>();

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const isRecentWithinDays = (dateISO: string, days: number, now = Date.now()): boolean => {
    const t = Date.parse(dateISO);
    if (Number.isNaN(t)) return false;
    return now - t <= days * MS_PER_DAY;
  };

  const topics: TDevForumAnnouncement[] = fulfilled.reduce<TDevForumAnnouncement[]>((acc, p) => {
    const pageItems = p.data.topic_list.topics
      .filter(
        (t) =>
          t.pinned === false &&
          Array.isArray(t.tags) &&
          !seenTopicIds.has(t.id) &&
          isOnOrAfterCutoff(t.created_at),
      )
      .map((t) => {
        const isNew =
          isPostNewSinceLastViewed(t.created_at, lastViewedDate) ||
          isRecentWithinDays(t.created_at, 2);
        if (isNew) hasNewAnnouncements = true;

        seenTopicIds.add(t.id);
        const imageUrl = getDevForumCdnImageUrl(t.image_url);

        return {
          id: t.id,
          slug: t.slug,
          title: t.title,
          createdAt: t.created_at,
          bumpedAt: t.bumped_at ?? t.created_at,
          users: t.posters.map((poster) => users[poster.user_id]),
          url: `${developerForum.getBaseUrl()}/t/${t.slug}/${t.id}`,
          postsCount: t.posts_count - 1, // replies only
          likeCount: t.like_count,
          tags: t.tags,
          author: t.last_poster_username,
          imageUrl,
          views: t.views,
          isNew,
          subTitle: extractSubtitleFromExcerpt(t.excerpt),
          excerpt: t.excerpt,
        } as TDevForumAnnouncement;
      });

    return acc.concat(pageItems);
  }, []);

  return { topics, hasNewAnnouncements };
};

export const getDevForumAnnouncements = async (lastViewedDate: string): Promise<AnnRes> => {
  const key = lastViewedDate || '__empty__';
  const now = Date.now();
  const cached = announcementsCache.get(key);

  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = fetchDevForumAnnouncements(lastViewedDate)
    .then((res) => {
      announcementsCache.set(key, { ts: Date.now(), promise: Promise.resolve(res) });
      return res;
    })
    .catch((err) => {
      announcementsCache.delete(key);
      throw err;
    });

  announcementsCache.set(key, { ts: now, promise });
  return promise;
};

export type TGroupPermissions = {
  groupPostsPermissions: {
    viewWall: boolean;
    postToWall: boolean;
    deleteFromWall: boolean;
    viewStatus: boolean;
    postToStatus: boolean;
  };
  groupMembershipPermissions: {
    changeRank: boolean;
    inviteMembers: boolean;
    removeMembers: boolean;
  };
  groupManagementPermissions: {
    manageRelationships: boolean;
    manageClan: boolean;
    viewAuditLogs: boolean;
  };
  groupEconomyPermissions: {
    spendGroupFunds: boolean;
    createItems: boolean;
    manageItems: boolean;
    addGroupPlaces: boolean;
    manageGroupGames: boolean;
    viewGroupPayouts: boolean;
    viewAnalytics: boolean;
  };
  groupOpenCloudPermissions: {
    useCloudAuthentication: boolean;
    administerCloudAuthentication: boolean;
  };
};

export const getGroupMembership = async (groupId: string) => {
  const response = await fetch(
    `https://groups.${process.env.robloxSiteDomain}/v1/groups/${groupId}/membership`,
    { credentials: 'include' },
  );
  const { permissions } = (await response.json()) as {
    permissions: TGroupPermissions;
  };

  return permissions;
};
