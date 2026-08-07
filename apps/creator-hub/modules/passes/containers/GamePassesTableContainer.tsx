import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import type { ManagedPricingOnboardingStatus } from '@modules/managed-pricing/types';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniversePermissions } from '@modules/react-query/organizations';
import PassesTable from '../components/PassesTable';
import PassesTableEmptyState from '../components/PassesTableEmptyState';
import PassesTableLoading from '../components/PassesTableLoading';
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

  if (isLoadingPermissions || isLoadingPasses) {
    return <PassesTableLoading />;
  }

  if (passes.length === 0) {
    return <PassesTableEmptyState universeId={universeId} />;
  }

  return (
    <PassesTable
      universeId={universeId}
      passes={passes}
      managedPricingOnboardingStatus={managedPricingOnboardingStatus}
      initialRowsPerPage={INITIAL_ROWS_PER_PAGE_WITH_MANAGED_PRICING}
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
