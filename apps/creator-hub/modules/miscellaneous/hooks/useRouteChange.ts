import { useEffect } from 'react';
import Router from 'next/router';

const stopRouteChange = () => {
  const cancellationError = new Error('Blocking route change for unsaved changes');
  // Next.js only treats thrown route-change errors as intentional navigation
  // cancellations when this marker is present. Without it, the router handles
  // the guard as a failed navigation and can tear down the page showing the
  // dialog instead of leaving the user in place.
  Object.assign(cancellationError, { cancelled: true });
  throw cancellationError;
};

const useRouteChange = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE (@mbae 05/09/24) React 18 migration: Unsure what the right solution is for this event typing
  handleStart?: (stopRouteChangeParam: typeof stopRouteChange) => (...evts: any[]) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE (@mbae 05/09/24) React 18 migration: Unsure what the right solution is for this event typing
  handleComplete?: (...evts: any[]) => void,
) => {
  useEffect(() => {
    const parsedHandleStart = handleStart !== undefined ? handleStart(stopRouteChange) : undefined;
    if (parsedHandleStart) {
      Router.events.on('routeChangeStart', parsedHandleStart);
    }
    return () => {
      if (parsedHandleStart) {
        Router.events.off('routeChangeStart', parsedHandleStart);
      }
    };
  }, [handleStart]);

  useEffect(() => {
    if (handleComplete) {
      Router.events.on('routeChangeComplete', handleComplete);
    }

    return () => {
      if (handleComplete) {
        Router.events.off('routeChangeComplete', handleComplete);
      }
    };
  }, [handleComplete]);
};

export default useRouteChange;
