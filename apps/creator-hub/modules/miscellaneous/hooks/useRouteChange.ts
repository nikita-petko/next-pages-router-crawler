import { useEffect } from 'react';
import Router from 'next/router';

const stopRouteChange = () => {
  throw new Error('Blocking route change for unsaved changes');
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
