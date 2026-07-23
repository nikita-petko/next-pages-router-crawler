import type { Locale } from '@rbx/intl';
import localeNameMapping from '@modules/miscellaneous/localization/constants/localeNameMapping';

export const MESSAGES_URL = `https://www.${process.env.robloxSiteDomain}/my/messages/`;
export const TRANSACTIONS_URL = `https://www.${process.env.robloxSiteDomain}/transactions`;
export const SETTINGS_URL = `https://www.${process.env.robloxSiteDomain}/my/account`;
export const DEVEX_APPEAL_URL = `https://www.${process.env.robloxSiteDomain}/report-appeals/#/`;
export const DEVEX_UPDATES_URL = `https://devforum.roblox.com/t/developer-exchange-program-minimum-requirements-changes/2170564`;
export const DEVEX_HELP_URL = `https://create.${process.env.robloxSiteDomain}/docs/production/monetization/18-plus-devex-rate`;
export const DEVEX_TAX_HELP_URL = `https://create.${process.env.robloxSiteDomain}/docs/production/monetization/tax-information`;
const DEVEX_INFO_URL = `https://www.${process.env.robloxSiteDomain}/info/devex-info`;
const DEVEX_TERMS_URL = `https://www.${process.env.robloxSiteDomain}/info/devex-terms`;
const ROBLOX_TERMS_URL = `https://www.${process.env.robloxSiteDomain}/info/terms`;

export const getDevexInfoURL = (locale: Locale | null) => {
  if (locale) {
    return `${DEVEX_INFO_URL}?locale=${localeNameMapping[locale]}`;
  }
  return DEVEX_INFO_URL;
};

export const getDevexTermsURL = (locale: Locale | null) => {
  if (locale) {
    return `${DEVEX_TERMS_URL}?locale=${localeNameMapping[locale]}`;
  }
  return DEVEX_TERMS_URL;
};

export const getRobloxTermsURL = (locale: Locale | null) => {
  if (locale) {
    return `${ROBLOX_TERMS_URL}?locale=${localeNameMapping[locale]}`;
  }
  return ROBLOX_TERMS_URL;
};
