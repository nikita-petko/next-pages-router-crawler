import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { isManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import type { ManagedPricingOnboardingStatus } from '@modules/managed-pricing/types';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import { useIsPriceOptimizationActive } from '@modules/price-optimization/queries/useIsPriceOptimizationActive';
import { useUniversePermissions } from '@modules/react-query/organizations';
import PassesTable from '../components/PassesTable';
import PassesTableEmptyState from '../components/PassesTableEmptyState';
import { useListAllPassesForUniverse } from '../queries/useListAllPassesForUniverse';
import { transformGamePassesForTable } from '../utils/passesUtils';

type Props = {
  universeId: number;
  managedPricingOnboardingStatus?: ManagedPricingOnboardingStatus;
};

const INITIAL_ROWS_PER_PAGE_WITH_MANAGED_PRICING = 10;

function GamePassesTableContainer({ universeId, managedPricingOnboardingStatus }: Props) {
  const { translate } = useTranslation();
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  const router = useRouter();

  const {
    data: passes = [],
    isError: isGetAllPassesError,
    isLoading: isLoadingPasses,
  } = useListAllPassesForUniverse(universeId, {
    select: transformGamePassesForTable,
  });

  const { isPriceOptimizationActive, isLoading: isLoadingPriceOptimization } =
    useIsPriceOptimizationActive();

  if (isLoadingPermissions || isLoadingPasses || isLoadingPriceOptimization) {
    return <ProgressCircleLoader />;
  }

  if (permissions?.monetizeExperience === false) {
    return <AccessDeniedPage />;
  }

  if (isGetAllPassesError) {
    return (
      <FailureView
        message={translate('Message.LoadItemsError', {
          itemType: translate('Label.GamePasses'),
        })}
        onReload={router.reload}
      />
    );
  }

  if (passes.length === 0) {
    return <PassesTableEmptyState universeId={universeId} />;
  }

  return (
    <PassesTable
      universeId={universeId}
      passes={passes}
      showPriceOptimization={isPriceOptimizationActive}
      managedPricingOnboardingStatus={managedPricingOnboardingStatus}
      initialRowsPerPage={
        isManagedPricingAvailable(managedPricingOnboardingStatus)
          ? INITIAL_ROWS_PER_PAGE_WITH_MANAGED_PRICING
          : undefined
      }
    />
  );
}

export default withTranslation(GamePassesTableContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Navigation,
  TranslationNamespace.Table,
  TranslationNamespace.Passes,
  TranslationNamespace.ManagedPricing,
]);
