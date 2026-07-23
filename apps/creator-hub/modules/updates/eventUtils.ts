import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

export enum EUpdatesPageSection {
  TabNavigation = 'tabNavigation',
  TabActions = 'tabActions',
  ChangelogFilters = 'changelogFilters',
  ChangelogSearch = 'changelogSearch',
  ChangelogPost = 'changelogPost',
  UpdatesPageView = 'updatesPageView',
  RoadmapTabView = 'roadmapTabView',
  RoadmapBanner = 'roadmapBanner',
}

export const captureUpdatesPageView = (
  eventName: string,
  section: EUpdatesPageSection,
  params: Record<string, string> = {},
) => {
  unifiedLoggerClient.logImpressionEvent({
    eventName,
    parameters: { section, page: 'updatespage', ...params },
  });
};

export const captureUpdatesPageEvent = (
  eventName: string,
  section: EUpdatesPageSection,
  params: Record<string, string> = {},
) => {
  unifiedLoggerClient.logClickEvent({
    eventName,
    parameters: { section, page: 'updatespage', ...params },
  });
};
