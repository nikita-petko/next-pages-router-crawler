import React, { Fragment, FunctionComponent, useEffect, useMemo, useState } from 'react';

import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, CircularProgress, Grid, OpenInNewIcon } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

import { commerceCatalogItemIconPath } from '../../configs/assets';
import { Merchant, merchantConfigs } from '../../configs/merchantConfigs';
import useUniverseId from '../../hooks/useUniverseId';
import useCommerce from '../../hooks/useCommerce';
import useModal from '../../hooks/useModal';
import useBottomSnackbar from '../../hooks/useBottomSnackbar';
import CommerceEmptyView from '../../components/CommerceEmptyView';
import CommerceErrorView from '../../components/CommerceErrorView';
import CommerceSelectMerchantModal from '../../components/select-merchant/CommerceSelectMerchantModal';
import CommerceImportCatalogAlert from '../../components/import-catalog/CommerceImportCatalogAlert';
import CommerceImportCatalogModal from '../../components/import-catalog/CommerceImportCatalogModal';
import CommerceItemsTableView from '../../components/import-catalog/CommerceItemsTableView';
import CommerceTabContainer from '../../components/CommerceTabContainer';
import CommerceArchiveItemsModal from '../../components/import-catalog/CommerceArchiveItemsModal';
import useCommerceNavigation from '../../hooks/useCommerceNavigation';
import isBaselineEligible from '../../utils/isBaselineEligible';

enum ModalType {
  None,
  SelectMerchant,
  ImportAmazonCatalog,
  ArchiveCommerceItem,
}

type ModalState =
  | { type: ModalType.None }
  | { type: ModalType.SelectMerchant }
  | { type: ModalType.ImportAmazonCatalog }
  | { type: ModalType.ArchiveCommerceItem; commerceItemIds: string[] };

