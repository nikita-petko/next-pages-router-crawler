import { useMemo } from 'react';
import { ProductStatusType } from '@rbx/client-commerce-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CheckIcon, CircularProgress, Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CommerceTabContainer from '../components/CommerceTabContainer';
import CreateProductsStepper from '../components/create-products/CreateProductsStepper';
import DraftCommerceProductsTable from '../components/create-products/DraftCommerceProductsTable';
import useCommerce from '../hooks/useCommerce';
import useCommerceNavigation from '../hooks/useCommerceNavigation';
import useCreateProductsStyles from '../utils/CreateProducts.styles';

const DraftProductsPageContent = () => {
  const { classes } = useCreateProductsStyles();
  const { translate } = useTranslation();
  const { commerceProducts, isLoadingCommerceProducts, areVirtualBenefitsEnabled } = useCommerce();
  const { navigateToCommerceProductsTab, navigateToCommerceCreateProducts } =
    useCommerceNavigation();

  const draftCommerceProducts = useMemo(
    () => commerceProducts.filter((product) => product.status === ProductStatusType.NUMBER_1),
    [commerceProducts],
  );

  const showCircularProgress = isLoadingCommerceProducts;
  const showCreateProductsView = !showCircularProgress;

  return (
    <CommerceTabContainer>
      {showCircularProgress && <CircularProgress color='secondary' />}
      {showCreateProductsView && (
        <Grid
          item
          container
          alignItems='stretch'
          justifyContent='flex-start'
          flexGrow={1}
          marginBottom={10}
          gap={14}>
          <Grid className={classes.root} container direction='column' gap={4} marginTop={2}>
            {areVirtualBenefitsEnabled && (
              <Grid item>
                <CreateProductsStepper activeStep={2} />
              </Grid>
            )}
            <Grid item>
              <Grid
                direction='row'
                marginBottom={3}
                container
                justifyContent='space-between'
                alignItems='stretch'>
                <Typography variant='h5'>{translate('Heading.OptionalBenefit')}</Typography>

                <Grid item gap={0.5}>
                  <Grid container spacing={1}>
                    <Grid item>
                      <CheckIcon color='disabled' />
                    </Grid>
                    <Grid item>
                      <Typography variant='body1' color='disabled'>
                        {translate('Label.DraftsSaved')}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Grid container direction='row' justifyContent='space-between' alignItems='center'>
                <DraftCommerceProductsTable
                  configureCommerceProducts={draftCommerceProducts}
                  onClickBack={navigateToCommerceCreateProducts}
                  onClickCancel={navigateToCommerceProductsTab}
                  primaryButtonColor='primaryBrand' // Use primary color for the draft page because user is in the create flow
                  areVirtualBenefitsEnabled={areVirtualBenefitsEnabled}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
    </CommerceTabContainer>
  );
};

export default withTranslation(DraftProductsPageContent, [TranslationNamespace.Commerce]);
