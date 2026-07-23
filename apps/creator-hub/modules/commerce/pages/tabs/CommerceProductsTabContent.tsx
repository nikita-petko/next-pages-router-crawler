import { useEffect, useState, useCallback, useMemo } from 'react';
import { ProductStatusType } from '@rbx/client-commerce-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, CircularProgress } from '@rbx/ui';
import { CreatorContactType } from '@modules/clients/brandPlatform';
import { CommerceFailureReason } from '@modules/clients/commerce';
import type { CommerceProductModel } from '@modules/clients/commerce';
import { getResponseFromError } from '@modules/clients/utils';
import useCreatorContactInfoQuery from '@modules/creator-account/hooks/useCreatorContactInfoQuery';
import { useSubmitCreatorContact } from '@modules/creator-account/hooks/useSubmit';
import type { InputFormData } from '@modules/creator-account/types';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CommerceEmptyView from '../../components/CommerceEmptyView';
import CommerceErrorView from '../../components/CommerceErrorView';
import CommerceTabContainer from '../../components/CommerceTabContainer';
import CommerceProductsTableView from '../../components/create-products/CommerceProductsTableView';
import CommerceEligibilityInvoicingInfoModal from '../../components/eligibility/CommerceEligibilityInvoicingInfoModal';
import BulkArchiveCommerceProducts from '../../components/modals/BulkArchiveCommerceProducts';
import CommerceAcceptBundlingFeeModal from '../../components/modals/CommerceAcceptBundlingFeeModal';
import CommerceArchiveProductModal from '../../components/modals/CommerceArchiveProductModal';
import { commerceCreationIconPath } from '../../configs/assets';
import useBottomSnackbar from '../../hooks/useBottomSnackbar';
import useCommerce from '../../hooks/useCommerce';
import useCommerceNavigation, { CommerceTab } from '../../hooks/useCommerceNavigation';
import useCountries from '../../hooks/useCountries';
import useLatest from '../../hooks/useLatest';
import useModal from '../../hooks/useModal';
import parseCommerceErrorResponse from '../../utils/parseCommerceErrorResponse';

enum ModalType {
  None,
  ArchiveCommerceProduct,
  AcceptBundlingFee,
  InvoicingForm,
  BulkArchiveCommerceProductsModal,
}

type ModalState =
  | { type: ModalType.None }
  | { type: ModalType.ArchiveCommerceProduct; commerceProductId: string }
  | { type: ModalType.BulkArchiveCommerceProductsModal; commerceProductIds: string[] }
  | {
      type: ModalType.AcceptBundlingFee;
      selectedProducts: CommerceProductModel[];
      pollBeforeCallbackFn: boolean | null;
      callbackFn: () => void;
    }
  | { type: ModalType.InvoicingForm };

