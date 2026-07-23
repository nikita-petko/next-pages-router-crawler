import { useCallback, useEffect } from 'react';
import { loadPageEventModel } from '@modules/eventStream/constants/eventConstants';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import useRouteChange from './useRouteChange';

/**
 * send the standard event streams for all page needed
 */
const usePageEventsTracker = () => {
  const { trackerClient } = useEventTrackerProvider();
  const handleRouteChangeComplete = useCallback(() => {
    const event = loadPageEventModel();
    trackerClient.sendEvent(event);
  }, [trackerClient]);
  useRouteChange(undefined, handleRouteChangeComplete);
  // log initial page load
  useEffect(() => handleRouteChangeComplete(), [handleRouteChangeComplete]);

  useEffect(() => {
    unifiedLoggerClient.trackPageLoad();
  }, []);
};

export default usePageEventsTracker;
