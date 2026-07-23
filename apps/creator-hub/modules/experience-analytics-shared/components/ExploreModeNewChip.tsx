import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Chip } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { analyticsExploreNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getCachedHasCustomEvents } from '../exploreMode/exploreModeHasCustomEventsStorage';
import {
  useAnalyticsNavigationStorageScope,
  useHasUserSeenAnalyticsNavigationItem,
} from './AnalyticsNavigationNewBadge';

/**
 * The NUX tooltip is rendered after the navigation has settled and is visible
 * for long enough that a creator can read it before it auto-dismisses itself.
 * Mirrors the auto-dismiss cadence used by `useCollapseNux` while giving more
 * room because this tip carries a title + description rather than a one-liner.
 */
const NUX_DISPLAY_DELAY_MS = 500;
const NUX_AUTO_DISMISS_MS = 8000;

/**
 * Route scope for Explore-mode localStorage (signed-in user plus universe `[id]`).
 * Manual QA reset: remove the two keys formed as
 * `/analytics/explore.${universeId}.${userId}.hasUserSeen` and
 * `exploreMode.nav.${universeId}.${userId}.tooltipNuxSeen`.
 */
export const useExploreModeStorageScope = useAnalyticsNavigationStorageScope;

/**
 * Explore-mode left-rail "New" chip dismissal, scoped per user + universe (unlike
 * `useHasUserSeenAnalyticsPage`, which is only per user).
 */
export const useHasUserSeenExploreModeNavChip = () => {
  return useHasUserSeenAnalyticsNavigationItem(analyticsExploreNavigationItem.path);
};

const nuxSeenKey = (universeId: number | string, userId: number) =>
  `exploreMode.nav.${universeId}.${userId}.tooltipNuxSeen`;

const noopSetNux = () => {};

const useHasSeenExploreNavTooltipNux = () => {
  const { user } = useAuthentication();
  const { universeId, scopeReady } = useExploreModeStorageScope();
  const hiddenUntilScopeReady = !scopeReady;
  const [hasSeenNux, setHasSeenNux] = useLocalStorage<boolean>(
    nuxSeenKey(universeId, user?.id ?? -1),
    false,
  );

  return useMemo(
    () => ({
      hasSeenNux: !user?.id ? true : hiddenUntilScopeReady ? true : hasSeenNux,
      setHasSeenNux: hiddenUntilScopeReady ? noopSetNux : setHasSeenNux,
    }),
    [hasSeenNux, setHasSeenNux, user?.id, hiddenUntilScopeReady],
  );
};

/**
 * Public hook for pages that should mark the Explore-mode left-rail NUX
 * tooltip as seen on mount — typically the Explore mode page itself, since
 * landing on it means the creator no longer needs the pointer.
 */
export const useMarkExploreNavTooltipNuxSeen = (): (() => void) => {
  const { setHasSeenNux } = useHasSeenExploreNavTooltipNux();
  return useCallback(() => {
    setHasSeenNux(true);
  }, [setHasSeenNux]);
};

/**
 * "New" chip rendered on the Explore-mode entry in the primary creations
 * left rail. Persists per user and universe via localStorage and disappears once the
 * creator has visited the Explore page (set by the page itself).
 *
 * When the per-universe `exploreModeHasCustomEvents` cache reports that this
 * experience has fired custom events in the last 90 days, the chip also
 * auto-opens a NUX tooltip pointing the creator at the new visualization.
 * The tooltip is gated by its own per-user, per-universe "seen" flag so it only auto-opens
 * once.
 */
const ExploreModeNewChip: FC = () => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);

  const { universeIdFromQuery } = useExploreModeStorageScope();
  const { hasUserSeen: hasUserSeenChip } = useHasUserSeenExploreModeNavChip();
  const { hasSeenNux, setHasSeenNux } = useHasSeenExploreNavTooltipNux();
  // Read the "has custom events" answer live rather than snapshotting on
  // mount: on a hard navigation into a dynamic route, `router.query.id` can
  // be empty until `router.isReady` flips on a later render. A mount-time
  // snapshot would lock the tooltip off for the rest of the session in that
  // window. `hasSeenNux` already gates the tooltip to a one-shot, so we don't
  // need additional render-stability here.
  const hasCustomEvents =
    universeIdFromQuery != null && getCachedHasCustomEvents(universeIdFromQuery) === true;

  const shouldShowNux = !hasUserSeenChip && !hasSeenNux && hasCustomEvents;

  const [isNuxOpen, setIsNuxOpen] = useState(false);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!shouldShowNux) {
      return undefined;
    }
    showTimeoutRef.current = setTimeout(() => {
      setIsNuxOpen(true);
      dismissTimeoutRef.current = setTimeout(() => {
        setIsNuxOpen(false);
        setHasSeenNux(true);
      }, NUX_AUTO_DISMISS_MS);
    }, NUX_DISPLAY_DELAY_MS);

    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [shouldShowNux, setHasSeenNux]);

  if (hasUserSeenChip) {
    return null;
  }

  const chip = (
    <Chip
      label={translate('Label.New')}
      color='primaryBrand'
      variant='filled'
      component='span'
      size='small'
    />
  );

  if (!hasCustomEvents) {
    return chip;
  }

  const nuxTitle = tPendingTranslation(
    'Try the new Explore mode',
    'Title of the NUX tooltip shown next to the Explore-mode entry in the left navigation when the user has fired custom events in the last 90 days.',
    translationKey('Title.ExploreMode.NavNuxTooltip', TranslationNamespace.Analytics),
  );
  const nuxDescription = tPendingTranslation(
    'Visualize your custom events alongside built-in metrics with the new Explore mode.',
    'Description of the NUX tooltip shown next to the Explore-mode entry in the left navigation when the user has fired custom events in the last 90 days.',
    translationKey('Description.ExploreMode.NavNuxTooltip', TranslationNamespace.Analytics),
  );

  return (
    <Tooltip open={isNuxOpen} title={nuxTitle} description={nuxDescription} position='right-center'>
      <TooltipTrigger asChild>
        <span>{chip}</span>
      </TooltipTrigger>
    </Tooltip>
  );
};

export default withNamespaceSwitchedTranslation(ExploreModeNewChip, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Navigation,
]);
