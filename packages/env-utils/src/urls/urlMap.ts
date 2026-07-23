import type { TBuildTarget, TRobloxEnvironment } from '../types';

/**
 * Maps semantic names to URLs based on environment and build target.
 */
type TUrlMap = {
  [key: string]: {
    [targetKey in TBuildTarget]: {
      [envKey in TRobloxEnvironment]: string;
    };
  };
};

const URL_MAP: TUrlMap = {
  accountSessionProtectionHelpArticle: {
    global: {
      development: 'https://help.roblox.com/hc/articles/18765146769812-Account-Session-Protection',
      sitetest3: 'https://help.roblox.com/hc/articles/18765146769812-Account-Session-Protection',
      sitetest2: 'https://help.roblox.com/hc/articles/18765146769812-Account-Session-Protection',
      sitetest1: 'https://help.roblox.com/hc/articles/18765146769812-Account-Session-Protection',
      production: 'https://help.roblox.com/hc/articles/18765146769812-Account-Session-Protection',
    },
    luobu: {
      // TODO: Find the right URLs for Luobu
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  aiBasedToolsSupplementalTermsAndDisclaimer: {
    global: {
      development:
        'https://en.help.roblox.com/hc/en-us/articles/20121392440212-AI-Based-Tools-Supplemental-Terms-and-Disclaimer',
      sitetest3:
        'https://en.help.roblox.com/hc/en-us/articles/20121392440212-AI-Based-Tools-Supplemental-Terms-and-Disclaimer',
      sitetest2:
        'https://en.help.roblox.com/hc/en-us/articles/20121392440212-AI-Based-Tools-Supplemental-Terms-and-Disclaimer',
      sitetest1:
        'https://en.help.roblox.com/hc/en-us/articles/20121392440212-AI-Based-Tools-Supplemental-Terms-and-Disclaimer',
      production:
        'https://en.help.roblox.com/hc/en-us/articles/20121392440212-AI-Based-Tools-Supplemental-Terms-and-Disclaimer',
    },
    luobu: {
      // TODO: Find the right URLs for Luobu
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  creatorsRestrictionsOnUse: {
    global: {
      development:
        'https://help.roblox.com/hc/articles/115004647846-Roblox-Terms-of-Use#creators-restrictions-on-use',
      sitetest3:
        'https://help.roblox.com/hc/articles/115004647846-Roblox-Terms-of-Use#creators-restrictions-on-use',
      sitetest2:
        'https://help.roblox.com/hc/articles/115004647846-Roblox-Terms-of-Use#creators-restrictions-on-use',
      sitetest1:
        'https://help.roblox.com/hc/articles/115004647846-Roblox-Terms-of-Use#creators-restrictions-on-use',
      production:
        'https://help.roblox.com/hc/articles/115004647846-Roblox-Terms-of-Use#creators-restrictions-on-use',
    },
    luobu: {
      // TODO: Find the right URLs for Luobu
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  agreementsManagerUrl: {
    global: {
      development: 'https://content-licensing-public-test.simulpong.com',
      sitetest3: 'https://content-licensing-public-test.simulpong.com',
      sitetest2: 'https://content-licensing-public-test.simulpong.com',
      sitetest1: 'https://content-licensing-public-test.simulpong.com',
      production: 'https://agreements-manageraws.rbxcdn.com', // TODO: The content licensing public bucket currently uses the agreements manager bucket domain
    },
    luobu: {
      // TODO: Find the right URLs for Luobu
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  devForumWAYWOCInspirationUrl: {
    global: {
      development: 'http://devforum.roblox.com/waywoc',
      sitetest3: 'http://devforum.roblox.com/waywoc',
      sitetest2: 'http://devforum.roblox.com/waywoc',
      sitetest1: 'http://devforum.roblox.com/waywoc',
      production: 'http://devforum.roblox.com/waywoc',
    },
    luobu: {
      // TODO: Find the right URLs for Luobu
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  shopifyMerchantUrl: {
    global: {
      development: 'https://apps.shopify.com/roblox',
      sitetest3: 'https://apps.shopify.com/roblox',
      sitetest2: 'https://apps.shopify.com/roblox',
      sitetest1: 'https://apps.shopify.com/roblox',
      production: 'https://apps.shopify.com/roblox',
    },
    luobu: {
      // TODO: Find the right URLs for Luobu
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  copyrightFairUseUrl: {
    global: {
      development: 'https://copyright.gov/fair-use/',
      sitetest3: 'https://copyright.gov/fair-use/',
      sitetest2: 'https://copyright.gov/fair-use/',
      sitetest1: 'https://copyright.gov/fair-use/',
      production: 'https://copyright.gov/fair-use/',
    },
    luobu: {
      // TODO: Find the right URLs for Luobu
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  aboutUsUrl: {
    global: {
      development: 'https://www.roblox.com/info/about-us',
      sitetest3: 'https://www.roblox.com/info/about-us',
      sitetest2: 'https://www.roblox.com/info/about-us',
      sitetest1: 'https://www.roblox.com/info/about-us',
      production: 'https://www.roblox.com/info/about-us',
    },
    luobu: {
      development: 'https://corp.roblox.cn/',
      sitetest3: 'https://corp.roblox.cn/',
      sitetest2: 'https://corp.roblox.cn/',
      sitetest1: 'https://corp.roblox.cn/',
      production: 'https://corp.roblox.cn/',
    },
  },
  joinUsUrl: {
    global: {
      development: 'https://www.roblox.com/info/jobs',
      sitetest3: 'https://www.roblox.com/info/jobs',
      sitetest2: 'https://www.roblox.com/info/jobs',
      sitetest1: 'https://www.roblox.com/info/jobs',
      production: 'https://www.roblox.com/info/jobs',
    },
    luobu: {
      development: 'https://corp.roblox.cn/career/',
      sitetest3: 'https://corp.roblox.cn/career/',
      sitetest2: 'https://corp.roblox.cn/career/',
      sitetest1: 'https://corp.roblox.cn/career/',
      production: 'https://corp.roblox.cn/career/',
    },
  },
  termsOfServiceUrl: {
    global: {
      development: 'https://www.roblox.com/info/terms',
      sitetest3: 'https://www.roblox.com/info/terms',
      sitetest2: 'https://www.roblox.com/info/terms',
      sitetest1: 'https://www.roblox.com/info/terms',
      production: 'https://www.roblox.com/info/terms',
    },
    luobu: {
      development: 'https://robloxdev.cn/dev-terms.html',
      sitetest3: 'https://robloxdev.cn/dev-terms.html',
      sitetest2: 'https://robloxdev.cn/dev-terms.html',
      sitetest1: 'https://robloxdev.cn/dev-terms.html',
      production: 'https://robloxdev.cn/dev-terms.html',
    },
  },
  privacyPolicyUrl: {
    global: {
      development: 'https://www.roblox.com/info/privacy',
      sitetest3: 'https://www.roblox.com/info/privacy',
      sitetest2: 'https://www.roblox.com/info/privacy',
      sitetest1: 'https://www.roblox.com/info/privacy',
      production: 'https://www.roblox.com/info/privacy',
    },
    luobu: {
      development: 'https://robloxdev.cn/dev-privacy-policy.html',
      sitetest3: 'https://robloxdev.cn/dev-privacy-policy.html',
      sitetest2: 'https://robloxdev.cn/dev-privacy-policy.html',
      sitetest1: 'https://robloxdev.cn/dev-privacy-policy.html',
      production: 'https://robloxdev.cn/dev-privacy-policy.html',
    },
  },
  accessibilityPolicyUrl: {
    global: {
      development: 'https://www.roblox.com/info/accessibility',
      sitetest3: 'https://www.roblox.com/info/accessibility',
      sitetest2: 'https://www.roblox.com/info/accessibility',
      sitetest1: 'https://www.roblox.com/info/accessibility',
      production: 'https://www.roblox.com/info/accessibility',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  devexPolicyUrl: {
    global: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
    luobu: {
      development: 'https://robloxdev.cn/dev-ex-policy.html',
      sitetest3: 'https://robloxdev.cn/dev-ex-policy.html',
      sitetest2: 'https://robloxdev.cn/dev-ex-policy.html',
      sitetest1: 'https://robloxdev.cn/dev-ex-policy.html',
      production: 'https://robloxdev.cn/dev-ex-policy.html',
    },
  },
  robloxCubeAnnouncementUrl: {
    global: {
      development: 'https://corp.roblox.com/newsroom/2025/03/introducing-roblox-cube',
      sitetest3: 'https://corp.roblox.com/newsroom/2025/03/introducing-roblox-cube',
      sitetest2: 'https://corp.roblox.com/newsroom/2025/03/introducing-roblox-cube',
      sitetest1: 'https://corp.roblox.com/newsroom/2025/03/introducing-roblox-cube',
      production: 'https://corp.roblox.com/newsroom/2025/03/introducing-roblox-cube',
    },
    // TODO: Find the right URLs for Luobu
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  developerArticleBadgesSpecialGameAwardsUrl: {
    global: {
      development: 'https://developer.roblox.com/articles/Badges-Special-Game-Awards',
      sitetest3: 'https://developer.roblox.com/articles/Badges-Special-Game-Awards',
      sitetest2: 'https://developer.roblox.com/articles/Badges-Special-Game-Awards',
      sitetest1: 'https://developer.roblox.com/articles/Badges-Special-Game-Awards',
      production: 'https://developer.roblox.com/articles/Badges-Special-Game-Awards',
    },
    // TODO: Find the right URLs for Luobu
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  developerArticleProductsInGamePurchasesUrl: {
    global: {
      development: 'https://developer.roblox.com/articles/Developer-Products-In-Game-Purchases',
      sitetest3: 'https://developer.roblox.com/articles/Developer-Products-In-Game-Purchases',
      sitetest2: 'https://developer.roblox.com/articles/Developer-Products-In-Game-Purchases',
      sitetest1: 'https://developer.roblox.com/articles/Developer-Products-In-Game-Purchases',
      production: 'https://developer.roblox.com/articles/Developer-Products-In-Game-Purchases',
    },
    // TODO: Find the right URLs for Luobu
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  developerArticleRedirectCreatePlaceAsyncUrl: {
    global: {
      development:
        'https://developer.roblox.com/en-us/api-reference/function/AssetService/CreatePlaceAsync',
      sitetest3:
        'https://developer.roblox.com/en-us/api-reference/function/AssetService/CreatePlaceAsync',
      sitetest2:
        'https://developer.roblox.com/en-us/api-reference/function/AssetService/CreatePlaceAsync',
      sitetest1:
        'https://developer.roblox.com/en-us/api-reference/function/AssetService/CreatePlaceAsync',
      production:
        'https://developer.roblox.com/en-us/api-reference/function/AssetService/CreatePlaceAsync',
    },
    // TODO: Find the right URLs for Luobu
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  developerArticleCreateVipServerUrl: {
    global: {
      development: 'https://developer.roblox.com/en-us/articles/Creating-a-VIP-Server-on-Roblox',
      sitetest3: 'https://developer.roblox.com/en-us/articles/Creating-a-VIP-Server-on-Roblox',
      sitetest2: 'https://developer.roblox.com/en-us/articles/Creating-a-VIP-Server-on-Roblox',
      sitetest1: 'https://developer.roblox.com/en-us/articles/Creating-a-VIP-Server-on-Roblox',
      production: 'https://developer.roblox.com/en-us/articles/Creating-a-VIP-Server-on-Roblox',
    },
    // TODO: Find the right URLs for Luobu
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  developerArticleGamesAndPlacesUrl: {
    global: {
      development: 'https://developer.roblox.com/en-us/articles/games-and-places',
      sitetest3: 'https://developer.roblox.com/en-us/articles/games-and-places',
      sitetest2: 'https://developer.roblox.com/en-us/articles/games-and-places',
      sitetest1: 'https://developer.roblox.com/en-us/articles/games-and-places',
      production: 'https://developer.roblox.com/en-us/articles/games-and-places',
    },
    // TODO: Find the right URLs for Luobu
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  ugcSubscriptionTermsOfUseUrl: {
    global: {
      development: 'https://en.help.roblox.com/hc/articles/19694609252884/',
      sitetest3: 'https://en.help.roblox.com/hc/articles/19694609252884/',
      sitetest2: 'https://en.help.roblox.com/hc/articles/19694609252884/',
      sitetest1: 'https://en.help.roblox.com/hc/articles/19694609252884/',
      production: 'https://en.help.roblox.com/hc/articles/19694609252884/',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  creatorStoreTermsOfUseUrl: {
    global: {
      development: 'https://en.help.roblox.com/hc/articles/21308223046932',
      sitetest3: 'https://en.help.roblox.com/hc/articles/21308223046932',
      sitetest2: 'https://en.help.roblox.com/hc/articles/21308223046932',
      sitetest1: 'https://en.help.roblox.com/hc/articles/21308223046932',
      production: 'https://en.help.roblox.com/hc/articles/21308223046932',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  // Luobu values are intentionally empty — account verification is a global-only feature.
  accountVerificationUrl: {
    global: {
      development:
        'https://create.sitetest3.robloxlabs.com/docs/en-us/production/publishing/account-verification#verify-through-government-id',
      sitetest3:
        'https://create.sitetest3.robloxlabs.com/docs/en-us/production/publishing/account-verification#verify-through-government-id',
      sitetest2:
        'https://create.sitetest3.robloxlabs.com/docs/en-us/production/publishing/account-verification#verify-through-government-id',
      sitetest1:
        'https://create.sitetest1.robloxlabs.com/docs/en-us/production/publishing/account-verification#verify-through-government-id',
      production:
        'https://create.roblox.com/docs/en-us/production/publishing/account-verification#verify-through-government-id',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  audioUploadLicenseAgreementUrl: {
    global: {
      development: 'https://en.help.roblox.com/hc/articles/23359485439124',
      sitetest3: 'https://en.help.roblox.com/hc/articles/23359485439124',
      sitetest2: 'https://en.help.roblox.com/hc/articles/23359485439124',
      sitetest1: 'https://en.help.roblox.com/hc/articles/23359485439124',
      production: 'https://en.help.roblox.com/hc/articles/23359485439124',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  audioThumbnailModerationUrl: {
    global: {
      development:
        'https://en.help.roblox.com/hc/en-us/articles/21416271342868-Content-Moderation-on-Roblox',
      sitetest3:
        'https://en.help.roblox.com/hc/en-us/articles/21416271342868-Content-Moderation-on-Roblox',
      sitetest2:
        'https://en.help.roblox.com/hc/en-us/articles/21416271342868-Content-Moderation-on-Roblox',
      sitetest1:
        'https://en.help.roblox.com/hc/en-us/articles/21416271342868-Content-Moderation-on-Roblox',
      production:
        'https://en.help.roblox.com/hc/en-us/articles/21416271342868-Content-Moderation-on-Roblox',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  extendedServicesTermsOfUseUrl: {
    global: {
      development: 'https://en.help.roblox.com/hc/articles/37967848292500',
      sitetest3: 'https://en.help.roblox.com/hc/articles/37967848292500',
      sitetest2: 'https://en.help.roblox.com/hc/articles/37967848292500',
      sitetest1: 'https://en.help.roblox.com/hc/articles/37967848292500',
      production: 'https://en.help.roblox.com/hc/articles/37967848292500',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  robloxTermsOfUseUrl: {
    global: {
      development: 'https://en.help.roblox.com/hc/en-us/articles/115004647846-Roblox-Terms-of-Use',
      sitetest3: 'https://en.help.roblox.com/hc/en-us/articles/115004647846-Roblox-Terms-of-Use',
      sitetest2: 'https://en.help.roblox.com/hc/en-us/articles/115004647846-Roblox-Terms-of-Use',
      sitetest1: 'https://en.help.roblox.com/hc/en-us/articles/115004647846-Roblox-Terms-of-Use',
      production: 'https://en.help.roblox.com/hc/en-us/articles/115004647846-Roblox-Terms-of-Use',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  advertisingStandardsUrl: {
    global: {
      development:
        'https://en.help.roblox.com/hc/en-us/articles/13722260778260-Advertising-Standards',
      sitetest3:
        'https://en.help.roblox.com/hc/en-us/articles/13722260778260-Advertising-Standards',
      sitetest2:
        'https://en.help.roblox.com/hc/en-us/articles/13722260778260-Advertising-Standards',
      sitetest1:
        'https://en.help.roblox.com/hc/en-us/articles/13722260778260-Advertising-Standards',
      production:
        'https://en.help.roblox.com/hc/en-us/articles/13722260778260-Advertising-Standards',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  creatorThirdPartyTermsOfUseUrl: {
    global: {
      development: 'https://en.help.roblox.com/hc/en-us/articles/15887203369620',
      sitetest3: 'https://en.help.roblox.com/hc/en-us/articles/15887203369620',
      sitetest2: 'https://en.help.roblox.com/hc/en-us/articles/15887203369620',
      sitetest1: 'https://en.help.roblox.com/hc/en-us/articles/15887203369620',
      production: 'https://en.help.roblox.com/hc/en-us/articles/15887203369620',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  dataCollectionOptInUrl: {
    global: {
      development: 'https://en.help.roblox.com/hc/en-us/articles/18922542221076',
      sitetest3: 'https://en.help.roblox.com/hc/en-us/articles/18922542221076',
      sitetest2: 'https://en.help.roblox.com/hc/en-us/articles/18922542221076',
      sitetest1: 'https://en.help.roblox.com/hc/en-us/articles/18922542221076',
      production: 'https://en.help.roblox.com/hc/en-us/articles/18922542221076',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  robloxCommunityStandardsUrl: {
    global: {
      development: 'https://about.roblox.com/community-standards',
      sitetest3: 'https://about.roblox.com/community-standards',
      sitetest2: 'https://about.roblox.com/community-standards',
      sitetest1: 'https://about.roblox.com/community-standards',
      production: 'https://about.roblox.com/community-standards',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  creatorThirdPartyPolicyUrl: {
    global: {
      development: 'https://en.help.roblox.com/hc/en-us/articles/37924211313044',
      sitetest3: 'https://en.help.roblox.com/hc/en-us/articles/37924211313044',
      sitetest2: 'https://en.help.roblox.com/hc/en-us/articles/37924211313044',
      sitetest1: 'https://en.help.roblox.com/hc/en-us/articles/37924211313044',
      production: 'https://en.help.roblox.com/hc/en-us/articles/37924211313044',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  creatorAnalyticsTermsOfUseUrl: {
    global: {
      development: 'https://help.roblox.com/hc/articles/10949046065044',
      sitetest3: 'https://help.roblox.com/hc/articles/10949046065044',
      sitetest2: 'https://help.roblox.com/hc/articles/10949046065044',
      sitetest1: 'https://help.roblox.com/hc/articles/10949046065044',
      production: 'https://help.roblox.com/hc/articles/10949046065044',
    },
    // TODO: Find the right URLs for Luobu
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  friendRewardsTermsOfUseUrl: {
    global: {
      development:
        "'https://help.roblox.com/hc/articles/35146071523604-In-Experience-Friend-Rewards-Program-Terms'",
      sitetest3:
        "'https://help.roblox.com/hc/articles/35146071523604-In-Experience-Friend-Rewards-Program-Terms'",
      sitetest2:
        "'https://help.roblox.com/hc/articles/35146071523604-In-Experience-Friend-Rewards-Program-Terms'",
      sitetest1:
        "'https://help.roblox.com/hc/articles/35146071523604-In-Experience-Friend-Rewards-Program-Terms'",
      production:
        "'https://help.roblox.com/hc/articles/35146071523604-In-Experience-Friend-Rewards-Program-Terms'",
    },
    // TODO: Find the right URLs for Luobu
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  developerExchangeHelpAndInformationPageUrl: {
    global: {
      development:
        'https://en.help.roblox.com/hc/en-us/articles/13061189551124-Developer-Exchange-Help-and-Information-Page',
      sitetest3:
        'https://en.help.roblox.com/hc/en-us/articles/13061189551124-Developer-Exchange-Help-and-Information-Page',
      sitetest2:
        'https://en.help.roblox.com/hc/en-us/articles/13061189551124-Developer-Exchange-Help-and-Information-Page',
      sitetest1:
        'https://en.help.roblox.com/hc/en-us/articles/13061189551124-Developer-Exchange-Help-and-Information-Page',
      production:
        'https://en.help.roblox.com/hc/en-us/articles/13061189551124-Developer-Exchange-Help-and-Information-Page',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  trustedConnectionsLearnMoreUrl: {
    global: {
      development:
        'https://en.help.roblox.com/hc/en-us/articles/37725513985812-Unlocking-Trusted-Connections-Expressive-Chat-Features-Party-Voice-chat-without-filters',
      sitetest3:
        'https://en.help.roblox.com/hc/en-us/articles/37725513985812-Unlocking-Trusted-Connections-Expressive-Chat-Features-Party-Voice-chat-without-filters',
      sitetest2:
        'https://en.help.roblox.com/hc/en-us/articles/37725513985812-Unlocking-Trusted-Connections-Expressive-Chat-Features-Party-Voice-chat-without-filters',
      sitetest1:
        'https://en.help.roblox.com/hc/en-us/articles/37725513985812-Unlocking-Trusted-Connections-Expressive-Chat-Features-Party-Voice-chat-without-filters',
      production:
        'https://en.help.roblox.com/hc/en-us/articles/37725513985812-Unlocking-Trusted-Connections-Expressive-Chat-Features-Party-Voice-chat-without-filters',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  templateUrl: {
    global: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
    // TODO: Find the right URLs for Luobu
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  gameDetailsPageDocsUrl: {
    global: {
      development: 'https://create.sitetest3.robloxlabs.com/docs/en-us/audio/assets#visibility',
      sitetest3: 'https://create.sitetest3.robloxlabs.com/docs/en-us/audio/assets#visibility',
      sitetest2: 'https://create.sitetest3.robloxlabs.com/docs/en-us/audio/assets#visibility',
      sitetest1: 'https://create.sitetest1.robloxlabs.com/docs/en-us/audio/assets#visibility',
      production: 'https://create.roblox.com/docs/audio/assets#visibility',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
  songEligibilityDocsUrl: {
    global: {
      development: 'https://create.sitetest3.robloxlabs.com/docs/en-us/audio/assets#visibility',
      sitetest3: 'https://create.sitetest3.robloxlabs.com/docs/en-us/audio/assets#visibility',
      sitetest2: 'https://create.sitetest3.robloxlabs.com/docs/en-us/audio/assets#visibility',
      sitetest1: 'https://create.sitetest1.robloxlabs.com/docs/en-us/audio/assets#visibility',
      production: 'https://create.roblox.com/docs/audio/assets#visibility',
    },
    luobu: {
      development: '',
      sitetest3: '',
      sitetest2: '',
      sitetest1: '',
      production: '',
    },
  },
};

export type TUrlMapKey = keyof typeof URL_MAP;

export default URL_MAP;
