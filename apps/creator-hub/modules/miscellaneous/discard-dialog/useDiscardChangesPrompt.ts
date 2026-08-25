import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import useRouteChange from '../hooks/useRouteChange';

export type DiscardChangesPrompt = {
  /** Skip the next route-change prompt (after a deliberate discard or save). */
  readonly bypass: () => void;
  readonly isOpen: boolean;
  /** Confirm discard and resume the blocked navigation. */
  readonly confirm: () => void;
  /** Dismiss the dialog and stay on the page. */
  readonly dismiss: () => void;
};

/**
 * Prompts before leaving the page while there are unsaved edits.
 *
 * Callers render a controlled `DiscardChangesDialog` from `isOpen` / `confirm` /
 * `dismiss`. Reload/close fall back to the browser-native `beforeunload` prompt.
 *
 * NOTE: this relies on navigations being route changes — if something switches
 * views without a route change, this guard will miss it.
 */
export function useDiscardChangesPrompt(
  hasPendingEdits: boolean,
  shouldPromptForRoute?: (url: string) => boolean,
): DiscardChangesPrompt {
  const router = useRouter();
  const bypassRef = useRef(false);
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);

  const handleRouteChangeStart = useCallback(
    (stopRouteChange: () => never) => (url: string) => {
      if (!hasPendingEdits || bypassRef.current || shouldPromptForRoute?.(url) === false) {
        return;
      }
      setBlockedUrl(url);
      stopRouteChange();
    },
    [hasPendingEdits, shouldPromptForRoute],
  );

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

  const bypass = useCallback(() => {
    bypassRef.current = true;
  }, []);

  const confirm = useCallback(() => {
    if (blockedUrl === null) {
      return;
    }
    const url = blockedUrl;
    setBlockedUrl(null);
    bypassRef.current = true;
    void router.push(url);
  }, [blockedUrl, router]);

  const dismiss = useCallback(() => {
    setBlockedUrl(null);
  }, []);

  return {
    bypass,
    isOpen: blockedUrl !== null,
    confirm,
    dismiss,
  };
}
