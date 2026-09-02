import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import type { CommerceItemModel } from '@modules/clients/commerce';
import type { Merchant } from '../../configs/merchantConfigs';
import { merchantConfigs } from '../../configs/merchantConfigs';
import CommerceItemsTable from '../CommerceItemsTable';

interface CommerceItemsTableProps {
  merchant: Merchant;
  commerceItems: CommerceItemModel[];
  createButton: React.ReactNode;
  importButton: React.ReactNode;
  showCheckboxes?: boolean;
  catalogSelectedCommerceItemIds?: string[];
  setCatalogSelectedCommerceItemIds?: React.Dispatch<React.SetStateAction<string[]>>;
  updateCatalogSelectedCommerceItemIds?: boolean;
}

/**
 * View of commerce items for a specific merchant (title, import button, selectable table).
 */
const CommerceItemsTableView = ({
  merchant,
  commerceItems,
  createButton,
  importButton,
  showCheckboxes,
  catalogSelectedCommerceItemIds,
  setCatalogSelectedCommerceItemIds,
  updateCatalogSelectedCommerceItemIds,
}: CommerceItemsTableProps) => {
  const { translate } = useTranslation();
  const merchantDetail = merchantConfigs[merchant];

  return (
    <Grid container gap={2} justifyContent='flex-start' alignItems='stretch' height='fit-content'>
      <Grid container direction='row' justifyContent='space-between' alignItems='center'>
        <Typography variant='h4'>
          {translate(merchantDetail.translationKeys.catalogHeading)}
        </Typography>
        <Grid>
          {createButton}
          {importButton}
        </Grid>
      </Grid>
      <CommerceItemsTable
        showCheckboxes={showCheckboxes}
        commerceItems={commerceItems}
        catalogSelectedCommerceItemIds={catalogSelectedCommerceItemIds}
        setCatalogSelectedCommerceItemIds={setCatalogSelectedCommerceItemIds}
        updateCatalogSelectedCommerceItemIds={updateCatalogSelectedCommerceItemIds}
      />
    </Grid>
  );
};

export default CommerceItemsTableView;
