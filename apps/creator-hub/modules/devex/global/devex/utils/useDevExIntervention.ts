/* oxlint-disable react/react-compiler -- intervention state syncs async fetch results with modal lifecycle */
import { useCallback, useEffect, useRef, useState } from 'react';
import behaviorInterventionClient from '@modules/clients/behaviorIntervention';
import type { DevExInterventionDetail } from '@modules/clients/userModerationTypes';

type UseDevExInterventionOptions = {
  /** When false, skips fetch and returns null intervention. */
  enabled: boolean;
  /**
   * Change when switching modals (e.g. suspension → at-risk) so the hook refetches
   * and picks up the next unacknowledged intervention.
   */
  fetchKey: string;
  /** Intervention fetched in parallel with economy on DevEx page load. */
  pageLoadIntervention?: DevExInterventionDetail | null;
  isPageLoadInterventionReady?: boolean;
};

type UseDevExInterventionResult = {
  intervention: DevExInterventionDetail | null;
  isInterventionLoading: boolean;
  dismissIntervention: (detail: DevExInterventionDetail | null) => Promise<boolean>;
};

export async function dismissInterventionDetail(
  detail: DevExInterventionDetail | null | undefined,
): Promise<boolean> {
  if (!detail?.interventionId) {
    return false;
  }

  if (!detail.acknowledgeable) {
    return false;
  }

  try {
    await behaviorInterventionClient.dismissIntervention(detail.interventionId);
    return true;
  } catch {
    return false;
  }
}

function resolveInterventionDetail(
  fetched: DevExInterventionDetail | null,
  pageLoadIntervention: DevExInterventionDetail | null | undefined,
): DevExInterventionDetail | null {
  if (fetched?.interventionId) {
    return fetched;
  }

  if (pageLoadIntervention?.interventionId) {
    return pageLoadIntervention;
  }

  return fetched;
}

/**
 * Loads the active DevEx intervention from behavior-intervention and exposes dismiss/acknowledge.
 */
function useDevExIntervention({
  enabled,
  fetchKey,
  pageLoadIntervention = null,
  isPageLoadInterventionReady = true,
}: UseDevExInterventionOptions): UseDevExInterventionResult {
  const [intervention, setIntervention] = useState<DevExInterventionDetail | null>(null);
  const [isInterventionLoading, setIsInterventionLoading] = useState(enabled);
  const loadedFetchKeyRef = useRef<string | null>(null);
  const pageLoadInterventionRef = useRef(pageLoadIntervention);
  pageLoadInterventionRef.current = pageLoadIntervention;

  useEffect(() => {
    if (!enabled) {
      setIntervention(null);
      setIsInterventionLoading(false);
      loadedFetchKeyRef.current = null;
      return undefined;
    }

    if (!isPageLoadInterventionReady) {
      setIsInterventionLoading(true);
      return undefined;
    }

    const pageLoadDetail = pageLoadIntervention?.interventionId ? pageLoadIntervention : null;

    if (loadedFetchKeyRef.current === null && pageLoadDetail) {
      setIntervention(pageLoadDetail);
      loadedFetchKeyRef.current = fetchKey;
      setIsInterventionLoading(false);
      return undefined;
    }

    if (loadedFetchKeyRef.current === fetchKey) {
      if (pageLoadDetail) {
        setIntervention((current) => (current?.interventionId ? current : pageLoadDetail));
      }
      setIsInterventionLoading(false);
      return undefined;
    }

    let isActive = true;
    setIsInterventionLoading(true);

    behaviorInterventionClient
      .getDevExIntervention()
      .then((detail) => {
        if (!isActive) {
          return;
        }

        setIntervention((current) => {
          const resolved = resolveInterventionDetail(
            detail,
            pageLoadInterventionRef.current ?? null,
          );

          if (!resolved?.interventionId && current?.interventionId) {
            return current;
          }

          return resolved;
        });
        loadedFetchKeyRef.current = fetchKey;
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setIntervention(
          pageLoadInterventionRef.current?.interventionId ? pageLoadInterventionRef.current : null,
        );
        loadedFetchKeyRef.current = fetchKey;
      })
      .finally(() => {
        if (!isActive) {
          return;
        }
        setIsInterventionLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [enabled, fetchKey, isPageLoadInterventionReady, pageLoadIntervention]);

  const dismissIntervention = useCallback(
    (detail: DevExInterventionDetail | null) => dismissInterventionDetail(detail),
    [],
  );

  return { intervention, isInterventionLoading, dismissIntervention };
}

export default useDevExIntervention;
