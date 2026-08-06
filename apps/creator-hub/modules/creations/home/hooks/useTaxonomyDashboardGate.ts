import { useFlag } from '@rbx/flags';
import { enableTaxonomyBasedCreatorDashboard } from '@generated/flags/avatarMarketplace';

/**
 * Whether the current user gets the taxonomy-based Creator Dashboard Avatar Items experience.
 *
 * Every consumer of the flag goes through this hook: a gate honoured in one place and missed in
 * another shows the feature half-applied. Treats "still loading" as off, so the legacy item-type
 * chips render rather than an empty page.
 */
const useTaxonomyDashboardGate = (): boolean => {
  const { ready, value } = useFlag(enableTaxonomyBasedCreatorDashboard);

  return ready && (value ?? false);
};

export default useTaxonomyDashboardGate;
