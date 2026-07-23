import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';

export const captureLandingPageEvent = (eventName: string, params: Record<string, string> = {}) => {
  unifiedLoggerClient.logClickEvent({
    eventName,
    parameters: { page: 'landing', ...params },
  });
};

export default captureLandingPageEvent;
