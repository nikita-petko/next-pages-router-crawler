import { useRouter } from 'next/router';
import type { GiftingTradingStatus } from '@rbx/client-developer-products-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { ManagedPricingOnboardingStatus } from '@modules/managed-pricing/types';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ARCHIVE_VIEWS, useView } from '@modules/monetization-shared/views/useView';
import { useUniversePermissions } from '@modules/react-query/organizations';
import DeveloperProductsTable from '../components/DeveloperProductsTable';
import DeveloperProductsTableEmptyState from '../components/DeveloperProductsTableEmptyState';
import DeveloperProductsTableLoading from '../components/DeveloperProductsTableLoading';
import DeveloperProductsViewLayout from '../components/DeveloperProductsViewLayout';
import { useLoadInitialDeveloperProducts } from '../hooks/useLoadInitialDeveloperProducts';
import { DEFAULT_PAGE_SIZE } from '../queries/constants';

type Props = {
  universeId: number;
  managedPricingOnboardingStatus?: ManagedPricingOnboardingStatus;
  giftingTradingStatus?: GiftingTradingStatus;
  perFetchPageSize?: number;
  /**
   * When true, renders Current/Archived chips and filters between active and archived
   * products. When false/undefined, the archive flag is off.
   */
  isArchiveEnabled?: boolean;
};

const INITIAL_ROWS_PER_PAGE_WITH_MANAGED_PRICING = 10;

function DeveloperProductsTableContainer({
  universeId,
  managedPricingOnboardingStatus,
  giftingTradingStatus,
  perFetchPageSize = DEFAULT_PAGE_SIZE,
  isArchiveEnabled,
}: Props) {
  const { translate } = useTranslation();
  const { view } = useView(ARCHIVE_VIEWS);

  const isArchived = isArchiveEnabled ? view === 'archived' : undefined;

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

  const isLoading = isLoadingPermissions || isInitialLoading;

  if (isLoading) {
    return (
      <DeveloperProductsViewLayout universeId={universeId} isArchiveEnabled={isArchiveEnabled}>
        <DeveloperProductsTableLoading isArchiveEnabled={isArchiveEnabled} />
      </DeveloperProductsViewLayout>
    );
  }

  if (isEmpty) {
    return (
      <DeveloperProductsViewLayout universeId={universeId} isArchiveEnabled={isArchiveEnabled}>
        <DeveloperProductsTableEmptyState
          universeId={universeId}
          isArchiveEnabled={isArchiveEnabled}
          showArchived={isArchived}
        />
      </DeveloperProductsViewLayout>
    );
  }

  return (
    <DeveloperProductsViewLayout universeId={universeId} isArchiveEnabled={isArchiveEnabled}>
      <DeveloperProductsTable
        // Remount on view change so useInfiniteReducer refs in useDeveloperProducts
        // don't treat a cached multi-page query as an append of the previous view.
        key={view}
        universeId={universeId}
        managedPricingOnboardingStatus={managedPricingOnboardingStatus}
        giftingTradingStatus={giftingTradingStatus}
        perFetchPageSize={perFetchPageSize}
        isArchiveEnabled={isArchiveEnabled}
        showArchived={isArchived}
        initialRowsPerPage={INITIAL_ROWS_PER_PAGE_WITH_MANAGED_PRICING}
      />
    </DeveloperProductsViewLayout>
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
