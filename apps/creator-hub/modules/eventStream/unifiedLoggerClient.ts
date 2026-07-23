import type {
  PageLoadEvent,
  SessionEvent,
  WebVitalsEvent,
  ApiVitalsEvent,
} from '@rbx/unified-logger';
import { UnifiedLogger } from '@rbx/unified-logger';
import { eventStreamBaseUrl } from './tracker';

// url pattern: https://create.roblox.com/creations/experiences/<id>/access
const ExperienceAccessRegex = /experiences\/.+\/access\/*$/;
// url pattern: https://create.roblox.com/creations/experiences/<id>/passes/*, https://create.roblox.com/creations/experiences/<id>/associated-items?activeTab=Pass
const GamepassRegex = /experiences\/.+\/(associated-items\?activeTab=Pass|passes)\/?/;
// url pattern: https://create.roblox.com/creations/experiences/<id>/permissions
const ExperiencePermissionsRegex = /experiences\/.+\/permissions\/*$/;
// url pattern: https://create.roblox.com/creations/store/<id>/permissions
const AssetConfigurePermissionsRegex = /store\/.+\/permissions\/*$/;
// urlpattern: https://https://create.roblox.com/dashboard/creations/events/<id>/configure
const EventConfigureRegex = /events\/.+\/configure\/*$/;
// url pattern: https://https://create.roblox.com/dashboard/creations/experiences/<id>/feedback
const FeedbackRegex = /experiences\/.+\/feedback\/*$/;
// url pattern: https://https://create.roblox.com/explore/licenses/<id>
const ExploreLicensesViewListingRegex = /explore\/licenses\/.+\/*$/;
// url pattern: https://https://create.roblox.com/explore/licenses/<id>/<id>/request
const ExploreLicensesRequestLicenseRegex = /explore\/licenses\/.+\/.+\/request$/;
// url pattern: https://https://create.roblox.com/dashboard/license-manager/agreements/<id>
const LicenseManagerAgreementsRegex = /license-manager\/agreements\/.+\/*$/;
// url pattern: https://https://create.roblox.com/dashboard/license-manager/license-listings/<id>
const LicenseManagerLicenseListingsRegex = /license-manager\/license-listings\/.+\/*$/;
// url pattern: https://https://create.roblox.com/dashboard/license-manager/creator-agreements/<id>
const LicenseManagerCreatorAgreementsRegex = /license-manager\/creator-agreements\/.+\/*$/;
// url pattern: https://https://create.roblox.com/ip/ip-library/<id>
const IpIpLibraryRegex = /ip\/ip-library\/.+\/*$/;

const unifiedLoggerClient = new UnifiedLogger({
  eventBaseUrl: eventStreamBaseUrl,
  product: 'CreatorDashboard',
  sessionProductGroup: 'CreatorHub',
});

// urls pattern: https://create.roblox.com/creations/experiences/<id>/(analytics|monetization)/(subpage)
const analyticsSubpageUrlRegex = /experiences\/\d+\/(analytics|monetization)\/([^/]+)\/*$/;
type AnalyticsUrlTagConfig = {
  regex: RegExp;
  matchGroups: string[];
  tags: Array<Parameters<PageLoadEvent['addTag']>[0]>; // TTag is not exported
};

const analyticsUrlTagConfigs: AnalyticsUrlTagConfig[] = [
  {
    regex: /analytics\/*$/,
    matchGroups: [],
    tags: ['analytics', 'analytics/home'],
  },
  {
    regex: /experiences\/\d+\/overview\/*$/,
    matchGroups: [],
    tags: ['analytics', 'analytics/overview', 'analytics/overview/experience-overview'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['analytics', 'retention'],
    tags: ['analytics', 'analytics/overview', 'analytics/overview/retention'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['analytics', 'engagement'],
    tags: ['analytics', 'analytics/overview', 'analytics/overview/engagement'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['analytics', 'acquisition'],
    tags: ['analytics', 'analytics/overview', 'analytics/overview/acquisition'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['analytics', 'audience'],
    tags: ['analytics', 'analytics/overview', 'analytics/overview/audience'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['analytics', 'economy'],
    tags: ['analytics', 'analytics/overview', 'analytics/overview/economy'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['analytics', 'funnels'],
    tags: ['analytics', 'analytics/overview', 'analytics/overview/funnels'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['monetization', 'overview'],
    tags: ['analytics', 'analytics/monetization', 'analytics/monetization/overview'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['monetization', 'developer-products'],
    tags: ['analytics', 'analytics/monetization', 'analytics/monetization/developer-products'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['monetization', 'passes'],
    tags: ['analytics', 'analytics/monetization', 'analytics/monetization/passes'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['monetization', 'avatar-items'],
    tags: ['analytics', 'analytics/monetization', 'analytics/monetization/avatar-items'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['monetization', 'immersive-ads'],
    tags: ['analytics', 'analytics/monetization', 'analytics/monetization/immersive-ads'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['monetization', 'subscriptions'],
    tags: ['analytics', 'analytics/monetization', 'analytics/monetization/subscriptions'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['monetization', 'engagement-payouts'],
    tags: ['analytics', 'analytics/monetization', 'analytics/monetization/engagement-payouts'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['analytics', 'performance'],
    tags: ['analytics', 'analytics/monitoring', 'analytics/monitoring/performance'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['analytics', 'errors'],
    tags: ['analytics', 'analytics/monitoring', 'analytics/monitoring/errors'],
  },
  {
    regex: analyticsSubpageUrlRegex,
    matchGroups: ['analytics', 'memory-stores'],
    tags: ['analytics', 'analytics/monitoring', 'analytics/monitoring/memory-stores'],
  },
];

type TCollaborationsUrlTags = {
  regex: RegExp;
  tags: Array<Parameters<PageLoadEvent['addTag']>[0]>;
};

// TODO: move to team specific modules.
const collaborationsUrlTagConfigs: TCollaborationsUrlTags[] = [
  {
    regex: /group\/members\/*$/,
    tags: ['collaboration', 'collaboration/members'],
  },
  {
    regex: /group\/roles\/*$/,
    tags: ['collaboration', 'collaboration/roles'],
  },
  {
    regex: /group\/profile\/*$/,
    tags: ['collaboration', 'collaboration/profile'],
  },
  {
    regex: /group\/payouts\/*$/,
    tags: ['collaboration', 'collaboration/payouts'],
  },
  {
    regex: /group\/activity-history\/*$/,
    tags: ['collaboration', 'collaboration/activity-history'],
  },
];

const tagEvent = (event: ApiVitalsEvent | PageLoadEvent | SessionEvent) => {
  // test tagging analytics pageviews
  const url = event.getURL();
  const pathname = url ? new URL(url).pathname : '';
  const matchedAnalyticsTag = analyticsUrlTagConfigs.find((config) => {
    const matches = pathname.match(config.regex);
    return (
      matches && config.matchGroups.every((matchGroup, index) => matchGroup === matches[index + 1])
    );
  });
  if (matchedAnalyticsTag) {
    matchedAnalyticsTag.tags.forEach((tag) => event.addTag(tag));
  }

  const matchedCollaborationsTag = collaborationsUrlTagConfigs.find((config) => {
    return pathname.match(config.regex);
  });
  if (matchedCollaborationsTag) {
    matchedCollaborationsTag.tags.forEach((tag) => event.addTag(tag));
  }

  if (pathname.endsWith('settings/webhooks')) {
    // tag webhooks setting pageviews
    event.addTag('settings/webhooks');
  } else if (pathname.endsWith('settings/preferences')) {
    event.addTag('settings/preferences');
  } else if (pathname.endsWith('roadmap')) {
    event.addTag('roadmap');
  } else if (pathname.endsWith('landing')) {
    event.addTag('landing');
  } else if (pathname === '/') {
    event.addTag('homepage');
  } else if (pathname.endsWith('creator')) {
    event.addTag('developerLanding');
  } else if (ExperienceAccessRegex.test(pathname)) {
    event.addTag('experiences/access');
  } else if (url?.match(GamepassRegex)) {
    event.addTag('gamepass');
  } else if (pathname.endsWith('activity-history') && !matchedCollaborationsTag) {
    // making sure not to tag group activity history along side universe activity history
    event.addTag('activity-feed');
  } else if (ExperiencePermissionsRegex.test(pathname)) {
    event.addTag('experiences/permissions');
  } else if (AssetConfigurePermissionsRegex.test(pathname)) {
    event.addTag('asset/permissions');
  } else if (pathname.endsWith('events/create')) {
    event.addTag('events/create');
  } else if (EventConfigureRegex.test(pathname)) {
    event.addTag('events/configure');
  } else if (FeedbackRegex.test(pathname)) {
    event.addTag('player-feedback');
  } else if (pathname.endsWith('rights-manager') || pathname.endsWith('rights-manager/register')) {
    event.addTag('rights-manager/register');
  } else if (pathname.endsWith('rights-manager/removal-requests')) {
    event.addTag('rights-manager/removal-requests');
  } else if (pathname.endsWith('rights-manager/matches')) {
    event.addTag('rights-manager/matches');
  } else if (pathname.endsWith('license-manager/licenses')) {
    event.addTag('license-manager/licenses');
  } else if (pathname.endsWith('license-manager/matches')) {
    event.addTag('license-manager/matches');
  } else if (pathname.endsWith('license-manager/ip-library')) {
    event.addTag('license-manager/ip-library');
  } else if (pathname.endsWith('license-manager/creator-agreements')) {
    event.addTag('license-manager/creator-agreements');
  } else if (LicenseManagerLicenseListingsRegex.test(pathname)) {
    event.addTag('license-manager/license-listings/view-listing');
  } else if (LicenseManagerAgreementsRegex.test(pathname)) {
    event.addTag('license-manager/agreements/view-agreement');
  } else if (LicenseManagerCreatorAgreementsRegex.test(pathname)) {
    event.addTag('license-manager/creator-agreements/view-agreement');
  } else if (pathname.endsWith('license-manager/ip-library/create')) {
    event.addTag('license-manager/ip-library/create');
  } else if (IpIpLibraryRegex.test(pathname)) {
    event.addTag('license-manager/ip-library/view-family');
  } else if (pathname.endsWith('explore/licenses')) {
    event.addTag('explore/licenses');
  } else if (ExploreLicensesViewListingRegex.test(pathname)) {
    event.addTag('explore/licenses/view-listing');
  } else if (ExploreLicensesRequestLicenseRegex.test(pathname)) {
    event.addTag('explore/licenses/request');
  }
};

unifiedLoggerClient.events.on('pageload', (event: PageLoadEvent) => {
  tagEvent(event);
});

unifiedLoggerClient.events.on('webvitals', (event: WebVitalsEvent) => {
  tagEvent(event);
});

unifiedLoggerClient.events.on('apivitals', (event: ApiVitalsEvent) => {
  tagEvent(event);
});

unifiedLoggerClient.events.on('session', (event: SessionEvent) => {
  // tagging sessions that starts on these landing pages
  const url = event.getURL();
  const pathname = url ? new URL(url).pathname : '';
  if (pathname.endsWith('roadmap')) {
    event.addTag('roadmap');
  } else if (pathname.endsWith('landing')) {
    event.addTag('landing');
  } else if (pathname === '/') {
    event.addTag('homepage');
  } else if (pathname.endsWith('creator')) {
    event.addTag('developerLanding');
  }
});

export default unifiedLoggerClient;
