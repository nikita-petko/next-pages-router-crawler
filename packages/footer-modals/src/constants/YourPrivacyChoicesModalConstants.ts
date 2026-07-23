export const titleGpcDetectedTranslationKey = 'Title.GpcDetected';
export const titleNoGpcDetectedTranslationKey = 'Title.NoGpcDetected';
export const titleErrorTranslationKey = 'Title.Error';

export const descriptionLoading = 'Description.Loading';

export const bodyGpcDetectedSettingEnabledEligible = 'Body.GpcDetectedSettingEnabledEligible';
export const bodyGpcDetectedSettingEnabledIneligible = 'Body.GpcDetectedSettingEnabledIneligible';
export const bodyGpcDetectedSettingDisabledEligible = 'Body.GpcDetectedSettingDisabledEligible';
export const bodyGpcDetectedSettingDisabledIneligible = 'Body.GpcDetectedSettingDisabledIneligible';
export const bodyGpcMissingSettingEligible = 'Body.GpcMissingSettingEligible';
export const bodyGpcMissingSettingIneligible = 'Body.GpcMissingSettingIneligible';
export const bodyErrorTranslationKey = 'Body.Error';

export const actionOk = 'Action.Ok';
export const actionClose = 'Action.Close';
export const linkYourPrivacyChoices = 'Link.YourPrivacyChoices';

export const titleNoOptOutSignal = 'Title.NoOptOutSignal';
export const titleOptOutSignalDetected = 'Title.OptOutSignalDetected';
export const bodyNoSignal = 'Body.NoSignal';
export const bodySignalHonored = 'Body.SignalHonored';
export const bodySignalWithChanges = 'Body.SignalWithChanges';
export const linkManageAdsPreferences = 'Link.ManageAdsPreferences';
export const linkAdsPreferencesUpdated = 'Link.AdsPreferencesUpdated';

export const learnMoreATagStart =
  '<a href="https://en.help.roblox.com/hc/articles/28943243301780" target="_blank" rel="noreferrer" class="text-link">';
export const aTagWithHrefStart = '<a href=';
export const getHrefEnd = (adsPreferencesUrl: string): string =>
  ` onclick="if(window.location.pathname.includes('/my/account')){event.preventDefault();window.location.href='${adsPreferencesUrl}';window.location.reload();}" class="text-link">`;
export const aTagEnd = '</a>';
export const lineBreak = '<br />';
