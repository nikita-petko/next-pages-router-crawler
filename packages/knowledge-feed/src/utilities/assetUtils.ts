import type { TTargetEnv } from '../types';

export const getAssetsPath = (targetEnv: TTargetEnv) => {
  if (targetEnv === 'production') {
    return 'https://prod.docsiteassets.roblox.com';
  }
  return 'https://docsiteassets.roblox.com';
};

const AVATAR_SIZE = 45;
const FORUM_AVATAR_URL_SIZE_REGEX = /{size}/;

/**
 * * NOTE(@zwang, 02/19/25): based on the API endpoints, it seems there's two types of
 * * `authorAvatarUrl`
 * * 1. Relative URL - '/assets/feeds/robloxYoutubeAvatar.webp':
 * *   Which should be resolved to the asset CDN
 * * 2.Absolute URL
 * *    https://devforum.roblox.com/user_avatar/devforum.roblox.com/zenma1n/{size}/5934434_2.png:
 * *   Which is a templated URL to DevForum, which should be resolved to plug in the desired size
 */
export const formatAuthorAvatarUrl = (targetEnv: TTargetEnv, authorAvatarUrl: string): string => {
  // * NOTE(@zwang, 02/19/25): check if the `authorAvatarUrl` is relative or absolute - https://stackoverflow.com/a/57047786
  if (new URL(document.baseURI).origin === new URL(authorAvatarUrl, document.baseURI).origin) {
    return new URL(authorAvatarUrl, getAssetsPath(targetEnv)).toString();
  }

  return authorAvatarUrl.replace(FORUM_AVATAR_URL_SIZE_REGEX, AVATAR_SIZE.toString());
};

export const isAbsoluteUrl = (url: string): boolean => {
  return /^\s*https?:\/\//i.test(url); // ignore http case
};

export const getThumbnailUrl = (targetEnv: TTargetEnv, thumbnailUrl: string): string => {
  if (isAbsoluteUrl(thumbnailUrl)) {
    return thumbnailUrl;
  }

  return `${getAssetsPath(targetEnv)}${thumbnailUrl}`;
};
