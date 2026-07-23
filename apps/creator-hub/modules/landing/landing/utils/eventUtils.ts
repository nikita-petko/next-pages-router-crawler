import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

export const captureLandingPageImpression = () => {
  unifiedLoggerClient.logImpressionEvent({
    eventName: 'landing',
  });
};
export default captureLandingPageImpression;
