import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useRouteChange } from '@modules/miscellaneous/hooks';
import { openDiscardChangesDialog } from './DiscardChangesDialog';

/**
 * Prompts before leaving the page while there are unsaved edits.
 *
 * Opens the shared `DiscardChangesDialog`; `onConfirm` runs the discard
 * and re-issues the blocked navigation.
 *
 * Page navigation is covered by the dialog; reload/close fall back to the
 * browser-native `beforeunload` prompt.
 *
 * NOTE: this relies on navigations being route changes — if something switches
 * views without a route change, this guard will miss it.
 *
 * @returns A one-navigation bypass for callers that have already deliberately
 * discarded their edits. Call it immediately before that navigation so the
 * route-change listener does not prompt a second time for data that is gone.
 */
export function useDiscardChangesPrompt(
  hasPendingEdits: boolean,
  shouldPromptForRoute?: (url: string) => boolean,
): () => void {
  const router = useRouter();
  // Lets the post-confirm re-navigation through the routeChangeStart guard.
  const bypassRef = useRef(false);

  const handleRouteChangeStart = useCallback(
    (stopRouteChange: () => never) => (url: string) => {
      if (!hasPendingEdits || bypassRef.current || shouldPromptForRoute?.(url) === false) {
        return;
      }
      openDiscardChangesDialog({
        onConfirm: () => {
          bypassRef.current = true;
          void router.push(url);
        },
      });
      stopRouteChange();
    },
    [hasPendingEdits, router, shouldPromptForRoute],
  );

  // Re-arm the guard once a (bypassed) navigation settles, in case the
  // component survives
  const handleRouteChangeComplete = useCallback(() => {
    bypassRef.current = false;
  }, []);

  useRouteChange(handleRouteChangeStart, handleRouteChangeComplete);

  useEffect(() => {
    if (!hasPendingEdits) {
      return undefined;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasPendingEdits]);

  return useCallback(() => {
    bypassRef.current = true;
  }, []);
}
