import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

export enum EHomepageSection {
  AvatarItems = 'avatarItems',
  ContextSwitcher = 'contextSwitcher',
  Experiences = 'experiences',
  Articles = 'articles',
  DeveloperSubscriptionsBanner = 'developerSubscriptionsBanner',
  ExploreCreatorHub = 'exploreCreatorHub',
  Onboarding = 'onboarding',
  VideoOnboarding = 'videoOnboarding',
  WhatIsNew = 'whatIsNew',
  HomePageAnnouncements = 'homePageAnnouncements',
  BeginnerTools = 'beginnerTools',
  Videos = 'videos',
  CommunityStories = 'communityStories',
  PersonalizationBanner = 'personalizationBanner',
  ExperienceWatchlist = 'experienceWatchlist',
  Opportunities = 'opportunities',
}

export const captureHomepageEvent = (
  eventName: string,
  section: EHomepageSection,
  params: Record<string, string> = {},
) => {
  unifiedLoggerClient.logClickEvent({
    eventName,
    parameters: { section, page: 'homepage', ...params },
  });
};

export const captureHomepageImpression = () => {
  unifiedLoggerClient.logImpressionEvent({
    eventName: 'homepage',
  });
};

export const captureHomepageView = (
  eventName: string,
  section: EHomepageSection,
  params: Record<string, string> = {},
) => {
  unifiedLoggerClient.logImpressionEvent({
    eventName,
    parameters: { section, page: 'homepage', ...params },
  });
};
