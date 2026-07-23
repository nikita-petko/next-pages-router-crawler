import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  AccessTimeIcon,
  DeleteOutlinedIcon,
  FileCopyOutlinedIcon,
  VisibilityOutlinedIcon,
  CheckCircleIcon,
  CheckCircleOutlineIcon,
  Grid,
  IconButton,
  Label,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  ErrorOutlineOutlinedIcon,
  InfoOutlinedIcon,
  Menu,
  MenuItem,
  Checkbox,
  SellOutlinedIcon,
  SellIcon,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { CommerceProductModel, CommerceEligibilityStatus } from '@modules/clients/commerce';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  CommerceProductReviewTaskModel,
  ProductReviewType,
  ProductStatusType,
} from '@rbx/clients/commerceApi/v1';
import {
  CommerceProductBundlingFeeModel,
  CommerceProductBundlingFeeStatus,
} from '@rbx/clients/commerceApi';
import { grantableTypeToThumbnailType } from '../utils/benefitTypeToThumbnailType';
import useFormatters from '../hooks/useFormatters';
import BundlingFeeDisplay from './table/BundlingFeeDisplay';
import ReviewTaskTooltipDetails from './table/ReviewTaskTooltipDetails';
import useExperienceOwner from '../hooks/useExperienceOwner';
import ActionBar from './table/ActionBar';
import { anySelectedProductsNeedBundlingFeeApproval, isProductApproved } from '../utils/utils';
import isBaselineEligible from '../utils/isBaselineEligible';

interface CommerceProductsTableProps {
  nonDraftCommerceProducts: CommerceProductModel[];
  onToggleSale: (commerceItemId: string, newStatus: ProductStatusType) => void;
  onClickArchive: (commerceItemId: string) => void;
  onClickBulkArchive: (commerceProductIds: string[]) => void;
  onAcceptBundlingFee: (
    selectedProducts: CommerceProductModel[],
    callbackFn: () => void,
    pollBeforeCallbackFn: boolean,
  ) => void;
  areVirtualBenefitsEnabled: boolean;
  isProductSaleEnabled: boolean;
  eligibilityStatus?: CommerceEligibilityStatus;
}

const useStyles = makeStyles()((theme) => ({
  pagination: {
    whiteSpace: 'nowrap',
    borderBottom: 'none',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  paginationToolbar: {
    padding: 0,
    minHeight: 60,
  },
  thumbnailContainer: {
    height: 48,
    width: 48,
    borderRadius: theme.border.radius.xsmall.borderRadius,
    overflow: 'hidden',
  },
  columnCollapsed: {
    width: 0,
  },
  row: {
    '&:not(:hover) .showOnRowHover': {
      opacity: 0,
      [theme.breakpoints.down('Medium')]: {
        opacity: 1,
      },
    },
    '&:hover .labelHover': {
      backgroundColor: theme.palette.surface[400],
    },
  },
  productIdColumn: {
    '&:not(:hover) .showOnColumnHover': {
      opacity: 0,
      [theme.breakpoints.down('Medium')]: {
        opacity: 1,
      },
    },
  },
  cellCompact: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    maxWidth: 0,
  },
  moderationLabel: {
    color: theme.palette.content.standard,
    backgroundColor: theme.palette.surface[200],
    padding: '6px 8px 6px 6px',
    minWidth: '79px',
  },
  moderationLabelIconApproved: {
    color: theme.palette.content.alert.active,
  },
  moderationLabelIconOnSale: {
    color: theme.palette.content.alert.inform,
  },
  moderationLabelIconInReview: {
    color: theme.palette.content.alert.notice,
  },
  infoIcon: {
    width: '12px',
  },
  mutedContent: {
    color: theme.palette.content.muted,
  },
  catalogItemColumnHead: {
    width: '272px',
    minWidth: '200px',
  },
  virtualBenefitColumnHead: {
    width: '240px',
    minWidth: '200px',
  },
  statusColumnHead: {
    width: '127px',
  },
  productIdColumnHead: {
    width: '240px',
  },
  productId: {
    width: '214px',
  },
  priceColumnHead: {
    width: '160px',
  },
  bundlingFeeHead: {
    width: '160px',
    minWidth: '160px',
  },
  checkboxColumn: {
    width: '48px',
    padding: 0,
  },
  tableHeader: {
    position: 'relative',
    zIndex: 0,
  },
}));

