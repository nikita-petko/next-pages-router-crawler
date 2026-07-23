import { useEffect, useRef, useState } from 'react';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import loadImpactScoutPage, { type ScoutPagingParameters } from '../utils/loadImpactScoutPage';

export type ImpactScoutStatus = 'checking' | 'found' | 'none';

export interface UseHasImpactedExperienceInViewResult {
  status: ImpactScoutStatus;
  pagesChecked: number;
  gaveUp: boolean;
}

const DEFAULT_MAX_PAGES = 8;

export default function useHasImpactedExperienceInView(
  pagingParameters: ScoutPagingParameters,
  enabled: boolean,
): UseHasImpactedExperienceInViewResult {
  const [status, setStatus] = useState<ImpactScoutStatus>(enabled ? 'checking' : 'none');
  const [pagesChecked, setPagesChecked] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  const fetchIdRef = useRef(0);

  const { settings } = useSettings();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const maxPages =
    settings.impactedBannerScoutMaxPages > 0
      ? settings.impactedBannerScoutMaxPages
      : DEFAULT_MAX_PAGES;

  useEffect(() => {
    fetchIdRef.current += 1;
    const myFetchId = fetchIdRef.current;

    if (!enabled) {
      setStatus('none');
      setPagesChecked(0);
      setGaveUp(false);
      return;
    }

    setStatus('checking');
    setPagesChecked(0);
    setGaveUp(false);

    unifiedLogger.logImpressionEvent({
      eventName: CreatorDashboardEventType.ImpactedBannerScoutStart,
      parameters: {
        page: 'creations',
        assetType: pagingParameters.assetType.toString(),
      },
    });

    const run = async () => {
      let cursor: string | undefined;
      let pages = 0;

      while (true) {
        if (fetchIdRef.current !== myFetchId) {
          return;
        }

        let page: { anyImpacted: boolean; nextPageCursor: string | undefined };
        try {
          page = await loadImpactScoutPage({ ...pagingParameters, cursor });
        } catch {
          if (fetchIdRef.current !== myFetchId) {
            return;
          }
          setStatus('none');
          return;
        }

        if (fetchIdRef.current !== myFetchId) {
          return;
        }

        pages += 1;
        setPagesChecked(pages);

        if (page.anyImpacted) {
          setStatus('found');
          unifiedLogger.logImpressionEvent({
            eventName: CreatorDashboardEventType.ImpactedBannerScoutFound,
            parameters: { pagesChecked: pages.toString() },
          });
          return;
        }

        if (!page.nextPageCursor) {
          setStatus('none');
          return;
        }

        if (pages >= maxPages) {
          setStatus('none');
          setGaveUp(true);
          unifiedLogger.logImpressionEvent({
            eventName: CreatorDashboardEventType.ImpactedBannerScoutGaveUp,
            parameters: { pagesChecked: pages.toString() },
          });
          return;
        }

        cursor = page.nextPageCursor;
      }
    };

    void run();
  }, [pagingParameters, enabled, maxPages, unifiedLogger]);

  return { status, pagesChecked, gaveUp };
}
