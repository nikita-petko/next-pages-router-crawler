import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { ManagedPricingOnboardingStatus } from '@modules/managed-pricing/types';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ARCHIVE_VIEWS, useView } from '@modules/monetization-shared/views/useView';
import { useUniversePermissions } from '@modules/react-query/organizations';
import GamePassesViewLayout from '../components/GamePassesViewLayout';
import PassesTable from '../components/PassesTable';
import PassesTableEmptyState from '../components/PassesTableEmptyState';
import PassesTableLoading from '../components/PassesTableLoading';
import { useListAllPassesForUniverse } from '../queries/useListAllPassesForUniverse';
import { transformGamePassesForTable } from '../utils/passesUtils';

type Props = {
  universeId: number;
  managedPricingOnboardingStatus?: ManagedPricingOnboardingStatus;
  /**
   * When true, renders Current/Archived chips and filters between active and archived
   * passes. When false/undefined, the archive flag is off.
   */
  isArchiveEnabled?: boolean;
};

const INITIAL_ROWS_PER_PAGE_WITH_MANAGED_PRICING = 10;

function GamePassesTableContainer({
  universeId,
  managedPricingOnboardingStatus,
  isArchiveEnabled,
}: Props) {
  const { translate } = useTranslation();
  const { view } = useView(ARCHIVE_VIEWS);

  // Stays undefined rather than false when the flag is off: PassesTableRow keys the
  // archive menu item off that distinction.
  const isArchived = isArchiveEnabled ? view === 'archived' : undefined;

  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  const router = useRouter();

  const {
    data: passes = [],
    isError: isGetAllPassesError,
    isLoading: isLoadingPasses,
  } = useListAllPassesForUniverse(universeId, {
    select: transformGamePassesForTable,
    isArchived,
  });

  // Both are withheld until permissions resolve: the list query can fail fast for a universe
  // the creator cannot monetize, and the access-denied message is the more useful of the two.
  if (!isLoadingPermissions) {
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
  }

  const isLoading = isLoadingPermissions || isLoadingPasses;

  if (isLoading) {
    return (
      <GamePassesViewLayout universeId={universeId} isArchiveEnabled={isArchiveEnabled}>
        <PassesTableLoading isArchiveEnabled={isArchiveEnabled} />
      </GamePassesViewLayout>
    );
  }

  if (passes.length === 0) {
    return (
      <GamePassesViewLayout universeId={universeId} isArchiveEnabled={isArchiveEnabled}>
        <PassesTableEmptyState
          universeId={universeId}
          isArchiveEnabled={isArchiveEnabled}
          showArchived={isArchived}
        />
      </GamePassesViewLayout>
    );
  }

  return (
    <GamePassesViewLayout universeId={universeId} isArchiveEnabled={isArchiveEnabled}>
      <PassesTable
        // Remount on view change so table state (search, sort, pagination, selection)
        // does not carry over between the current and archived lists.
        key={view}
        universeId={universeId}
        passes={passes}
        managedPricingOnboardingStatus={managedPricingOnboardingStatus}
        isArchiveEnabled={isArchiveEnabled}
        showArchived={isArchived}
        initialRowsPerPage={INITIAL_ROWS_PER_PAGE_WITH_MANAGED_PRICING}
      />
    </GamePassesViewLayout>
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
