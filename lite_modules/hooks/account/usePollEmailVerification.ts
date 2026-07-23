import { useEffect, useRef, useState } from 'react';

import { AppStoreType, useAppStore } from '@stores/appStoreProvider';

/** Interval between verification checks while waiting for the user to complete email verification */
const POLL_INTERVAL_MS = 4000;

/** Stop polling after this duration; user can still use the manual “I have verified” action */
const MAX_POLL_DURATION_MS = 5 * 60 * 1000;

/**
 * Calls `getEmailVerified` on an interval while `active` is true (e.g. after sending a verification email).
 * Stops when the email is verified, `active` becomes false, the component unmounts, or max duration is reached.
 * Skips requests while the document is hidden; runs a check when the tab becomes visible again.
 */
const usePollEmailVerification = (active: boolean) => {
  const getEmailVerified = useAppStore((state: AppStoreType) => state.getEmailVerified);
  const hasVerifiedEmail = useAppStore((state: AppStoreType) => state.appData.hasVerifiedEmail);
  const [timedOut, setTimedOut] = useState<boolean>(false);

  const activeRef = useRef<boolean>(active);
  activeRef.current = active;

  useEffect(() => {
    if (!active) {
      setTimedOut(false);
      return () => {};
    }

    setTimedOut(false);

    if (hasVerifiedEmail) {
      return () => {};
    }

    const startedAt = Date.now();
    let cancelled = false;
    let pollIntervalId: number | undefined;

    const clearPollInterval = () => {
      if (pollIntervalId !== undefined) {
        window.clearInterval(pollIntervalId);
        pollIntervalId = undefined;
      }
    };

    const runCheck = async () => {
      if (cancelled || !activeRef.current) {
        return;
      }
      if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
        setTimedOut(true);
        clearPollInterval();
        return;
      }
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      try {
        await getEmailVerified();
      } catch {
        // Keep polling on transient API errors
      }
    };

    runCheck().catch(() => undefined);

    pollIntervalId = window.setInterval(() => {
      runCheck().catch(() => undefined);
    }, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        runCheck().catch(() => undefined);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      cancelled = true;
      clearPollInterval();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [active, getEmailVerified, hasVerifiedEmail]);

  const isPolling = active && !timedOut && !hasVerifiedEmail;

  return { isPolling, pollTimedOut: timedOut };
};

export default usePollEmailVerification;