const CommerceProductsTable: FunctionComponent<CommerceProductsTableProps> = ({
  nonDraftCommerceProducts,
  onToggleSale,
  onClickArchive,
  onClickBulkArchive,
  onAcceptBundlingFee,
  areVirtualBenefitsEnabled,
  isProductSaleEnabled,
  eligibilityStatus,
}) => {
  const { translate } = useTranslation();
  const { classes, cx } = useStyles();
  const { formatPrice } = useFormatters();

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const { isExperienceOwner: shouldShowAppealsLink, isFetched: isExperienceOwnerFetched } =
    useExperienceOwner();

  // Prevent pagination from going out of bounds (e.g. when archiving items)
  useEffect(() => {
    setPage((prevPage) => {
      if (prevPage * rowsPerPage >= nonDraftCommerceProducts.length) {
        return Math.floor((nonDraftCommerceProducts.length - 1) / rowsPerPage);
      }
      return prevPage;
    });
  }, [nonDraftCommerceProducts, rowsPerPage, page]);

  const isContentModerationTask = (reviewTask: CommerceProductReviewTaskModel) => {
    return reviewTask.reviewType === ProductReviewType.NUMBER_2;
  };

  const isVirtualBenefitModerationTask = (reviewTask: CommerceProductReviewTaskModel) => {
    return reviewTask.reviewType === ProductReviewType.NUMBER_3;
  };

  const isRejectedTask = useCallback((reviewTask: CommerceProductReviewTaskModel) => {
    return (
      reviewTask.reviewReferenceId?.startsWith('reject_') ||
      isVirtualBenefitModerationTask(reviewTask)
    );
  }, []);

  const getModerationStatus = useCallback(
    (
      status?: ProductStatusType,
      reviewTasks?: CommerceProductReviewTaskModel[],
      bundlingFee?: CommerceProductBundlingFeeModel,
    ) => {
      // If status is 5 (moderated) and has any rejected tasks, it should be moderated
      if (
        status === ProductStatusType.NUMBER_5 &&
        reviewTasks?.some((task) => isRejectedTask(task))
      ) {
        return 'Label.Moderated';
      }

      // If there's a moderation review task, the product is pending moderation
      const hasModerationTask = reviewTasks?.some(
        (task) => isContentModerationTask(task) && !isRejectedTask(task),
      );
      if (hasModerationTask) {
        return 'Label.Pending';
      }

      // If there's a bundling fee review task and the product has a bundling fee, it's approved
      const hasBundlingFeeTask = reviewTasks?.some(
        (task) => task.reviewType === ProductReviewType.NUMBER_1,
      );
      if (bundlingFee?.status === CommerceProductBundlingFeeStatus.NUMBER_1 && hasBundlingFeeTask) {
        return 'Label.Approved';
      }

      // Otherwise, use the original status logic
      switch (status) {
        case ProductStatusType.NUMBER_1: // Draft
          return 'Label.Draft';
        case ProductStatusType.NUMBER_2: // Approved, not for sale
          return 'Label.Approved';
        case ProductStatusType.NUMBER_3: // In review
          return 'Label.Pending';
        case ProductStatusType.NUMBER_4: // Approved, for sale
          return 'Label.OnSale';
        case ProductStatusType.NUMBER_5: // Moderated, product was reactively taken down
          return 'Label.Moderated';
        default:
          throw new Error('Invalid moderation status type');
      }
    },
    [isRejectedTask],
  );

  // Opens the PDP for the given product in a new tab.
  const previewPdp = (commerceProductId: string) => {
    if (commerceProductId) {
      const pdpUrl = `https://shop.${process.env.robloxSiteDomain}/product/${commerceProductId}`;
      if (pdpUrl) {
        window.open(pdpUrl, '_blank');
      }
    }
  };

  const eligibleForSale = useCallback(
    (product: CommerceProductModel) => {
      const isProductEligible =
        isProductApproved(product) || product.status === ProductStatusType.NUMBER_4;
      // Checks if user is not on denylist and is baseline eligible
      const isEligible =
        isProductSaleEnabled && isBaselineEligible(eligibilityStatus?.baselineEligibility);
      const isBundlingEligible = eligibilityStatus?.bundlingEligibility.isEligible;

      const isBundle = product.commerceGrantables.length > 0;
      if (!isBundle) {
        // Not a bundle, only base eligibility matters
        return isEligible && isProductEligible;
      }
      // Check bundling eligibility
      return !!isBundlingEligible && isProductEligible;
    },
    [isProductSaleEnabled, eligibilityStatus],
  );

  // Product is on sale if it has status NUMBER_4 (approved, for sale)
  const onSale = useCallback((status?: ProductStatusType) => {
    return status === ProductStatusType.NUMBER_4;
  }, []);

  const isRejected = useCallback(
    (status?: ProductStatusType, reviewTasks?: CommerceProductReviewTaskModel[]) => {
      return (
        status === ProductStatusType.NUMBER_5 && reviewTasks?.some((task) => isRejectedTask(task))
      );
    },
    [isRejectedTask],
  );

  const handleModerationInfoOpenClose = useCallback(
    (event?: React.MouseEvent<HTMLButtonElement>, productId?: string) => {
      setAnchorEl(event?.currentTarget || null);
      setSelectedProductId(productId || null);
    },
    [],
  );

  const handleViewViolationDetails = useCallback((reviewTaskId: string) => {
    if (!reviewTaskId) {
      window.open(`https://${process.env.robloxSiteDomain}/report-appeals#`);
      return;
    }

    // Strip the "reject_" prefix if it exists
    const cleanedTaskId = reviewTaskId.startsWith('reject_')
      ? reviewTaskId.substring('reject_'.length)
      : reviewTaskId;

    window.open(
      `https://${process.env.robloxSiteDomain}/report-appeals#/v/${cleanedTaskId}`,
      '_blank',
    );
  }, []);

  const handleSelectAllClick = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        const newSelected = new Set(
          nonDraftCommerceProducts
            .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
            .map((product) => product.id),
        );
        setSelectedRows(newSelected);
      } else {
        setSelectedRows(new Set());
      }
    },
    [nonDraftCommerceProducts, page, rowsPerPage],
  );

  const handleRowSelect = useCallback((productId: string) => {
    setSelectedRows((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(productId)) {
        newSelected.delete(productId);
      } else {
        newSelected.add(productId);
      }
      return newSelected;
    });
  }, []);

  const isAllSelected = useCallback(() => {
    const currentPageProducts = nonDraftCommerceProducts.slice(
      page * rowsPerPage,
      (page + 1) * rowsPerPage,
    );
    return (
      currentPageProducts.length > 0 &&
      currentPageProducts.every((product) => selectedRows.has(product.id))
    );
  }, [nonDraftCommerceProducts, page, rowsPerPage, selectedRows]);

  const getIconForProductStatus = useCallback(
    (
      status: ProductStatusType,
      reviewTasks?: CommerceProductReviewTaskModel[],
      bundlingFee?: CommerceProductBundlingFeeModel,
    ) => {
      // If status is 5 (moderated) and has any rejected tasks, it should show error icon
      if (
        status === ProductStatusType.NUMBER_5 &&
        reviewTasks?.some((task) => isRejectedTask(task))
      ) {
        return <ErrorOutlineOutlinedIcon color='error' />;
      }

      const hasModerationTask = reviewTasks?.some((task) => isContentModerationTask(task));
      if (hasModerationTask) {
        return <AccessTimeIcon className={classes.moderationLabelIconInReview} />;
      }

      // If there's a bundling fee review task and the product has a bundling fee, it's approved
      const hasBundlingFeeTask = reviewTasks?.some(
        (task) => task.reviewType === ProductReviewType.NUMBER_1,
      );
      if (bundlingFee?.status === CommerceProductBundlingFeeStatus.NUMBER_1 && hasBundlingFeeTask) {
        return <CheckCircleOutlineIcon className={classes.moderationLabelIconApproved} />;
      }

      switch (status) {
        case ProductStatusType.NUMBER_1: // Draft
        case ProductStatusType.NUMBER_3: // In review
          return <AccessTimeIcon className={classes.moderationLabelIconInReview} />;
        case ProductStatusType.NUMBER_4: // Approved, for sale
          return <CheckCircleIcon className={classes.moderationLabelIconOnSale} />;
        case ProductStatusType.NUMBER_2: // Approved, not for sale
        default:
          return <CheckCircleOutlineIcon className={classes.moderationLabelIconApproved} />;
      }
    },
    [
      classes.moderationLabelIconApproved,
      classes.moderationLabelIconInReview,
      classes.moderationLabelIconOnSale,
      isRejectedTask,
    ],
  );

  const handleAcceptBundlingFee = useCallback(
    (callbackFn: () => void) => {
      const selectedProducts = nonDraftCommerceProducts.filter((product) =>
        selectedRows.has(product.id),
      );
      onAcceptBundlingFee(selectedProducts, callbackFn, true);
    },
    [nonDraftCommerceProducts, selectedRows, onAcceptBundlingFee],
  );

  const renderNonDraftCommerceProducts = useCallback(() => {
    // TODO(SUBS-3217): lazy load pages
    return nonDraftCommerceProducts
      .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
      .map((commerceProduct) => {
        return (
          <TableRow className={classes.row} key={commerceProduct.id} hover>
            <TableCell className={classes.checkboxColumn}>
              <Checkbox
                checked={selectedRows.has(commerceProduct.id)}
                onChange={() => handleRowSelect(commerceProduct.id)}
                color='secondary'
              />
            </TableCell>
            <TableCell className={cx(classes.cellCompact)}>
              <Grid container direction='row' alignItems='center' gap={2} wrap='nowrap'>
                <Grid container className={classes.thumbnailContainer} flexShrink={0}>
                  <Thumbnail2d
                    skeletonVariant='rectangular'
                    type={ThumbnailTypes.assetThumbnail}
                    targetId={commerceProduct.commerceItem.defaultImageAssetId ?? 0}
                    alt={commerceProduct.commerceItem.merchantItemDisplayName}
                  />
                </Grid>
                <Typography noWrap>
                  {commerceProduct.commerceItem.merchantItemDisplayName}
                </Typography>
              </Grid>
            </TableCell>
            {areVirtualBenefitsEnabled && (
              <TableCell className={cx(classes.cellCompact)}>
                {commerceProduct.commerceGrantables.length > 0 && (
                  <Grid container direction='row' alignItems='center' gap={2} wrap='nowrap'>
                    <Grid item container className={classes.thumbnailContainer} flexShrink={0}>
                      <Thumbnail2d
                        type={
                          grantableTypeToThumbnailType[
                            commerceProduct.commerceGrantables[0].grantableType!
                          ]
                        }
                        targetId={Number(commerceProduct.commerceGrantables[0].grantableAssetId)}
                        alt={commerceProduct.commerceGrantables[0].name ?? ''}
                        includeBackground
                      />
                    </Grid>
                    <Typography noWrap>{commerceProduct.commerceGrantables[0].name}</Typography>
                  </Grid>
                )}
              </TableCell>
            )}
            <TableCell>
              {isRejected(commerceProduct.status, commerceProduct.reviewTasks ?? []) ? (
                <Grid container flexWrap='nowrap' alignItems='center' display='flex'>
                  <Grid item display='flex' alignItems='center'>
                    <Label
                      className='labelHover'
                      classes={{ root: classes.moderationLabel }}
                      icon={<ErrorOutlineOutlinedIcon color='error' />}
                      labelText={translate('Label.Moderated')}
                      severity='error'
                      variant='contained'
                    />
                  </Grid>
                  <Grid item display='flex' alignItems='center' style={{ marginLeft: '4px' }}>
                    {isExperienceOwnerFetched && shouldShowAppealsLink ? (
                      // show menu icon that opens appeals link for group owners or user owned experience
                      <React.Fragment>
                        <IconButton
                          aria-label='appeals action'
                          color='default'
                          size='small'
                          style={{
                            padding: '0px',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                          }}
                          onClick={(event) =>
                            handleModerationInfoOpenClose(event, commerceProduct.id)
                          }>
                          <InfoOutlinedIcon classes={{ root: classes.infoIcon }} />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl) && selectedProductId === commerceProduct.id}
                          variant='selectedMenu'
                          onClose={() => handleModerationInfoOpenClose()}>
                          {(() => {
                            const moderationTasks =
                              commerceProduct.reviewTasks?.filter(
                                (task) =>
                                  isContentModerationTask(task) ||
                                  isVirtualBenefitModerationTask(task),
                              ) || [];

                            const rejectedTasks = moderationTasks.filter((task) =>
                              isRejectedTask(task),
                            );

                            // If there's only one rejected task, use generic translation
                            if (rejectedTasks.length === 1) {
                              return (
                                <MenuItem
                                  key={`${rejectedTasks[0].reviewType}-${rejectedTasks[0].reviewReferenceId || 'default'}`}
                                  onClick={() =>
                                    handleViewViolationDetails(
                                      rejectedTasks[0].reviewReferenceId ?? '',
                                    )
                                  }>
                                  <Typography>
                                    {translate('Action.ViewViolationDetails')}
                                  </Typography>
                                </MenuItem>
                              );
                            }

                            // If there are multiple rejected tasks, show specific labels for each
                            return moderationTasks
                              .filter((task) => isRejectedTask(task))
                              .map((task) => (
                                <MenuItem
                                  key={`${task.reviewType}-${task.reviewReferenceId || 'default'}`}
                                  onClick={() =>
                                    handleViewViolationDetails(task.reviewReferenceId ?? '')
                                  }>
                                  <Typography>
                                    {isContentModerationTask(task)
                                      ? translate('Action.ViewCommerceProductViolationDetails')
                                      : translate('Action.ViewGrantableViolationDetails')}
                                  </Typography>
                                </MenuItem>
                              ));
                          })()}
                        </Menu>
                      </React.Fragment>
                    ) : (
                      // show tooltip for non-owners of group experiences
                      <Tooltip
                        title={
                          <Typography>
                            {translate('Description.AppealContactGroupOwner')}
                          </Typography>
                        }
                        placement='right'
                        arrow>
                        <InfoOutlinedIcon color='disabled' classes={{ root: classes.infoIcon }} />
                      </Tooltip>
                    )}
                  </Grid>
                </Grid>
              ) : (
                <Grid container direction='row' alignItems='center' spacing={0.5} wrap='nowrap'>
                  <Grid item wrap='nowrap'>
                    <Label
                      className='labelHover'
                      classes={{ root: classes.moderationLabel }}
                      icon={getIconForProductStatus(
                        commerceProduct.status,
                        commerceProduct.reviewTasks ?? [],
                        commerceProduct.bundlingFee ?? undefined,
                      )}
                      labelText={translate(
                        getModerationStatus(
                          commerceProduct.status,
                          commerceProduct.reviewTasks ?? [],
                          commerceProduct.bundlingFee ?? undefined,
                        ),
                      )}
                      severity='success'
                      variant='contained'
                    />
                  </Grid>

                  {getModerationStatus(
                    commerceProduct.status,
                    commerceProduct.reviewTasks ?? [],
                    commerceProduct.bundlingFee ?? undefined,
                  ) === 'Label.Pending' && (
                    <Grid item>
                      <Tooltip
                        title={
                          <ReviewTaskTooltipDetails
                            reviewTasks={commerceProduct.reviewTasks}
                            bundlingFee={commerceProduct.bundlingFee}
                          />
                        }
                        arrow
                        placement='right'>
                        <Grid item display='flex' alignItems='center'>
                          <InfoOutlinedIcon color='disabled' classes={{ root: classes.infoIcon }} />
                        </Grid>
                      </Tooltip>
                    </Grid>
                  )}
                </Grid>
              )}
            </TableCell>
            <TableCell className={classes.productIdColumn}>
              <Grid container direction='row' alignItems='center' wrap='nowrap'>
                <Grid item marginRight={0.5} className={classes.productId}>
                  <Typography noWrap>{commerceProduct.id}</Typography>
                </Grid>
                <Tooltip arrow placement='top' title={translate('Action.Copy')}>
                  <IconButton
                    aria-label={translate('Action.Copy')}
                    className={cx('showOnColumnHover')}
                    color='default'
                    onClick={() => navigator.clipboard.writeText(commerceProduct.id)}>
                    <FileCopyOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </TableCell>
            {areVirtualBenefitsEnabled && (
              <TableCell align='right'>
                <BundlingFeeDisplay
                  bundlingFee={commerceProduct.bundlingFee}
                  onAcceptBundlingFee={() =>
                    onAcceptBundlingFee([commerceProduct], () => {}, false)
                  }
                />
              </TableCell>
            )}
            <TableCell align='right'>
              <Typography>{formatPrice(commerceProduct.commerceItem.lastSyncedPrice)}</Typography>
            </TableCell>
            <TableCell>
              <Grid
                container
                direction='row'
                alignItems='center'
                justifyContent='flex-end'
                wrap='nowrap'>
                <Grid item>
                  <Tooltip arrow placement='top' title={translate('Action.PreviewPDP')}>
                    <IconButton
                      aria-label={translate('Action.PreviewPDP')}
                      className={cx('showOnRowHover')}
                      color='default'
                      onClick={() => previewPdp(commerceProduct.id)}>
                      <VisibilityOutlinedIcon fontSize='large' />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item>
                  <Tooltip
                    arrow
                    placement='top'
                    title={
                      onSale(commerceProduct.status)
                        ? translate('Action.TakeOffSale')
                        : translate('Action.PutOnSale')
                    }>
                    <IconButton
                      aria-label={translate('Action.PutOnSale')}
                      className={cx('showOnRowHover')}
                      color='default'
                      disabled={!eligibleForSale(commerceProduct)}
                      onClick={() => {
                        const toggleOnSale = () =>
                          onToggleSale(
                            commerceProduct.id,
                            onSale(commerceProduct.status)
                              ? ProductStatusType.NUMBER_2
                              : ProductStatusType.NUMBER_4,
                          );

                        if (anySelectedProductsNeedBundlingFeeApproval([commerceProduct])) {
                          onAcceptBundlingFee([commerceProduct], toggleOnSale, true);
                        } else {
                          toggleOnSale();
                        }
                      }}>
                      {onSale(commerceProduct.status) ? <SellIcon /> : <SellOutlinedIcon />}
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item>
                  <Tooltip arrow placement='top' title={translate('Action.Delete')}>
                    <IconButton
                      aria-label={translate('Action.Delete')}
                      className={cx('showOnRowHover')}
                      color='default'
                      onClick={() => onClickArchive(commerceProduct.id)}>
                      <DeleteOutlinedIcon fontSize='large' />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </TableCell>
          </TableRow>
        );
      });
  }, [
    nonDraftCommerceProducts,
    page,
    rowsPerPage,
    classes.row,
    classes.checkboxColumn,
    classes.cellCompact,
    classes.thumbnailContainer,
    classes.moderationLabel,
    classes.infoIcon,
    classes.productIdColumn,
    classes.productId,
    selectedRows,
    cx,
    areVirtualBenefitsEnabled,
    translate,
    isExperienceOwnerFetched,
    shouldShowAppealsLink,
    anchorEl,
    selectedProductId,
    getIconForProductStatus,
    getModerationStatus,
    formatPrice,
    onSale,
    eligibleForSale,
    handleRowSelect,
    handleModerationInfoOpenClose,
    handleViewViolationDetails,
    isRejected,
    onAcceptBundlingFee,
    onToggleSale,
    onClickArchive,
    isRejectedTask,
  ]);

  return (
    <TableContainer>
      <Table padding='normal' size='medium'>
        <TableHead className={classes.tableHeader}>
          <ActionBar
            selectedRows={selectedRows}
            nonDraftCommerceProducts={nonDraftCommerceProducts}
            handleAcceptBundlingFee={handleAcceptBundlingFee}
            onToggleSale={onToggleSale}
            onClickArchive={onClickBulkArchive}
            isProductSaleEnabled={isProductSaleEnabled}
            eligibleForSale={eligibleForSale}
          />
          <TableRow>
            <TableCell className={classes.checkboxColumn}>
              <Checkbox
                checked={isAllSelected()}
                indeterminate={selectedRows.size > 0 && !isAllSelected()}
                onChange={handleSelectAllClick}
                color='secondary'
              />
            </TableCell>
            <TableCell className={cx(classes.mutedContent, classes.catalogItemColumnHead)}>
              {translate('Label.CatalogItem')}
            </TableCell>
            {areVirtualBenefitsEnabled && (
              <TableCell className={cx(classes.mutedContent, classes.virtualBenefitColumnHead)}>
                {translate('Label.VirtualBenefit')}
              </TableCell>
            )}
            <TableCell className={cx(classes.mutedContent, classes.statusColumnHead)}>
              {translate('Label.Status')}
            </TableCell>
            <TableCell className={cx(classes.mutedContent, classes.productIdColumnHead)}>
              {translate('Label.ProductId')}
            </TableCell>
            {areVirtualBenefitsEnabled && (
              <TableCell
                className={cx(classes.mutedContent, classes.bundlingFeeHead)}
                align='right'>
                {translate('Label.BundlingFee')}
              </TableCell>
            )}
            <TableCell className={cx(classes.mutedContent, classes.priceColumnHead)} align='right'>
              {translate('Label.Price')}
            </TableCell>
            <TableCell className={cx(classes.mutedContent, classes.columnCollapsed)} />
          </TableRow>
        </TableHead>
        <TableBody>{renderNonDraftCommerceProducts()}</TableBody>
      </Table>
      <TablePagination
        className={classes.pagination}
        classes={{ toolbar: classes.paginationToolbar }}
        rowsPerPageOptions={[10, 20, 50]}
        count={nonDraftCommerceProducts.length}
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
  );
};

export default withTranslation(CommerceProductsTable, [TranslationNamespace.Commerce]);
