import { SocialLinkTypes } from '@modules/clients/games';

const SocialLinkTypesPattern: Partial<Record<SocialLinkTypes | 'default', RegExp>> = {
  [SocialLinkTypes.Amazon]:
    /^\s*((https):\/\/)?(www\.)?amazon\.com\/stores\/page\/[a-zA-Z0-9\-/_]+(\?(&?[a-zA-Z0-9\-_/]+=?[a-zA-Z0-9\-_/]*)+)*\s*$/,
  [SocialLinkTypes.Discord]:
    /^\s*((http|https):\/\/)?(www\.)?discord\.(gg|io|me|li)\/[a-zA-Z0-9\-_/]+\s*$/,
  [SocialLinkTypes.Facebook]:
    /^\s*((http|https):\/\/)?(www\.)?facebook\.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[?\w-]*\/)?(?:profile\.php\?id=(?=\d.*))?([\w-]*)\s*$/,
  [SocialLinkTypes.RobloxGroup]:
    /^\s*(?:https?):\/\/(?:[a-z0-9-]{2,}\.)*(?:roblox(labs)?\.com\/)(?:[Gg]roups\/[Gg]roup\.aspx\?gid=|[Mm]y\/[Gg]roups\.aspx\?gid=|groups\/|communities\/)([\d]+)\s*$/,
  [SocialLinkTypes.Twitch]: /^\s*((http|https):\/\/)?(www\.)?twitch\.tv\/[a-zA-Z0-9\-/_]+\s*$/,
  [SocialLinkTypes.Twitter]:
    /^\s*(((http|https):\/\/)?(www\.)?(twitter|x)\.com\/|@)(?!logout(\/|$))([a-zA-Z0-9_]{1,15})\s*$/,
  [SocialLinkTypes.YouTube]:
    /^((http|https):\/\/)?(www\.)?youtube\.com\/(?!logout(\/|$))[@a-zA-Z0-9\-/_]+$/,
  [SocialLinkTypes.GooglePlus]: /{}/, // this is not available
  default: /.*/,
};

const SocialLinkNameTranslationKeys: Partial<Record<SocialLinkTypes, string>> = {
  [SocialLinkTypes.RobloxGroup]: 'Label.RobloxGroup', // defined in CreatorDashboard.SocialLinks namespace
};

export { SocialLinkTypesPattern, SocialLinkNameTranslationKeys };
