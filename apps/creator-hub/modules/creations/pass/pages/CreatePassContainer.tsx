/* istanbul ignore file */
import { StatusCodes } from '@rbx/core';
import { withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import ErrorPage from '@modules/miscellaneous/error/components/ErrorPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { useGetPassMetadata } from '@modules/passes/queries/useGetPassMetadata';
import CreatePassForm from '../components/CreatePassForm/CreatePassForm';

type Props = {
  universeId: number;
};

const CreatePassContainer = ({ universeId }: Props) => {
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const { data: passMetadata } = useGetPassMetadata();

  if (isLoadingPermissions) {
    return (
      <Grid container justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (permissions?.monetizeExperience === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    <CreatePassForm
      universeId={universeId}
      defaultIconId={passMetadata?.gamePassDefaultIconAssetId}
    />
  );
};

export default withTranslation(CreatePassContainer, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Passes,
  TranslationNamespace.Error,
  TranslationNamespace.PriceOptimization, // Can prob remove this since we now wrap the relevant component imports
]);
