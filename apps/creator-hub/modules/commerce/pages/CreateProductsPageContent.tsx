import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import type { CommerceProductModel } from '@rbx/client-commerce-api/v1';
import { ProductStatusType } from '@rbx/client-commerce-api/v1';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Typography } from '@rbx/ui';
import { BundlingEligibilityRecourse } from '@modules/clients/commerce';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage, PageNotFound } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import CommerceEmptyView from '../components/CommerceEmptyView';
import CommerceItemsTable from '../components/CommerceItemsTable';
import CommerceTabContainer from '../components/CommerceTabContainer';
import CreateProductsStepper from '../components/create-products/CreateProductsStepper';
import CreateProductsStickyFooter from '../components/create-products/CreateProductsStickyFooter';
import RecourseAlerts from '../components/create-products/RecourseAlerts';
import PreOrderAlert from '../components/PreOrderAlert';
import { commerceCatalogItemIconPath } from '../configs/assets';
import useBottomSnackbar from '../hooks/useBottomSnackbar';
import useCommerce from '../hooks/useCommerce';
import useCommerceNavigation, { CommerceTab } from '../hooks/useCommerceNavigation';
import useCreateProductsStyles from '../utils/CreateProducts.styles';
import isBaselineEligible from '../utils/isBaselineEligible';

