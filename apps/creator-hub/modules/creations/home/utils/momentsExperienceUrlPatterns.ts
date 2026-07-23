export const UrlIdType = {
  UniverseId: 'UniverseId',
  PlaceId: 'PlaceId',
} as const;

export type UrlIdType = (typeof UrlIdType)[keyof typeof UrlIdType];

export type UrlRegexMatch = {
  regex: RegExp;
  idType: UrlIdType;
};

const creatorDashboardUrlRegex =
  /(?:https?:\/\/)?create\.roblox\.com\/dashboard\/creations\/experiences\/(\d+)/;
const gamesUrlRegex =
  /(?:https?:\/\/)?(?:www\.)?roblox\.com(?:\/[A-Za-z]{2}(?:-[A-Za-z0-9]{2,3})?)?\/games\/(\d+)/;
const sitetestCreatorDashboardUrlRegex =
  /(?:https?:\/\/)?create\.sitetest\d\.robloxlabs\.com\/dashboard\/creations\/experiences\/(\d+)/;
const sitetestGamesUrlRegex =
  /(?:https?:\/\/)?(?:www\.)?sitetest\d\.robloxlabs\.com(?:\/[A-Za-z]{2}(?:-[A-Za-z0-9]{2,3})?)?\/games\/(\d+)/;

export const plainUniverseIdRegex = /^\d+$/;

const sitetestRegexMatches: UrlRegexMatch[] = [
  { regex: sitetestCreatorDashboardUrlRegex, idType: UrlIdType.UniverseId },
  { regex: sitetestGamesUrlRegex, idType: UrlIdType.PlaceId },
];

export function getMomentsExperienceUrlRegexMatches(includeSitetest: boolean): UrlRegexMatch[] {
  return [
    { regex: creatorDashboardUrlRegex, idType: UrlIdType.UniverseId },
    { regex: gamesUrlRegex, idType: UrlIdType.PlaceId },
    ...(includeSitetest ? sitetestRegexMatches : []),
    { regex: plainUniverseIdRegex, idType: UrlIdType.UniverseId },
  ];
}
