/* istanbul ignore file */
import { withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import AccessDeniedPage from '@modules/miscellaneous/error/components/AccessDeniedPage';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useGetPassMetadata } from '@modules/passes/queries/useGetPassMetadata';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { usePersonalizedShop } from '@modules/shops/hooks/usePersonalizedShop';
import { useAvailableCategories } from '@modules/shops/item-catalog/hooks/useAvailableCategories';
import CreatePassForm from '../components/CreatePassForm/CreatePassForm';

type Props = {
  universeId: number;
};

const CreatePassContainer = ({ universeId }: Props) => {
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const { data: passMetadata, isLoading: isLoadingPassMetadata } = useGetPassMetadata();

  const { data: shop, isLoading: isLoadingShop } = usePersonalizedShop(universeId);
  const shopId = shop?.shopId;
  const { categories: availableCategories, isLoading: isLoadingCategories } =
    useAvailableCategories({ shopId });

  const isLoading =
    isLoadingPermissions || isLoadingPassMetadata || isLoadingShop || isLoadingCategories;
  if (isLoading) {
    return (
      <Grid container justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (permissions?.monetizeExperience === false) {
    return <AccessDeniedPage />;
  }

  return (
    <CreatePassForm
      universeId={universeId}
      defaultIconId={passMetadata?.gamePassDefaultIconAssetId}
      shopId={shopId}
      availableCategories={availableCategories}
    />
  );
};

export default withTranslation(CreatePassContainer, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Passes,
  TranslationNamespace.Error,
  TranslationNamespace.PriceOptimization, // Can prob remove this since we now wrap the relevant component imports
  TranslationNamespace.PersonalizedShop,
]);
