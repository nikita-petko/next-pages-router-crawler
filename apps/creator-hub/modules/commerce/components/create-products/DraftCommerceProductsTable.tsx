import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { CommerceGrantableModel } from '@rbx/client-commerce-api/v1';
import { ProductStatusType, GrantableType, InventoryType } from '@rbx/client-commerce-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  AddIcon,
  Button,
  Checkbox,
  CloseIcon,
  DeleteOutlinedIcon,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  VisibilityOutlinedIcon,
} from '@rbx/ui';
import type { CommerceProductModel } from '@modules/clients/commerce';
import { CommerceFailureReason } from '@modules/clients/commerce';
import { getResponseFromError } from '@modules/clients/utils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { commerceDraftEditIconPath } from '../../configs/assets';
import { InventorySelectionType } from '../../constants';
import useBottomSnackbar from '../../hooks/useBottomSnackbar';
import useCommerce from '../../hooks/useCommerce';
import useCommerceNavigation, { CommerceTab } from '../../hooks/useCommerceNavigation';
import useModal from '../../hooks/useModal';
import { grantableTypeToThumbnailType } from '../../utils/benefitTypeToThumbnailType';
import useCreateProductsStyles from '../../utils/CreateProducts.styles';
import parseCommerceErrorResponse from '../../utils/parseCommerceErrorResponse';
import CommerceEmptyView from '../CommerceEmptyView';
import PreOrderAlert from '../PreOrderAlert';
import BundlingQuantitySelection from '../table/BundlingQuantitySelection';
import InventoryTypeSelection from '../table/InventoryTypeSelection';
import { ThumbnailImage } from '../ThumbnailImage';
import CreateProductsStickyFooter from './CreateProductsStickyFooter';
import type { VirtualBenefitFormType } from './virtual-benefits/types';
import VirtualBenefitFormProvider from './virtual-benefits/VirtualBenefitFormProvider';
import VirtualBenefitModal from './virtual-benefits/VirtualBenefitModal';

interface DraftCommerceProductsTableProps {
  configureCommerceProducts: CommerceProductModel[];
  primaryButtonColor: 'primaryBrand' | 'secondary';
  onClickCancel: () => void;
  onClickBack?: () => void;
  areVirtualBenefitsEnabled: boolean;
}

type SelectedState = Record<string, boolean>;

// Opens the PDP for the given product in a new tab.
const previewPdp = (commerceProductId: string) => {
  if (commerceProductId) {
    const pdpUrl = `https://shop.${process.env.robloxSiteDomain}/product/${commerceProductId}`;
    if (pdpUrl) {
      window.open(pdpUrl, '_blank');
    }
  }
};

