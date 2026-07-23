export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25];

export const PARENTAL_CONTROLS_URL = `https://${process.env.robloxSiteDomain}/my/account#!/parental-controls`;
export const buildTrustedFriendsUrl = (locale: string) => {
  return `https://en.help.roblox.com/hc/${locale}/articles/37725513985812-Unlocking-trusted-friends`;
};
