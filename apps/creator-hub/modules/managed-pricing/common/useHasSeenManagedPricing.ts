import { useHasSeenFeature } from '@modules/monetization-shared/feature-seen/useHasSeenFeature';

const FEATURE_KEY = 'managedPricing.monetization';

type Options = {
  /** When true, marks the feature seen on mount once scope is ready. */
  setOnMount?: boolean;
};

/**
 * Tracks whether the current user has visited the Managed Pricing page for the
 * given universe. Pass `{ setOnMount: true }` from the page itself to flip the
 * flag on visit; read-only consumers (e.g. the nav chip) omit the option.
 */
export const useHasSeenManagedPricing = (universeId: number | undefined, options?: Options) =>
  useHasSeenFeature({
    featureKey: FEATURE_KEY,
    universeId,
    setOnMount: options?.setOnMount,
  });
