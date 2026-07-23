import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Typography } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import useIsPriceOptimizationActive from '@modules/price-optimization/queries/useIsPriceOptimizationActive';
import { useRouter } from 'next/router';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { useLoadInitialDeveloperProducts } from '../hooks/useLoadInitialDeveloperProducts';
import DeveloperProductsTable from '../components/DeveloperProductsTable';
import DeveloperProductsTableEmptyState from '../components/DeveloperProductsTableEmptyState';
import { DEFAULT_PAGE_LIMIT } from '../queries/constants';

type Props = {
  universeId: number;
  perPageFetchLimit?: number;
};

function DeveloperProductsTableContainer({
  universeId,
  perPageFetchLimit = DEFAULT_PAGE_LIMIT,
}: Props) {
  const { translate } = useTranslation();
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const { isInitialLoading, isInitialError, isEmpty } = useLoadInitialDeveloperProducts({
    universeId,
    limit: perPageFetchLimit,
  });

  const { isPriceOptimizationActive, isLoading: isLoadingPriceOptimization } =
    useIsPriceOptimizationActive();

  const router = useRouter();

  // TODO(jeminpark): add skeleton loading if dev products are initial loading
  if (isLoadingPermissions || isInitialLoading || isLoadingPriceOptimization) {
    return (
      <EmptyGrid>
        <Typography color='secondary' align='center'>
          <CircularProgress />
        </Typography>
      </EmptyGrid>
    );
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
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (isEmpty) {
    return <DeveloperProductsTableEmptyState universeId={universeId} />;
  }

  return (
    <DeveloperProductsTable
      universeId={universeId}
      showPriceOptimization={isPriceOptimizationActive}
      perPageFetchLimit={perPageFetchLimit}
    />
  );
}

export default withTranslation(DeveloperProductsTableContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Navigation,
  TranslationNamespace.Table,
  TranslationNamespace.DeveloperProducts,
]);
