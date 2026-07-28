import { useRouter } from 'next/router';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { isManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import type { ManagedPricingOnboardingStatus } from '@modules/managed-pricing/types';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ProgressCircleLoader } from '@modules/monetization-shared/loaders';
import { useIsPriceOptimizationActive } from '@modules/price-optimization/queries/useIsPriceOptimizationActive';
import { useUniversePermissions } from '@modules/react-query/organizations';
import DeveloperProductsTable from '../components/DeveloperProductsTable';
import DeveloperProductsTableEmptyState from '../components/DeveloperProductsTableEmptyState';
import { useLoadInitialDeveloperProducts } from '../hooks/useLoadInitialDeveloperProducts';
import { DEFAULT_PAGE_SIZE } from '../queries/constants';

type Props = {
  universeId: number;
  managedPricingOnboardingStatus?: ManagedPricingOnboardingStatus;
  giftingTradingStatus?: GiftingTradingStatus;
  perFetchPageSize?: number;
  isArchived?: boolean;
};

const INITIAL_ROWS_PER_PAGE_WITH_MANAGED_PRICING = 10;

function DeveloperProductsTableContainer({
  universeId,
  managedPricingOnboardingStatus,
  giftingTradingStatus,
  perFetchPageSize = DEFAULT_PAGE_SIZE,
  isArchived,
}: Props) {
  const { translate } = useTranslation();
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const { isInitialLoading, isInitialError, isEmpty } = useLoadInitialDeveloperProducts({
    universeId,
    pageSize: perFetchPageSize,
    isArchived,
  });

  const { isPriceOptimizationActive, isLoading: isLoadingPriceOptimization } =
    useIsPriceOptimizationActive();

  const router = useRouter();

  // TODO(jeminpark): add skeleton loading if dev products are initial loading
  if (isLoadingPermissions || isInitialLoading || isLoadingPriceOptimization) {
    return <ProgressCircleLoader />;
  }

  if (isInitialError) {
    return (
      <FailureView
        message={translate('Message.LoadItemsError', {
          itemType: translate('Label.DeveloperProducts'),
        })}
        onReload={router.reload}
      />
    );
  }

  if (permissions?.monetizeExperience === false) {
    return <AccessDeniedPage />;
  }

  if (isEmpty) {
    if (isArchived) {
      return (
        <div className='flex flex-col items-center justify-center padding-xxlarge'>
          <p className='text-body-medium content-muted'>
            {/* TODO(DMP-2775): replace with shared empty-state once unarchive action lands */}
            {translate('Message.NoArchivedProducts')}
          </p>
        </div>
      );
    }
    return <DeveloperProductsTableEmptyState universeId={universeId} />;
  }

  return (
    <DeveloperProductsTable
      universeId={universeId}
      showPriceOptimization={isPriceOptimizationActive}
      managedPricingOnboardingStatus={managedPricingOnboardingStatus}
      giftingTradingStatus={giftingTradingStatus}
      perFetchPageSize={perFetchPageSize}
      showArchived={isArchived}
      initialRowsPerPage={
        isManagedPricingAvailable(managedPricingOnboardingStatus)
          ? INITIAL_ROWS_PER_PAGE_WITH_MANAGED_PRICING
          : undefined
      }
    />
  );
}

export default withTranslation(DeveloperProductsTableContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Navigation,
  TranslationNamespace.Table,
  TranslationNamespace.DeveloperProducts,
  TranslationNamespace.ManagedPricing,
]);
