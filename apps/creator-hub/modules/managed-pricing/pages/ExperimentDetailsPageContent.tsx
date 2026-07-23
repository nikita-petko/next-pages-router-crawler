/* istanbul ignore file */
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { PageLoading } from '@modules/miscellaneous/common';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { ErrorPage, PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useGetExperimentSummary } from '../queries/useGetExperimentSummary';
import ExperimentSummaryContainer from '../experiment-details/containers/ExperimentSummaryContainer';
import ProductDetailsTableContainer from '../experiment-details/containers/ProductDetailsTableContainer';

type Props = {
  universeId: number;
  experimentId: string;
};

function ExperimentDetailsPageContent({ universeId, experimentId }: Props) {
  const router = useRouter();
  const { translate } = useTranslation();

  const {
    data: permissions,
    isLoading: isLoadingPermissions,
    isError: isErrorPermissions,
  } = useUniversePermissions(universeId);
  const {
    data: experiment,
    isLoading: isLoadingExperiment,
    isError: isErrorExperiment,
  } = useGetExperimentSummary({ universeId, experimentId });

  const isLoading = isLoadingExperiment || isLoadingPermissions;
  if (isLoading) {
    return <PageLoading />;
  }

  const isError = isErrorExperiment || isErrorPermissions;
  if (isError) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={router.reload}
      />
    );
  }

  const hasPermission = permissions?.monetizeExperience || permissions?.viewAnalytics;
  if (hasPermission === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!experiment) {
    return <PageNotFound />;
  }

  return (
    <div className='flex flex-col gap-xxlarge [container-type:inline-size]'>
      <ExperimentSummaryContainer {...experiment} universeId={universeId} />

      <section className='flex flex-col'>
        <h2 className='text-heading-medium margin-top-none margin-bottom-[8px]'>
          {translate('Heading.ProductList')}
        </h2>
        <span className='text-body-medium margin-top-none margin-bottom-[16px]'>
          {translate('Description.PriceTestProductDetails')}
        </span>

        <ProductDetailsTableContainer universeId={universeId} status={experiment.status} />
      </section>
    </div>
  );
}

export default withTranslation(ExperimentDetailsPageContent, [
  TranslationNamespace.Error,
  TranslationNamespace.Table,
  TranslationNamespace.Creations,
  TranslationNamespace.ManagedPricing,
]);