const CommerceItemsTabContent: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { openModal, closeModal, getModalProps } = useModal();
  const { enqueueSnackbar } = useBottomSnackbar();
  const universeId = useUniverseId();
  const {
    commerceItems,
    commerceItemsError,
    isLoadingCommerceItems,
    isShopifyEnabled,
    isAmazonEnabled,
    createCommerceItem,
    archiveCommerceItem,
    refreshCommerceProducts,
    catalogSelectedCommerceItemIds,
    setCatalogSelectedCommerceItemIds,
    eligibilityStatus,
  } = useCommerce();
  const { navigateToCommerceCreateProducts } = useCommerceNavigation();

  const [modalState, setModalState] = useState<ModalState>({ type: ModalType.None });
  const [isCreateCommerceItemsLoading, setIsCreateCommerceItemsLoading] = useState(false);
  const [isArchiveCommerceItemsLoading, setIsArchiveCommerceItemsLoading] = useState(false);
  const [failedAmazonCreateCommerceItemIds, setFailedAmazonCreateCommerceItemIds] = useState<
    string[]
  >([]);

  // Handle modal state changes (close and open dialogs)
  useEffect(() => {
    const resetModalState = () => setModalState({ type: ModalType.None });
    const hasItemsAtStart = commerceItems.length > 0;

    switch (modalState.type) {
      case ModalType.None:
        closeModal();
        break;
      case ModalType.SelectMerchant:
        openModal(
          <CommerceSelectMerchantModal
            onCancel={resetModalState}
            onConfirm={(merchant) => {
              if (merchant === Merchant.Amazon) {
                setModalState({ type: ModalType.ImportAmazonCatalog });
              } else if (merchant === Merchant.Shopify) {
                // navigate to new tab for shopify link
                // should we open the tab and close the modal?
                // TODO(SUBS-3125): handle Shopify
                resetModalState();
              }
            }}
            isShopifyEnabled={
              isShopifyEnabled || isBaselineEligible(eligibilityStatus?.baselineEligibility)
            }
            isAmazonEnabled={isAmazonEnabled}
          />,
          getModalProps({
            maxWidth: 'Large',
            onBackdropClick: resetModalState,
            useHigherContrast: true,
          }),
        );
        break;
      case ModalType.ImportAmazonCatalog:
        openModal(
          <CommerceImportCatalogModal
            onCancel={resetModalState}
            isLoading={isCreateCommerceItemsLoading}
            onComplete={async (merchantItemIds) => {
              setIsCreateCommerceItemsLoading(true);

              // Partition results based on whether ASINs are valid
              const [validMerchantItemIds, invalidMerchantItemIds] = merchantItemIds.reduce<
                [string[], string[]]
              >(
                ([valid, invalid], merchantItemId) => {
                  ((merchantConfigs[Merchant.Amazon].validateMerchantItemId?.(merchantItemId) ??
                  true)
                    ? valid
                    : invalid
                  ).push(merchantItemId);
                  return [valid, invalid];
                },
                [[], []],
              );

              const results = await Promise.allSettled(
                validMerchantItemIds.map((merchantItemId) =>
                  createCommerceItem(Merchant.Amazon, merchantItemId),
                ),
              );

              // Collect merchant item IDs that failed to create
              setFailedAmazonCreateCommerceItemIds([
                ...invalidMerchantItemIds,
                ...(results
                  .map((result, i) =>
                    result.status === 'rejected' ? validMerchantItemIds[i] : null,
                  )
                  .filter((merchantItemId) => merchantItemId !== null) as string[]),
              ]);

              const successCount = results.filter((result) => result.status === 'fulfilled').length;
              if (successCount > 0) {
                enqueueSnackbar(
                  successCount > 1
                    ? translate('Message.CreateCommerceItemsSuccess.Plural', {
                        n: successCount.toString(),
                      })
                    : translate('Message.CreateCommerceItemsSuccess.Singular'),
                  {
                    severity: 'success',
                  },
                );
              }
              if (!hasItemsAtStart && successCount === 0) {
                const failureCount = results.length - successCount;
                enqueueSnackbar(
                  failureCount > 1
                    ? translate('Message.CreateCommerceItemsFailure.Amazon.Plural', {
                        n: failureCount.toString(),
                      })
                    : translate('Message.CreateCommerceItemsFailure.Amazon.Singular'),
                  {
                    severity: 'error',
                  },
                );
              }
              setIsCreateCommerceItemsLoading(false);
              resetModalState();
            }}
            translationKeys={{
              modalTitle: 'Heading.ImportCatalog.Amazon',
              modalDescription: 'Description.ImportCatalog.Amazon',
              productIdsLabel: 'Label.ProductIdentifiers.Amazon',
              productIdsHelperText: 'Description.ProductIdentifiers.Amazon',
              productIdsErrorText: 'Description.ProductIdentifiersInvalid.Amazon',
            }}
            validateMerchantItemId={merchantConfigs[Merchant.Amazon].validateMerchantItemId}
          />,
          getModalProps({ maxWidth: 'Large', onBackdropClick: resetModalState }),
        );
        break;
      case ModalType.ArchiveCommerceItem:
        openModal(
          <CommerceArchiveItemsModal
            isLoading={isArchiveCommerceItemsLoading}
            onCancel={resetModalState}
            onConfirm={async () => {
              setIsArchiveCommerceItemsLoading(true);

              const results = await Promise.allSettled(
                modalState.commerceItemIds.map((commerceItemId) =>
                  archiveCommerceItem(commerceItemId),
                ),
              );

              const successCount = results.filter((result) => result.status === 'fulfilled').length;
              if (successCount === results.length) {
                enqueueSnackbar(
                  successCount > 1
                    ? translate('Message.ArchiveCommerceItemsSuccess.Plural', {
                        n: successCount.toString(),
                      })
                    : translate('Message.ArchiveCommerceItemsSuccess.Singular'),
                );
              } else {
                const failureCount = results.length - successCount;
                enqueueSnackbar(
                  failureCount > 1
                    ? translate('Message.ArchiveCommerceItemsFailure.Plural', {
                        n: failureCount.toString(),
                      })
                    : translate('Message.ArchiveCommerceItemsFailure.Singular'),
                  {
                    severity: 'error',
                  },
                );
              }
              setIsArchiveCommerceItemsLoading(false);
              resetModalState();
              await refreshCommerceProducts();
            }}
          />,
          getModalProps({ maxWidth: 'Medium', onBackdropClick: resetModalState }),
        );
        break;
      default:
        break;
    }
  }, [
    translate,
    closeModal,
    openModal,
    getModalProps,
    enqueueSnackbar,
    createCommerceItem,
    archiveCommerceItem,
    universeId,
    modalState,
    isShopifyEnabled,
    isAmazonEnabled,
    isCreateCommerceItemsLoading,
    isArchiveCommerceItemsLoading,
    commerceItems,
    refreshCommerceProducts,
    eligibilityStatus?.baselineEligibility,
  ]);

  const amazonCommerceItems = useMemo(
    () => commerceItems.filter((item) => item.merchantType === Merchant.Amazon),
    [commerceItems],
  );
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
        <Fragment>
          {!isCommerceItemsEmpty && failedAmazonCreateCommerceItemIds.length > 0 && (
            <CommerceImportCatalogAlert
              onClose={() => setFailedAmazonCreateCommerceItemIds([])}
              failedCreateCommerceItemIds={failedAmazonCreateCommerceItemIds}
              translationKeys={{
                singular: 'Message.CreateCommerceItemsFailure.Amazon.Singular',
                plural: 'Message.CreateCommerceItemsFailure.Amazon.Plural',
              }}
            />
          )}
          <CommerceEmptyView
            iconPath={commerceCatalogItemIconPath}
            message={translate('Heading.ImportCatalog')}
            description={translate('Description.ImportCatalog')}
            buttonText={translate('Action.StartImporting')}
            onButtonClick={() => {
              setModalState({ type: ModalType.SelectMerchant });
            }}
          />
        </Fragment>
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
          {amazonCommerceItems.length > 0 && (
            <CommerceItemsTableView
              showArchiveButtons
              showCheckboxes
              merchant={Merchant.Amazon}
              commerceItems={amazonCommerceItems}
              onClickArchive={async (commerceItemIds) => {
                setModalState({ type: ModalType.ArchiveCommerceItem, commerceItemIds });
              }}
              createButton={createButton}
              importButton={
                <Button
                  variant='contained'
                  color='primaryBrand'
                  onClick={() => {
                    setModalState({ type: ModalType.ImportAmazonCatalog });
                  }}
                  size='large'>
                  {translate('Action.ImportMore')}
                </Button>
              }
              alert={
                failedAmazonCreateCommerceItemIds.length > 0 && (
                  <CommerceImportCatalogAlert
                    onClose={() => setFailedAmazonCreateCommerceItemIds([])}
                    failedCreateCommerceItemIds={failedAmazonCreateCommerceItemIds}
                    translationKeys={{
                      singular: 'Message.CreateCommerceItemsFailure.Amazon.Singular',
                      plural: 'Message.CreateCommerceItemsFailure.Amazon.Plural',
                    }}
                  />
                )
              }
              catalogSelectedCommerceItemIds={catalogSelectedCommerceItemIds}
              setCatalogSelectedCommerceItemIds={setCatalogSelectedCommerceItemIds}
              updateCatalogSelectedCommerceItemIds
            />
          )}
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
            />
          )}
        </Grid>
      )}
    </CommerceTabContainer>
  );
};

export default withTranslation(CommerceItemsTabContent, [TranslationNamespace.Commerce]);