const CommerceProductsTabContent = () => {
  const { translate } = useTranslation();
  const {
    commerceItems,
    commerceProducts,
    isLoadingCommerceItems,
    isLoadingCommerceProducts,
    eligibilityStatus,
    areVirtualBenefitsEnabled,
    isProductSaleEnabled,
    archiveCommerceProduct,
    updateCommerceProductStatus,
    createCommerceProductError,
    refreshCommerceProducts,
    setCommerceCreateProductError,
    commerceItemsError,
    commerceProductsError,
    setCatalogSelectedCommerceItemIds,
    fetchCommerceEligibilityQuery,
    acceptCommerceProductBundlingFee,
    fetchCommerceProductsWithoutUpdate,
  } = useCommerce();
  const { navigateToCommerce, navigateToCommerceCreateProducts } = useCommerceNavigation();
  const { enqueueSnackbar } = useBottomSnackbar();
  const { openModal, closeModal, getModalProps } = useModal();
  const [modalState, setModalState] = useState<ModalState>({ type: ModalType.None });
  const [isArchiveCommerceProductLoading, setIsArchiveCommerceProductLoading] = useState(false);
  const [isAcceptBundlingFeeLoading, setIsAcceptBundlingFeeLoading] = useState(false);
  const [isSubmittingInvoicingInfo, setIsSubmittingInvoicingInfo] = useState(false);
  const { countries } = useCountries(); // TODO: loading state

  const submitCreatorContact = useSubmitCreatorContact(CreatorContactType.Invoicing);
  const onSubmitInvoicingInfo = useCallback(
    async (data: InputFormData) => {
      try {
        setIsSubmittingInvoicingInfo(true);

        await submitCreatorContact(data);

        const { error } = await fetchCommerceEligibilityQuery.refetch();
        if (error) {
          throw error;
        }

        setModalState({ type: ModalType.None });
        enqueueSnackbar(translate('Message.Eligibility.InvoicingInfoSubmitted'), {
          severity: 'success',
        });
      } catch {
        enqueueSnackbar(translate('Message.GenericError'), {
          severity: 'error',
        });
      } finally {
        setIsSubmittingInvoicingInfo(false);
      }
    },
    [enqueueSnackbar, fetchCommerceEligibilityQuery, submitCreatorContact, translate],
  );

  const [creatorLegalContactInfoQuery] = useCreatorContactInfoQuery(CreatorContactType.Legal);
  const legalInfo = useLatest(
    creatorLegalContactInfoQuery.data,
    () => creatorLegalContactInfoQuery.data !== undefined,
  );

  const hasBusinessInfoPermissions = useMemo(() => {
    // Check if legal info query returned 403
    const legalInfoForbidden = creatorLegalContactInfoQuery.isSuccess
      ? false
      : getResponseFromError(creatorLegalContactInfoQuery.error)?.status === 403;

    return !legalInfoForbidden;
  }, [creatorLegalContactInfoQuery.isSuccess, creatorLegalContactInfoQuery.error]);

  // On tab load, reset selected commerce item ids from items tab
  useEffect(() => {
    setCatalogSelectedCommerceItemIds([]);
  }, [isLoadingCommerceProducts, setCatalogSelectedCommerceItemIds]);

  const onClickArchive = useCallback(
    async (commerceProductId: string) => {
      setModalState({ type: ModalType.ArchiveCommerceProduct, commerceProductId });
    },
    [setModalState],
  );

  const onClickBulkArchive = useCallback(
    (commerceProductIds: string[]) => {
      setModalState({ type: ModalType.BulkArchiveCommerceProductsModal, commerceProductIds });
    },
    [setModalState],
  );

  const onAcceptBundlingFee = useCallback(
    (
      selectedProducts: CommerceProductModel[],
      callbackFn: () => void,
      pollBeforeCallbackFn: boolean = false,
    ) => {
      setModalState({
        type: ModalType.AcceptBundlingFee,
        selectedProducts,
        callbackFn,
        pollBeforeCallbackFn,
      });
    },
    [setModalState],
  );

  const onToggleSale = async (commerceProductId: string, newStatus: ProductStatusType) => {
    try {
      await updateCommerceProductStatus(commerceProductId, newStatus);
    } catch (error) {
      const errorResponse = getResponseFromError(error);
      const errorObject = await parseCommerceErrorResponse(errorResponse);
      const errorMessage = errorObject?.errorMessage ?? '';

      if (errorMessage === CommerceFailureReason.IneligibleForSale) {
        enqueueSnackbar(
          translate('Message.UpdateCommerceProductStatusFailure.DuplicateItemOnSale'),
          {
            severity: 'error',
          },
        );
      } else {
        enqueueSnackbar(translate('Message.UpdateCommerceProductStatusFailure'), {
          severity: 'error',
        });
      }
    }
  };

  const emptyView =
    commerceItems.length === 0 ? (
      <CommerceEmptyView
        iconPath={commerceCreationIconPath}
        message={translate('Heading.CreateProducts')}
        description={translate('Description.ImportCatalog.Creations')}
        buttonText={translate('Action.ImportCatalog.Create')}
        onButtonClick={() => {
          navigateToCommerce(CommerceTab.CommerceItems);
        }}
      />
    ) : (
      <CommerceEmptyView
        iconPath={commerceCreationIconPath}
        message={translate('Heading.CreateProducts')}
        description={translate('Description.CreateProducts')}
        buttonText={translate('Action.StartCreating')}
        onButtonClick={() => {
          setCatalogSelectedCommerceItemIds([]);
          navigateToCommerceCreateProducts();
        }}
      />
    );

  const onClickInvoicingInfo = useCallback(() => {
    setModalState({ type: ModalType.InvoicingForm });
  }, []);

  const isCommerceProductsEmpty = commerceProducts.length === 0;
  const showCircularProgress =
    isCommerceProductsEmpty && (isLoadingCommerceProducts || isLoadingCommerceItems);
  const showCommerceEmptyView =
    isCommerceProductsEmpty && !(isLoadingCommerceProducts || isLoadingCommerceItems);
  const showCommerceProductsTableView =
    !isCommerceProductsEmpty && !(isLoadingCommerceProducts || isLoadingCommerceItems);

  // Handle modal state changes (close and open dialogs)
  useEffect(() => {
    const resetModalState = () => setModalState({ type: ModalType.None });

    switch (modalState.type) {
      case ModalType.None:
        closeModal();
        break;
      case ModalType.ArchiveCommerceProduct:
        openModal(
          <CommerceArchiveProductModal
            isLoading={isArchiveCommerceProductLoading}
            onCancel={resetModalState}
            onConfirm={async () => {
              setIsArchiveCommerceProductLoading(true);

              try {
                await archiveCommerceProduct(modalState.commerceProductId);
                enqueueSnackbar(translate('Message.ArchiveCommerceProductSuccess'));
              } catch {
                enqueueSnackbar(translate('Message.ArchiveCommerceProductFailure'), {
                  severity: 'error',
                });
              }

              setIsArchiveCommerceProductLoading(false);
              resetModalState();
              await refreshCommerceProducts();
            }}
          />,
          getModalProps({ maxWidth: 'Medium', onBackdropClick: resetModalState }),
        );
        break;
      case ModalType.InvoicingForm:
        openModal(
          <CommerceEligibilityInvoicingInfoModal
            legalContactInfo={legalInfo}
            onCancel={resetModalState}
            onSubmit={onSubmitInvoicingInfo}
            countries={countries}
          />,
          getModalProps({
            maxWidth: 'Large',
            onBackdropClick: resetModalState,
            useHigherContrast: true,
          }),
        );
        break;
      case ModalType.BulkArchiveCommerceProductsModal:
        openModal(
          <BulkArchiveCommerceProducts
            isLoading={isArchiveCommerceProductLoading}
            onCancel={resetModalState}
            onConfirm={async () => {
              setIsArchiveCommerceProductLoading(true);

              try {
                await Promise.all(
                  modalState.commerceProductIds.map((id) => archiveCommerceProduct(id)),
                );
                enqueueSnackbar(translate('Message.ArchiveCommerceProductSuccess'));
              } catch {
                enqueueSnackbar(translate('Message.ArchiveCommerceProductFailure'), {
                  severity: 'error',
                });
              }

              setIsArchiveCommerceProductLoading(false);
              resetModalState();
              await refreshCommerceProducts();
            }}
          />,
          getModalProps({ maxWidth: 'Medium', onBackdropClick: resetModalState }),
        );
        break;
      case ModalType.AcceptBundlingFee:
        openModal(
          <CommerceAcceptBundlingFeeModal
            isLoading={isAcceptBundlingFeeLoading}
            onCancel={resetModalState}
            onConfirm={async () => {
              setIsAcceptBundlingFeeLoading(true);

              try {
                await Promise.all(
                  modalState.selectedProducts
                    .filter((product) => product.status !== ProductStatusType.NUMBER_2)
                    .map((product) => acceptCommerceProductBundlingFee(product.id)),
                );
                enqueueSnackbar(translate('Message.AcceptBundlingFeeSuccess'));

                const pollInterval = 3000;
                const pollForApproval = async (attempt: number): Promise<void> => {
                  if (attempt === 0) {
                    return;
                  }

                  await new Promise((resolve) => setTimeout(resolve, pollInterval));
                  const updatedProducts = await fetchCommerceProductsWithoutUpdate();

                  // Check if all selected products are approved
                  const allApproved = modalState.selectedProducts.every((product) => {
                    const updatedProduct = updatedProducts.find(
                      (p: CommerceProductModel) => p.id === product.id,
                    );
                    return updatedProduct?.status === ProductStatusType.NUMBER_2;
                  });

                  if (!allApproved) {
                    await pollForApproval(attempt - 1);
                  }
                };

                if (modalState.pollBeforeCallbackFn) {
                  await pollForApproval(20);
                }
              } catch {
                enqueueSnackbar(translate('Message.AcceptBundlingFeeFailure'), {
                  severity: 'error',
                });
              }

              setIsAcceptBundlingFeeLoading(false);
              modalState.callbackFn();
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
    archiveCommerceProduct,
    modalState,
    commerceItems,
    refreshCommerceProducts,
    isArchiveCommerceProductLoading,
    isSubmittingInvoicingInfo,
    onSubmitInvoicingInfo,
    countries,
    isAcceptBundlingFeeLoading,
    acceptCommerceProductBundlingFee,
    commerceProducts,
    fetchCommerceProductsWithoutUpdate,
    legalInfo,
  ]);

  if (commerceItemsError || commerceProductsError || !eligibilityStatus) {
    return <CommerceErrorView />;
  }

  return (
    <CommerceTabContainer>
      {showCircularProgress && <CircularProgress color='secondary' />}
      {showCommerceEmptyView && emptyView}
      {showCommerceProductsTableView && (
        <Grid
          item
          container
          alignItems='stretch'
          justifyContent='flex-start'
          flexGrow={1}
          marginTop={2}
          marginBottom={10}
          gap={14}>
          <CommerceProductsTableView
            eligibilityStatus={eligibilityStatus}
            commerceItems={commerceItems}
            commerceProducts={commerceProducts}
            onToggleSale={onToggleSale}
            onClickArchive={onClickArchive}
            createCommerceProductError={createCommerceProductError}
            onClickBulkArchive={onClickBulkArchive}
            setCommerceCreateProductError={setCommerceCreateProductError}
            setCatalogSelectedCommerceItemIds={setCatalogSelectedCommerceItemIds}
            areVirtualBenefitsEnabled={areVirtualBenefitsEnabled}
            isProductSaleEnabled={isProductSaleEnabled}
            hasBusinessInfoPermissions={hasBusinessInfoPermissions}
            onClickInvoicingInfo={onClickInvoicingInfo}
            onAcceptBundlingFee={onAcceptBundlingFee}
          />
        </Grid>
      )}
    </CommerceTabContainer>
  );
};

export default withTranslation(CommerceProductsTabContent, [TranslationNamespace.Commerce]);
