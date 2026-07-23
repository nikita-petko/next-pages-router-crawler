import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Typography } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRouter } from 'next/router';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import useIsPriceOptimizationActive from '@modules/price-optimization/queries/useIsPriceOptimizationActive';
import { useUniversePermissions } from '@modules/react-query/organizations';
import PassesTable from '../components/PassesTable';
import { useGetAllPassesForUniverse } from '../queries/useGetAllPassesForUniverse';
import { transformGamePassesForTable } from '../utils/passesUtils';
import PassesTableEmptyState from '../components/PassesTableEmptyState';

type Props = {
  universeId: number;
};

function GamePassesTableContainer({ universeId }: Props) {
  const { translate } = useTranslation();
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  const router = useRouter();

  const {
    data: passes = [],
    isError: isGetAllPassesError,
    isLoading: isLoadingPasses,
  } = useGetAllPassesForUniverse(universeId, {
    select: transformGamePassesForTable,
  });

  const { isPriceOptimizationActive, isLoading: isLoadingPriceOptimization } =
    useIsPriceOptimizationActive();

  if (isLoadingPermissions || isLoadingPasses || isLoadingPriceOptimization) {
    return (
      <EmptyGrid>
        <Typography color='secondary' align='center'>
          <CircularProgress />
        </Typography>
      </EmptyGrid>
    );
  }

  if (permissions?.monetizeExperience === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
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
    />
  );
}

export default withTranslation(GamePassesTableContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Navigation,
  TranslationNamespace.Table,
  TranslationNamespace.Passes,
]);
