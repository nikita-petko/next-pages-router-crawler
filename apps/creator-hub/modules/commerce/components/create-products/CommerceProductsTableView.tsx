import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import { Alert, Button, Chip, Grid } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  CommerceItemModel,
  CommerceProductModel,
  CommerceEligibilityStatus,
  BundlingEligibilityRecourse,
} from '@modules/clients/commerce';
import { ProductStatusType } from '@rbx/clients/commerceApi/v1';
import useCommerceNavigation, { CommerceTab } from '../../hooks/useCommerceNavigation';
import CommerceProductsTable from '../CommerceProductsTable';
import DraftCommerceProductsTable from './DraftCommerceProductsTable';
import RecourseAlerts from './RecourseAlerts';

interface CommerceProductsTableViewProps {
  eligibilityStatus?: CommerceEligibilityStatus;
  commerceItems: CommerceItemModel[];
  commerceProducts: CommerceProductModel[];
  onToggleSale: (commerceItemId: string, newStatus: ProductStatusType) => void;
  onClickArchive: (commerceProductId: string) => void;
  onClickBulkArchive: (commerceProductIds: string[]) => void;
  onAcceptBundlingFee: (
    selectedProducts: CommerceProductModel[],
    callbackFn: () => void,
    pollBeforeCallbackFn: boolean,
  ) => void;
  createCommerceProductError: string | null;
  setCommerceCreateProductError: React.Dispatch<React.SetStateAction<string | null>>;
  setCatalogSelectedCommerceItemIds: React.Dispatch<React.SetStateAction<string[]>>;
  areVirtualBenefitsEnabled: boolean;
  isProductSaleEnabled: boolean;
  hasBusinessInfoPermissions: boolean;
  onClickInvoicingInfo: () => void;
}

const CommerceProductsTableView: FunctionComponent<CommerceProductsTableViewProps> = ({
  eligibilityStatus,
  commerceItems,
  commerceProducts,
  onToggleSale,
  onClickArchive,
  onClickBulkArchive,
  onAcceptBundlingFee,
  createCommerceProductError,
  setCommerceCreateProductError,
  setCatalogSelectedCommerceItemIds,
  areVirtualBenefitsEnabled,
  isProductSaleEnabled,
  hasBusinessInfoPermissions,
  onClickInvoicingInfo,
}) => {
  const { translate } = useTranslation();
  const { navigateToCommerce, navigateToCommerceCreateProducts } = useCommerceNavigation();
  const draftCommerceProducts = useMemo(
    () => commerceProducts.filter((product) => product.status === ProductStatusType.NUMBER_1),
    [commerceProducts],
  );

  const nonDraftCommerceProducts = useMemo(
    () => commerceProducts.filter((product) => product.status !== ProductStatusType.NUMBER_1),
    [commerceProducts],
  );

  // Check if any created product is a bundle
  const experienceHasBundle = useMemo(() => {
    return nonDraftCommerceProducts.some((product) => product.commerceGrantables.length > 0);
  }, [nonDraftCommerceProducts]);

  // state variable to show drafts table or the primary table
  const [showDrafts, setShowDrafts] = useState<boolean>(false);

  const clickSubmitted = useCallback(() => {
    setShowDrafts(false);
  }, [setShowDrafts]);

  const clickDrafts = useCallback(() => {
    setShowDrafts(true);
  }, [setShowDrafts]);

  return (
    <Grid container gap={2} justifyContent='flex-start' alignItems='stretch' height='fit-content'>
      <Grid container direction='row' justifyContent='space-between' alignItems='center' gap={1}>
        {/* Container for the Chips (to keep them grouped on the left) */}
        <Grid item>
          <Grid container direction='row' alignItems='center' gap={1}>
            <Chip
              label={translate('Label.CompletedProducts')}
              clickable
              color={!showDrafts ? 'primary' : 'secondary'}
              onClick={clickSubmitted}
            />
            {areVirtualBenefitsEnabled && (
              <Chip
                label={translate('Action.DraftProducts')}
                clickable
                color={showDrafts ? 'primary' : 'secondary'}
                onClick={clickDrafts}
              />
            )}
          </Grid>
        </Grid>

        {/* Create Products Button (aligned to the right) */}
        <Grid item>
          <Button
            variant='contained'
            color='primaryBrand'
            size='large'
            onClick={useCallback(() => {
              if (commerceItems.length === 0) {
                navigateToCommerce(CommerceTab.CommerceItems);
              } else {
                setCatalogSelectedCommerceItemIds([]);
                navigateToCommerceCreateProducts();
              }
            }, [
              navigateToCommerce,
              navigateToCommerceCreateProducts,
              commerceItems.length,
              setCatalogSelectedCommerceItemIds,
            ])}>
            {translate('Action.CreateProducts')}
          </Button>
        </Grid>
      </Grid>

      {experienceHasBundle && (
        <RecourseAlerts
          hasBusinessInfoPermissions={hasBusinessInfoPermissions}
          recourses={
            eligibilityStatus?.bundlingEligibility.recourses?.filter(
              (recourse) => recourse === BundlingEligibilityRecourse.InvoicingInfo,
            ) ?? []
          }
          onClickInvoicingInfo={onClickInvoicingInfo}
        />
      )}

      {createCommerceProductError && (
        <Grid minWidth='100%'>
          <Alert
            severity='error'
            onClose={() => {
              setCommerceCreateProductError(null);
            }}>
            {createCommerceProductError}
          </Alert>
        </Grid>
      )}
      <Grid container direction='row' justifyContent='space-between' alignItems='center'>
        {showDrafts ? (
          <DraftCommerceProductsTable
            configureCommerceProducts={draftCommerceProducts}
            onClickCancel={() => setShowDrafts(false)}
            primaryButtonColor='secondary' // Use secondary for the draft submit button because Create Products is primaryBrand color
            areVirtualBenefitsEnabled={areVirtualBenefitsEnabled}
          />
        ) : (
          <CommerceProductsTable
            nonDraftCommerceProducts={nonDraftCommerceProducts}
            onToggleSale={onToggleSale}
            onClickArchive={onClickArchive}
            onClickBulkArchive={onClickBulkArchive}
            onAcceptBundlingFee={onAcceptBundlingFee}
            areVirtualBenefitsEnabled={areVirtualBenefitsEnabled}
            isProductSaleEnabled={isProductSaleEnabled}
            eligibilityStatus={eligibilityStatus}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default CommerceProductsTableView;
