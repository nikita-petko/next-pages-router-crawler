export enum ProceedAction {
  Reactivate,
  RobloxRedirect,
  RequestAppeal,
}

export const enum ModerationModalEvents {
  ModerationModalImpressionEvent = 'moderationModalImpression',
  ModerationModalReactivateEvent = 'moderationModalReactivate',
  ModerationModalLogoutEvent = 'moderationModalLogout',
}

export enum PUNISHMENT_TYPE {
  Warn = 'Warn',
  Delete = 'Delete',
  Hour1 = 'Ban 1 Hour',
  Hour6 = 'Ban 6 Hours',
  Day1 = 'Ban 1 Day',
  Day3 = 'Ban 3 Days',
  Day7 = 'Ban 7 Days',
  Day14 = 'Ban 14 Days',
  Month6 = 'Ban 6 Months',
  Year1 = 'Ban 1 Year',
}

export const PUNISHMENT_TYPE_TO_STRING_KEY: { [punishmentType: string]: string } = {
  'Ban 1 Hour': 'Title.Ban1Hour',
  'Ban 6 Hours': 'Title.Ban6Hour',
  'Ban 1 Day': 'Title.Ban1Day',
  'Ban 3 Days': 'Title.Ban3Day',
  'Ban 7 Days': 'Title.Ban7Day',
  'Ban 14 Days': 'Title.Ban14Day',
  'Ban 6 Months': 'Title.Ban6Months',
  'Ban 1 Year': 'Title.Ban1Year',
  Warn: 'Title.Warn',
  Delete: 'Title.Delete',
};

export const COMMUNITY_STANDARDS_URL = `https://www.${process.env.robloxSiteDomain}/info/community-guidelines`;

export const TERMS_OF_USE_URL = `https://www.${process.env.robloxSiteDomain}/info/terms`;

export const REPORT_APPEALS_URL = `https://www.${process.env.robloxSiteDomain}/report-appeals?t_source=nap-web`;

export const APPEALS_PROCESS_URL = 'https://en.help.roblox.com/hc/articles/360000245263';

export const ROBLOX_URL = `https://${process.env.robloxSiteDomain}`;
