import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

export enum EDeveloperLandingSection {
  Hero = 'hero',
  Experiences = 'experiences',
  CreateAndScale = 'createAndScale',
  Monetize = 'monetize',
  Community = 'community',
  Studio = 'studio',
  CreatorHub = 'creatorHub',
  Latest = 'latest',
  StartCreating = 'startCreating',
}

const pageName = 'developerLanding';

export const captureDeveloperLandingEvent = (
  eventName: string,
  section: EDeveloperLandingSection,
  params: Record<string, string> = {},
) => {
  unifiedLoggerClient.logClickEvent({
    eventName,
    parameters: { section, page: pageName, ...params },
    tags: ['developerLanding'],
  });
};

export const captureDeveloperLandingImpression = () => {
  unifiedLoggerClient.logImpressionEvent({
    eventName: pageName,
    tags: ['developerLanding'],
  });
};

export const captureDeveloperLandingSectionImpression = (section: EDeveloperLandingSection) => {
  unifiedLoggerClient.logImpressionEvent({
    eventName: `${pageName}Section`,
    parameters: { section, page: pageName },
    tags: ['developerLanding'],
  });
};

export const DEVELOPER_LANDING_PAGE_IMPRESSION_THRESHOLD = 0.5;