const CreateProductsPageContent = () => {
  const { classes } = useCreateProductsStyles();
  const { translate } = useTranslation();
  const {
    commerceItems,
    catalogSelectedCommerceItemIds,
    commerceProducts,
    eligibilityStatus,
    isLoadingCommerceItems,
    isLoadingCommerceProducts,
    createCommerceProduct,
    setCommerceCreateProductError,
    isLoadingPermissions,
    areVirtualBenefitsEnabled,
    applyForCreatorBundlingEligibility,
    fetchCommerceEligibilityQuery,
  } = useCommerce();
  const { navigateToCommerce, navigateToCommerceDraftProducts } = useCommerceNavigation();
  const { enqueueSnackbar } = useBottomSnackbar();
  const { canConfigure, isLoadingGame } = useCurrentGame();

  const [isLoadingConfigureCommerceProducts, setIsLoadingConfigureCommerceProducts] =
    useState(true);

  const [configureCommerceProducts, setConfigureCommerceProducts] = useState<
    CommerceProductModel[]
  >([]);
  const [selectedCommerceItemIds, setSelectedCommerceItemIds] = useState<string[]>([]);
  const [deselectedCommerceItemIds, setDeselectedCommerceItemIds] = useState<string[]>([]);
  const [isCreateCommerceProductsLoading, setIsCreateCommerceProductsLoading] = useState(false);

  const handleSelectedChange = useCallback((selectedIds: string[]) => {
    setSelectedCommerceItemIds(selectedIds);
  }, []);

  useEffect(() => {
    // If catalog selected item ids, skip select items step
    // Populate configure products with catalog selected items the first time
    if (catalogSelectedCommerceItemIds.length > 0 && configureCommerceProducts.length === 0) {
      const selectedItems = commerceItems.filter((item) =>
        catalogSelectedCommerceItemIds.includes(item.id),
      );
      const newConfigureCommerceProducts = selectedItems.map((item) => ({
        id: item.id.toString(),
        status: ProductStatusType.NUMBER_1,
        commerceItem: item,
        commerceGrantables: [], // no virtual benefits
      }));
      setConfigureCommerceProducts(newConfigureCommerceProducts);
    }
    setIsLoadingConfigureCommerceProducts(false);
  }, [
    selectedCommerceItemIds,
    catalogSelectedCommerceItemIds,
    commerceItems,
    configureCommerceProducts.length,
    configureCommerceProducts,
  ]);

  const selectedCommerceItems = useMemo(() => {
    return commerceItems.filter((item) => selectedCommerceItemIds.includes(item.id));
  }, [selectedCommerceItemIds, commerceItems]);

  // Activation recourses to display in the create products page
  const activationRecourses: BundlingEligibilityRecourse[] = [
    BundlingEligibilityRecourse.BrandActivation,
    BundlingEligibilityRecourse.CreatorActivation,
  ];

  const onClickCreatorActivation = useCallback(() => {
    applyForCreatorBundlingEligibility()
      .then(async () => {
        const { error } = await fetchCommerceEligibilityQuery.refetch();
        if (error) {
          throw error;
        } else {
          enqueueSnackbar(
            translate('Message.Eligibility.BundlingRecourse.CreatorActivation.Success'),
          );
        }
      })
      .catch(() => {
        enqueueSnackbar(translate('Message.GenericError'), {
          severity: 'error',
        });
      });
  }, [
    applyForCreatorBundlingEligibility,
    fetchCommerceEligibilityQuery,
    translate,
    enqueueSnackbar,
  ]);

  const onClickCancel = useCallback(() => {
    navigateToCommerce(CommerceTab.CommerceProducts);
  }, [navigateToCommerce]);

  const onClickCreate = useCallback(async () => {
    setCommerceCreateProductError(null);
    setIsCreateCommerceProductsLoading(true);

    // for each selected item, create a product using the item id
    const results = await Promise.allSettled(
      selectedCommerceItems.map((item) => {
        // If virtual benefits are allowed, initial status should be draft. Otherwise, it can be InReview.
        let initialStatus: ProductStatusType = ProductStatusType.NUMBER_1;
        if (!areVirtualBenefitsEnabled) {
          initialStatus = ProductStatusType.NUMBER_3;
        }

        return createCommerceProduct(item.id, [], initialStatus);
      }),
    );

    const successCount = results.filter((result) => result.status === 'fulfilled').length;

    const failureCount = results.length - successCount;
    // Display generic failure message
    let commerceCreateProductErrorMsg = '';
    if (failureCount > 0) {
      commerceCreateProductErrorMsg =
        failureCount > 1
          ? translate('Message.CreateCommerceProductsFailure.Plural', {
              n: failureCount.toString(),
            })
          : translate('Message.CreateCommerceProductsFailure.Singular');
    }
    setIsCreateCommerceProductsLoading(false);
    if (successCount === 0) {
      enqueueSnackbar(commerceCreateProductErrorMsg, {
        severity: 'error',
      });
    } else {
      setCommerceCreateProductError(commerceCreateProductErrorMsg);
    }

    if (areVirtualBenefitsEnabled) {
      navigateToCommerceDraftProducts();
    } else {
      navigateToCommerce(CommerceTab.CommerceProducts);
    }
  }, [
    areVirtualBenefitsEnabled,
    setCommerceCreateProductError,
    navigateToCommerce,
    navigateToCommerceDraftProducts,
    selectedCommerceItems,
    createCommerceProduct,
    enqueueSnackbar,
    translate,
  ]);

  const isCommerceProductsEmpty = commerceProducts.length === 0;
  const showCircularProgress =
    isLoadingCommerceItems || isLoadingCommerceProducts || isLoadingConfigureCommerceProducts;
  const showCreateProductsView = !showCircularProgress;
  const showSelectEmptyView = commerceItems.length === 0;

  if (isLoadingPermissions || isLoadingGame) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  if (!canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  // User must complete baseline eligibility to see create page
  const isEligible = isBaselineEligible(eligibilityStatus?.baselineEligibility);

  if (!isEligible) {
    return <PageNotFound />;
  }

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
          marginTop={4}
          marginBottom={10}
          gap={14}>
          <Grid className={classes.root} container direction='column' gap={4}>
            {areVirtualBenefitsEnabled && (
              <Grid item>
                <CreateProductsStepper activeStep={1} />
              </Grid>
            )}
            <Grid item>
              <Grid paddingTop={2} marginBottom={2}>
                <Typography variant='h5'>{translate('Heading.SelectCatalogItems')}</Typography>
              </Grid>
              <PreOrderAlert />
              {showSelectEmptyView && (
                <Grid paddingTop={2}>
                  <CommerceEmptyView
                    iconPath={commerceCatalogItemIconPath}
                    message={translate('Heading.ImportCatalog')}
                    description={translate('Description.ImportCatalog.Create')}
                    buttonText={
                      isCommerceProductsEmpty
                        ? translate('Action.GoBack')
                        : translate('Action.ImportCatalog.Create')
                    }
                    onButtonClick={() => {
                      navigateToCommerce(
                        isCommerceProductsEmpty ? undefined : CommerceTab.CommerceItems,
                      );
                    }}
                  />
                </Grid>
              )}
              {!showSelectEmptyView && (
                <>
                  <Grid paddingTop={2} marginBottom={2}>
                    <RecourseAlerts
                      hasBusinessInfoPermissions
                      recourses={
                        eligibilityStatus?.bundlingEligibility.recourses?.filter((recourse) =>
                          activationRecourses.includes(recourse),
                        ) ?? []
                      }
                      onClickCreatorActivation={onClickCreatorActivation}
                    />
                  </Grid>
                  <CommerceItemsTable
                    showCheckboxes
                    commerceItems={commerceItems}
                    handleSelectedChange={handleSelectedChange}
                    deselectedCommerceItemIds={deselectedCommerceItemIds}
                    setDeselectedCommerceItemIds={setDeselectedCommerceItemIds}
                    catalogSelectedCommerceItemIds={catalogSelectedCommerceItemIds}
                    useCatalogSelectedCommerceItemIds
                  />
                </>
              )}
            </Grid>
            <Grid container direction='column'>
              <CreateProductsStickyFooter
                primaryButtonText={
                  areVirtualBenefitsEnabled ? translate('Action.Next') : translate('Action.Create')
                }
                onClickCreate={onClickCreate}
                onClickCancel={onClickCancel}
                primaryButtonDisabled={selectedCommerceItemIds.length === 0}
                isLoading={isCreateCommerceProductsLoading}
              />
            </Grid>
          </Grid>
        </Grid>
      )}
    </CommerceTabContainer>
  );
};

export default withTranslation(CreateProductsPageContent, [TranslationNamespace.Commerce]);
