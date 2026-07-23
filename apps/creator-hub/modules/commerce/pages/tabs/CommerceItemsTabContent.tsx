import { useEffect, useMemo, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, CircularProgress, Grid, OpenInNewIcon } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CommerceEmptyView from '../../components/CommerceEmptyView';
import CommerceErrorView from '../../components/CommerceErrorView';
import CommerceTabContainer from '../../components/CommerceTabContainer';
import CommerceItemsTableView from '../../components/import-catalog/CommerceItemsTableView';
import CommerceSelectMerchantModal from '../../components/select-merchant/CommerceSelectMerchantModal';
import { commerceCatalogItemIconPath } from '../../configs/assets';
import { Merchant, merchantConfigs } from '../../configs/merchantConfigs';
import useCommerce from '../../hooks/useCommerce';
import useCommerceNavigation from '../../hooks/useCommerceNavigation';
import useModal from '../../hooks/useModal';
import isBaselineEligible from '../../utils/isBaselineEligible';

enum ModalType {
  None,
  SelectMerchant,
}

type ModalState = { type: ModalType.None } | { type: ModalType.SelectMerchant };

const CommerceItemsTabContent = () => {
  const { translate } = useTranslation();
  const { openModal, closeModal, getModalProps } = useModal();
  const {
    commerceItems,
    commerceItemsError,
    isLoadingCommerceItems,
    isShopifyEnabled,
    catalogSelectedCommerceItemIds,
    setCatalogSelectedCommerceItemIds,
    eligibilityStatus,
  } = useCommerce();
  const { navigateToCommerceCreateProducts } = useCommerceNavigation();

  const [modalState, setModalState] = useState<ModalState>({ type: ModalType.None });

  // Handle modal state changes (close and open dialogs)
  useEffect(() => {
    const resetModalState = () => setModalState({ type: ModalType.None });

    switch (modalState.type) {
      case ModalType.None:
        closeModal();
        break;
      case ModalType.SelectMerchant:
        openModal(
          <CommerceSelectMerchantModal
            onCancel={resetModalState}
            onConfirm={(merchant) => {
              if (merchant === Merchant.Shopify) {
                // navigate to new tab for shopify link
                // should we open the tab and close the modal?
                // TODO(SUBS-3125): handle Shopify
                resetModalState();
              }
            }}
            isShopifyEnabled={
              isShopifyEnabled || isBaselineEligible(eligibilityStatus?.baselineEligibility)
            }
          />,
          getModalProps({
            maxWidth: 'Large',
            onBackdropClick: resetModalState,
            useHigherContrast: true,
          }),
        );
        break;
      default:
        break;
    }
  }, [
    closeModal,
    openModal,
    getModalProps,
    modalState,
    isShopifyEnabled,
    eligibilityStatus?.baselineEligibility,
  ]);

  const shopifyCommerceItems = useMemo(
    () => commerceItems.filter((item) => item.merchantType === Merchant.Shopify),
    [commerceItems],
  );

  const createButton = (
    <Button
      style={{ marginRight: 8 }}
      variant='contained'
      color='secondary'
      size='large'
      onClick={() => {
        navigateToCommerceCreateProducts();
      }}>
      {translate('Action.CreateProducts')}
    </Button>
  );

  const isCommerceItemsEmpty = commerceItems.length === 0;
  const showCircularProgress = isCommerceItemsEmpty && isLoadingCommerceItems;
  const showCommerceEmptyView = isCommerceItemsEmpty && !isLoadingCommerceItems;
  const showCommerceItemsTableView = !isCommerceItemsEmpty;

  if (commerceItemsError) {
    return <CommerceErrorView />;
  }

  return (
    <CommerceTabContainer>
      {showCircularProgress && <CircularProgress color='secondary' />}
      {showCommerceEmptyView && (
        <CommerceEmptyView
          iconPath={commerceCatalogItemIconPath}
          message={translate('Heading.ImportCatalog')}
          description={translate('Description.ImportCatalog')}
          buttonText={translate('Action.StartImporting')}
          onButtonClick={() => {
            setModalState({ type: ModalType.SelectMerchant });
          }}
        />
      )}
      {showCommerceItemsTableView && (
        <Grid
          item
          container
          alignItems='stretch'
          justifyContent='flex-start'
          flexGrow={1}
          marginTop={2}
          marginBottom={10}
          gap={14}>
          {shopifyCommerceItems.length > 0 && (
            <CommerceItemsTableView
              merchant={Merchant.Shopify}
              commerceItems={shopifyCommerceItems}
              createButton={createButton}
              importButton={
                <Button
                  variant='contained'
                  color='primaryBrand'
                  size='large'
                  endIcon={<OpenInNewIcon />}
                  component='a'
                  href={merchantConfigs[Merchant.Shopify].importCatalogHref}
                  target='_blank'>
                  {translate('Action.ManageCatalog')}
                </Button>
              }
              catalogSelectedCommerceItemIds={catalogSelectedCommerceItemIds}
              setCatalogSelectedCommerceItemIds={setCatalogSelectedCommerceItemIds}
            />
          )}
        </Grid>
      )}
    </CommerceTabContainer>
  );
};

export default withTranslation(CommerceItemsTabContent, [TranslationNamespace.Commerce]);
