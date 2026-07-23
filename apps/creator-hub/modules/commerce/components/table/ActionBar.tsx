import { useCallback, useMemo } from 'react';
import { ProductStatusType } from '@rbx/client-commerce-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Paper,
  Typography,
  makeStyles,
  DeleteOutlinedIcon,
  SellOutlinedIcon,
} from '@rbx/ui';
import type { CommerceProductModel } from '@modules/clients/commerce';
import { anySelectedProductsNeedBundlingFeeApproval, isProductApproved } from '../../utils/utils';

const useStyles = makeStyles()((theme) => ({
  actionBar: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1),
    gap: theme.spacing(1),
    backgroundColor: theme.palette.surface[0],
    position: 'absolute',
    top: 0,
    left: theme.spacing(6),
    right: 0,
    zIndex: 1,
  },
  actionBarText: {
    marginRight: theme.spacing(2),
  },
}));

interface ActionBarProps {
  selectedRows: Set<string>;
  nonDraftCommerceProducts: CommerceProductModel[];
  onToggleSale: (commerceItemId: string, newStatus: ProductStatusType) => void;
  onClickArchive: (commerceProductIds: string[]) => void;
  isProductSaleEnabled: boolean;
  handleAcceptBundlingFee: (callbackFn: () => void) => void;
  eligibleForSale: (commerceProduct: CommerceProductModel) => boolean;
}

const ActionBar = ({
  selectedRows,
  nonDraftCommerceProducts,
  onToggleSale,
  onClickArchive,
  isProductSaleEnabled,
  handleAcceptBundlingFee,
  eligibleForSale,
}: ActionBarProps) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  const selectedProducts = useMemo(
    () => nonDraftCommerceProducts.filter((product) => selectedRows.has(product.id)),
    [nonDraftCommerceProducts, selectedRows],
  );

  const areAllSelectedApprovedAndEligibleForSale = useMemo(
    () =>
      selectedProducts.every((product) => isProductApproved(product) && eligibleForSale(product)),
    [eligibleForSale, selectedProducts],
  );

  const handleBulkToggleSale = useCallback(() => {
    const callbackFn = () =>
      selectedProducts.forEach((product) => {
        if (!isProductSaleEnabled || !isProductApproved(product)) {
          return;
        }
        onToggleSale(product.id, ProductStatusType.NUMBER_4);
      });

    if (anySelectedProductsNeedBundlingFeeApproval(selectedProducts)) {
      handleAcceptBundlingFee(callbackFn);
      return;
    }
    callbackFn();
  }, [selectedProducts, isProductSaleEnabled, onToggleSale, handleAcceptBundlingFee]);

  const handleBulkArchive = useCallback(() => {
    onClickArchive(Array.from(selectedRows));
  }, [onClickArchive, selectedRows]);

  if (selectedRows.size === 0) {
    return null;
  }

  return (
    <Paper className={classes.actionBar}>
      <Typography className={classes.actionBarText}>
        {translate('Label.NSelected', { n: selectedRows.size.toString() })}
      </Typography>
      <Button
        variant='text'
        color='secondary'
        startIcon={<SellOutlinedIcon />}
        onClick={handleBulkToggleSale}
        disabled={!areAllSelectedApprovedAndEligibleForSale}>
        {translate('Action.PutOnSale')}
      </Button>
      <Button
        variant='text'
        color='secondary'
        startIcon={<DeleteOutlinedIcon />}
        onClick={handleBulkArchive}>
        {translate('Action.Delete')}
      </Button>
    </Paper>
  );
};

export default ActionBar;
