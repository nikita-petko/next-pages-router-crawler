import { useRouter } from 'next/router';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { ManagedPricingOnboardingStatus } from '@modules/managed-pricing/types';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniversePermissions } from '@modules/react-query/organizations';
import DeveloperProductsTable from '../components/DeveloperProductsTable';
import DeveloperProductsTableEmptyState from '../components/DeveloperProductsTableEmptyState';
import DeveloperProductsTableLoading from '../components/DeveloperProductsTableLoading';
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

  const router = useRouter();

  // Both are withheld until permissions resolve: the list query can fail fast for a universe
  // the creator cannot monetize, which would otherwise strand them on the failure view.
  if (!isLoadingPermissions) {
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
  }

  if (isLoadingPermissions || isInitialLoading) {
    return <DeveloperProductsTableLoading />;
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
      managedPricingOnboardingStatus={managedPricingOnboardingStatus}
      giftingTradingStatus={giftingTradingStatus}
      perFetchPageSize={perFetchPageSize}
      showArchived={isArchived}
      initialRowsPerPage={INITIAL_ROWS_PER_PAGE_WITH_MANAGED_PRICING}
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
