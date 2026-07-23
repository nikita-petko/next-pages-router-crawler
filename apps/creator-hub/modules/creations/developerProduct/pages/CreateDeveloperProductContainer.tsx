/* istanbul ignore file */
import { StatusCodes } from '@rbx/core';
import { CircularProgress, Grid } from '@rbx/ui';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useUniversePermissions } from '@modules/react-query/organizations';
import CreateDeveloperProductFormV2 from '../components/CreateDeveloperProductFormV2/CreateDeveloperProductFormV2';

type Props = {
  universeId: number;
};

function CreateDeveloperProductContainer({ universeId }: Props) {
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);

  // Just let it waterfall render for now
  if (isLoadingPermissions) {
    return (
      <Grid container minHeight={450} justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (permissions?.monetizeExperience === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return <CreateDeveloperProductFormV2 universeId={universeId} />;
}

export default withTranslation(CreateDeveloperProductContainer, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.DeveloperProducts,
  TranslationNamespace.Error,
  TranslationNamespace.PriceOptimization,
  TranslationNamespace.RegionalPricing,
]);