const DraftCommerceProductsTable = ({
  configureCommerceProducts,
  primaryButtonColor,
  onClickCancel,
  onClickBack,
  areVirtualBenefitsEnabled,
}: DraftCommerceProductsTableProps) => {
  const { classes, cx } = useCreateProductsStyles();
  const { translate } = useTranslation();
  const {
    commerceProducts,
    archiveCommerceProduct,
    updateCommerceProductDraft,
    updateCommerceProductStatus,
    createCommerceProductBundlingFee,
    refreshCommerceProducts,
  } = useCommerce();
  const { navigateToCommerce, navigateToCommerceCreateProducts } = useCommerceNavigation();
  const { enqueueSnackbar } = useBottomSnackbar();
  const [isCreateCommerceProductsLoading, setIsCreateCommerceProductsLoading] = useState(false);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const { openModal, closeModal, getSidePanelProps } = useModal();

  const [inventoryTypes, setInventoryTypes] = useState<Map<string, string>>(new Map());
  const [quantity, setQuantity] = useState<Map<string, number>>(new Map());

  const draftCommerceProducts = useMemo(
    () => commerceProducts.filter((product) => product.status === ProductStatusType.NUMBER_1),
    [commerceProducts],
  );

  // We only want to display the developer products that are not in draft status
  // This is because the developer products are only created when leaving the draft state.
  const developerProductsToDisplay = useMemo(() => {
    const nonDraftProducts = commerceProducts.filter(
      (product) => product.status !== ProductStatusType.NUMBER_1,
    );
    const productsWithDeveloperProduct = nonDraftProducts.filter((product) =>
      product.commerceGrantables.some(
        (grantable) => grantable.grantableType === GrantableType.DeveloperProduct,
      ),
    );
    return productsWithDeveloperProduct.flatMap((product) =>
      product.commerceGrantables.filter(
        (grantable) => grantable.grantableType === GrantableType.DeveloperProduct,
      ),
    );
  }, [commerceProducts]);

  useEffect(() => {
    const defaultInventoryTypes: Map<string, string> = inventoryTypes;

    draftCommerceProducts.forEach((commerceProduct) => {
      if (commerceProduct.commerceGrantables.length > 0) {
        if (!inventoryTypes.has(commerceProduct.id)) {
          defaultInventoryTypes.set(commerceProduct.id, InventorySelectionType.MerchOnDemand);
        }
      }
    });
    setInventoryTypes(defaultInventoryTypes);
  }, [draftCommerceProducts, inventoryTypes]);

  const getDefaultValues = useCallback(
    (value: boolean) => {
      return draftCommerceProducts.reduce((acc, item) => {
        acc[item.id] = value;
        return acc;
      }, {} as SelectedState);
    },
    [draftCommerceProducts],
  );

  const { control, watch, setValue, reset } = useForm({
    defaultValues: getDefaultValues(false), // Initialize all checkboxes as unchecked
  });

  const selectedState = watch();

  // Prevent pagination from going out of bounds (e.g. when archiving items)
  useEffect(() => {
    setPage((prevPage) => {
      if (prevPage * rowsPerPage >= configureCommerceProducts.length) {
        return Math.floor((configureCommerceProducts.length - 1) / rowsPerPage);
      }
      return prevPage;
    });
  }, [configureCommerceProducts.length, rowsPerPage, page]);

  const onUpdateBenefit = useCallback(
    async (commerceProductId: string, grantables: Array<CommerceGrantableModel>) => {
      try {
        await updateCommerceProductDraft(commerceProductId, grantables);
        if (grantables.length > 0) {
          setInventoryTypes((prev) => new Map(prev).set(commerceProductId, 'merch-on-demand'));
        }
        closeModal();
      } catch (error) {
        const errorResponse = getResponseFromError(error);
        const errorObject = await parseCommerceErrorResponse(errorResponse);
        const commerceStatusCode = errorObject?.failureReason ?? 0;

        let commerceCreateProductErrorMsg = '';
        if (commerceStatusCode === CommerceFailureReason.ProductAlreadyExists) {
          commerceCreateProductErrorMsg = translate(
            'Message.UpdateCommerceProductGrantableConflict',
          );
        } else if (
          commerceStatusCode === CommerceFailureReason.InvalidInput &&
          errorObject?.errorMessage
        ) {
          commerceCreateProductErrorMsg = errorObject?.errorMessage;
        } else {
          commerceCreateProductErrorMsg = translate('Message.UpdateCommerceProductGenericError');
        }
        enqueueSnackbar(commerceCreateProductErrorMsg, {
          severity: 'error',
        });
      }
    },
    [closeModal, updateCommerceProductDraft, enqueueSnackbar, translate],
  );

  const onClickDelete = useCallback(
    async (commerceProductId: string) => {
      await archiveCommerceProduct(commerceProductId);
    },
    [archiveCommerceProduct],
  );

  const selectedCount = useMemo(
    () => Object.values(selectedState).filter(Boolean).length,
    [selectedState],
  );

  const selectedProductIds = useMemo(
    () =>
      Object.entries(selectedState)
        .filter(([, value]) => value)
        .map(([key]) => key),
    [selectedState],
  );

  const onClickCreate = useCallback(async () => {
    setIsCreateCommerceProductsLoading(true);

    const results = await Promise.allSettled(
      selectedProductIds.map(async (productId) => {
        if (areVirtualBenefitsEnabled) {
          const inventoryTypeValue = inventoryTypes.get(productId);
          let quantityValue = quantity.get(productId);

          let inventoryEnum: InventoryType;
          switch (inventoryTypeValue) {
            case InventorySelectionType.FixedQuantity:
              inventoryEnum = InventoryType.FixedQuantity;
              break;
            case InventorySelectionType.MerchOnDemand:
              inventoryEnum = InventoryType.OnDemand;
              quantityValue = 0;
              break;
            case InventorySelectionType.PreOrder:
              inventoryEnum = InventoryType.PreOrder;
              quantityValue = 0;
              break;
            case undefined:
            default:
              inventoryEnum = InventoryType.Invalid;
          }

          if (quantityValue !== undefined && quantityValue !== null) {
            await createCommerceProductBundlingFee(productId, quantityValue, inventoryEnum);
          }
        }

        return updateCommerceProductStatus(productId, ProductStatusType.NUMBER_3);
      }),
    );

    await Promise.all(
      results.map(async (result) => {
        if (result.status === 'fulfilled') {
          return; // No conflict if fulfilled (success)
        }

        const errorResponse = getResponseFromError(result.reason as unknown);
        const errorObject = await parseCommerceErrorResponse(errorResponse);
        const commerceStatusCode = errorObject?.failureReason ?? 0;

        if (commerceStatusCode === CommerceFailureReason.ProductAlreadyExists) {
          enqueueSnackbar(
            translate('Message.CreateCommerceProductsFailure.Singular.ProductAlreadyExists'),
            {
              severity: 'error',
            },
          );
        } else if (
          commerceStatusCode === CommerceFailureReason.InvalidInput &&
          errorObject?.errorMessage
        ) {
          enqueueSnackbar(errorObject?.errorMessage, {
            severity: 'error',
          });
        } else {
          enqueueSnackbar(translate('Message.UpdateCommerceProductGenericError'), {
            severity: 'error',
          });
        }
      }),
    );

    const successCount = results.filter((result) => result.status === 'fulfilled').length;
    const failureCount = results.length - successCount; // More concise

    if (successCount > 0) {
      await refreshCommerceProducts();
      enqueueSnackbar(
        successCount > 1
          ? translate('Message.CreateCommerceProductsSuccess.Plural', {
              n: successCount.toString(),
            })
          : translate('Message.CreateCommerceProductsSuccess.Singular'),
        {
          severity: 'success',
        },
      );
    }

    setIsCreateCommerceProductsLoading(false);
    if (failureCount === 0) {
      navigateToCommerce(CommerceTab.CommerceProducts);
      onClickCancel();
    }
  }, [
    selectedProductIds,
    areVirtualBenefitsEnabled,
    updateCommerceProductStatus,
    inventoryTypes,
    quantity,
    createCommerceProductBundlingFee,
    enqueueSnackbar,
    translate,
    refreshCommerceProducts,
    navigateToCommerce,
    onClickCancel,
  ]);

  const openDraftBenefitModal = (
    commerceProduct: CommerceProductModel,
    commerceGrantable?: CommerceGrantableModel | null,
  ) => {
    const defaultValues: VirtualBenefitFormType = {
      grantableType: commerceGrantable?.grantableType ?? '',
      grantableAssetId: commerceGrantable?.grantableAssetId ?? '',
      name: commerceGrantable?.name ?? '',
      description: commerceGrantable?.description ?? '',
      imageAssetId: commerceGrantable?.imageAssetId ?? 0,
      developerProductId: commerceGrantable?.developerProductId ?? 0,
    };

    openModal(
      <VirtualBenefitFormProvider defaultValues={defaultValues}>
        <VirtualBenefitModal
          selectedCommerceProductId={commerceProduct.id}
          productImageId={commerceProduct.commerceItem.defaultImageAssetId ?? 0}
          productImageUrl={commerceProduct.commerceItem.defaultImageSourceUrl ?? ''}
          productName={commerceProduct.commerceItem.merchantItemDisplayName}
          existingDeveloperProductGrantables={developerProductsToDisplay}
          onSave={onUpdateBenefit}
          onClose={closeModal}
        />
      </VirtualBenefitFormProvider>,
      getSidePanelProps({ maxWidth: 'Medium', onBackdropClick: closeModal }),
    );
  };

  const getGrantableThumbnail = (grantable: CommerceGrantableModel) => {
    let thumbnailTargetType =
      grantableTypeToThumbnailType[grantable.grantableType ?? GrantableType.Invalid];
    let thumbnailTargetId;
    if (grantable.grantableAssetId?.toString() === 'draft_dev_product') {
      thumbnailTargetType = ThumbnailTypes.assetThumbnail;
      thumbnailTargetId = grantable.imageAssetId ?? 0;
    } else {
      thumbnailTargetId = Number(grantable.grantableAssetId);
    }
    return (
      <Thumbnail2d
        skeletonVariant='rectangular'
        type={thumbnailTargetType}
        targetId={thumbnailTargetId}
        alt={grantable.name ?? 'No benefit name'}
        includeBackground
      />
    );
  };

  const displayBenefit = (commerceProduct: CommerceProductModel) => {
    // If there is a benefit, display a preview
    if (commerceProduct.commerceGrantables.length > 0) {
      const commerceGrantable = commerceProduct.commerceGrantables[0];
      return (
        <Button
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            openDraftBenefitModal(commerceProduct, commerceGrantable);
          }}
          variant='contained'
          style={{ padding: 0 }}>
          <Paper className={classes.benefitContainer} tabIndex={0}>
            <Grid container alignItems='center'>
              <Grid item container XSmall={3} className={classes.thumbnailContainer}>
                {getGrantableThumbnail(commerceGrantable)}
              </Grid>
              <Grid item XSmall={7} className={classes.benefitLabelText}>
                <Typography className={classes.benefitLabelText}>
                  {commerceGrantable.name ?? 'No benefit name'}
                </Typography>
              </Grid>
              <Grid item XSmall={2}>
                <IconButton
                  aria-label={translate('Action.Delete')}
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    void onUpdateBenefit(commerceProduct.id, []); // Remove the benefit by updating with an empty array
                  }}
                  className={classes.deleteBenefitIconContainer}>
                  <CloseIcon color='secondary' />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        </Button>
      );
    }
    // If not, display the add benefit button
    return (
      <Button
        color='primary'
        size='medium'
        variant='outlined'
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          openDraftBenefitModal(commerceProduct);
        }}>
        <AddIcon />
        <Typography className={classes.benefitIcon}>{translate('Action.AddBenefit')}</Typography>
      </Button>
    );
  };

  const bundlingFeeSupplementaryInput = useCallback(
    (commerceProductId: string, hasGrantables: boolean) => {
      if (!areVirtualBenefitsEnabled) {
        return null;
      }

      if (!inventoryTypes.has(commerceProductId)) {
        return (
          <>
            <TableCell />
            <TableCell />
          </>
        );
      }

      return (
        <>
          <TableCell>
            <InventoryTypeSelection
              inventoryType={inventoryTypes}
              setInventoryType={setInventoryTypes}
              commerceProductId={commerceProductId}
              hasGrantables={hasGrantables}
            />
          </TableCell>
          <TableCell>
            <BundlingQuantitySelection
              commerceProductId={commerceProductId}
              inventoryType={inventoryTypes}
              quantityMap={quantity}
              setQuantity={setQuantity}
              hasGrantables={hasGrantables}
            />
          </TableCell>
        </>
      );
    },
    [areVirtualBenefitsEnabled, inventoryTypes, quantity],
  );

  if (draftCommerceProducts.length === 0) {
    return (
      <CommerceEmptyView
        iconPath={commerceDraftEditIconPath}
        message={translate('Heading.NoDraftHere')}
        description={translate('Message.NoSavedDrafts')}
        buttonText={translate('Action.CreateProducts')}
        buttonColor='secondary'
        onButtonClick={() => {
          navigateToCommerceCreateProducts();
        }}
      />
    );
  }

  // TODO(SUBS-3228): add duplicate functionality
  return (
    <Grid
      item
      container
      alignItems='stretch'
      justifyContent='flex-start'
      flexGrow={1}
      marginBottom={10}
      gap={14}>
      <Grid className={classes.root} container direction='column' gap={4}>
        <PreOrderAlert />
        <Grid item>
          <Grid container direction='row' justifyContent='space-between' alignItems='center'>
            <TableContainer>
              <Table padding='normal' size='medium'>
                <TableHead>
                  <TableRow>
                    <TableCell className={cx(classes.columnCollapsed, classes.checkBox)}>
                      <Checkbox
                        color='secondary'
                        indeterminate={
                          selectedCount > 0 && selectedCount < draftCommerceProducts.length
                        }
                        checked={selectedCount === draftCommerceProducts.length}
                        onClick={() => {
                          reset(getDefaultValues(selectedCount === 0));
                        }}
                      />
                    </TableCell>
                    <TableCell className={classes.configureTableCell}>
                      {translate('Label.CatalogItem')}
                    </TableCell>
                    <TableCell className={classes.configureTableCell}>
                      {translate('Label.VirtualBenefit')}
                    </TableCell>
                    {areVirtualBenefitsEnabled && (
                      <>
                        <TableCell className={classes.configureTableCell}>
                          {translate('Label.InventoryType')}
                        </TableCell>
                        <TableCell className={classes.smallTableCell}>
                          {translate('Label.Quantity')}
                        </TableCell>
                      </>
                    )}
                    <TableCell className={classes.configureTableCell} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    // TODO(SUBS-3217): lazy load pages
                    draftCommerceProducts
                      .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                      .map((commerceProduct) => {
                        const {
                          id: commerceProductId,
                          commerceItem,
                          commerceGrantables,
                        } = commerceProduct;
                        const {
                          defaultImageAssetId,
                          merchantItemDisplayName,
                          defaultImageSourceUrl,
                        } = commerceItem;

                        return (
                          <TableRow
                            className={classes.row}
                            sx={{ flexShrink: 0 }}
                            key={commerceProductId}
                            hover
                            selected={selectedState[commerceProductId]}
                            onClick={() => {
                              setValue(commerceProductId, !selectedState[commerceProductId]);
                            }}>
                            <TableCell className={classes.checkBox}>
                              <Controller
                                name={commerceProductId}
                                control={control}
                                defaultValue={false}
                                render={({ field }) => {
                                  return (
                                    <Checkbox {...field} checked={field.value} color='secondary' />
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell className={cx(classes.cellCompact)} sx={{ minWidth: 450 }}>
                              <Grid
                                container
                                direction='row'
                                alignItems='center'
                                gap={2}
                                wrap='nowrap'>
                                {/* Wrap the left-side content in a Grid item and add flexGrow */}
                                <Grid item flexGrow={1}>
                                  <Grid
                                    container
                                    direction='row'
                                    alignItems='center'
                                    gap={2}
                                    wrap='nowrap'>
                                    <Grid
                                      container
                                      className={classes.thumbnailContainer}
                                      flexShrink={0}>
                                      <ThumbnailImage
                                        imageAssetId={defaultImageAssetId}
                                        imageUrl={defaultImageSourceUrl ?? ''}
                                        alt={merchantItemDisplayName}
                                      />
                                    </Grid>
                                    <Typography
                                      noWrap
                                      sx={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: 300, // Adjust this value
                                      }}>
                                      {merchantItemDisplayName}
                                    </Typography>
                                  </Grid>
                                </Grid>
                                <Grid item>
                                  <Tooltip
                                    arrow
                                    placement='top'
                                    title={translate('Action.PreviewPDP')}>
                                    <IconButton
                                      aria-label={translate('Action.PreviewPDP')}
                                      className={cx('showOnRowHover')}
                                      color='default'
                                      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                        event.stopPropagation();
                                        previewPdp(commerceProductId);
                                      }}>
                                      <VisibilityOutlinedIcon fontSize='large' />
                                    </IconButton>
                                  </Tooltip>
                                </Grid>
                              </Grid>
                            </TableCell>
                            <TableCell sx={{ flexShrink: 0 }}>
                              {displayBenefit(commerceProduct)}
                            </TableCell>
                            {bundlingFeeSupplementaryInput(
                              commerceProductId,
                              commerceGrantables.length > 0,
                            )}
                            <TableCell align='right' sx={{ maxWidth: 200 }}>
                              <Grid item>
                                <Tooltip arrow placement='top' title={translate('Action.Delete')}>
                                  <IconButton
                                    sx={{
                                      marginLeft: '10px',
                                    }}
                                    aria-label={translate('Action.Delete')}
                                    className={cx('showOnRowHover')}
                                    color='default'
                                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                      event.stopPropagation();
                                      void onClickDelete(commerceProductId);
                                    }}>
                                    <DeleteOutlinedIcon />
                                  </IconButton>
                                </Tooltip>
                              </Grid>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  }
                </TableBody>
              </Table>
              <TablePagination
                className={classes.pagination}
                classes={{ toolbar: classes.paginationToolbar }}
                rowsPerPageOptions={[10, 20, 50]}
                count={draftCommerceProducts.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_event: unknown, newPage: number) => {
                  setPage(newPage);
                }}
                onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </TableContainer>
          </Grid>
        </Grid>
        <Grid container direction='column'>
          <CreateProductsStickyFooter
            primaryButtonText={translate('Action.SubmitForReview')}
            primaryButtonDisabled={selectedProductIds.length === 0}
            primaryButtonColor={primaryButtonColor}
            onClickCreate={onClickCreate}
            onClickCancel={onClickCancel}
            isLoading={isCreateCommerceProductsLoading}
            onClickBack={onClickBack}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(DraftCommerceProductsTable, [TranslationNamespace.Commerce]);
