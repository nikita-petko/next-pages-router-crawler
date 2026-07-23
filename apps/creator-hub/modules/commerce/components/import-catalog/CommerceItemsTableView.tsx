import React, { FunctionComponent, ReactNode } from 'react';
import { Grid, Typography } from '@rbx/ui';
import type { CommerceItemModel } from '@modules/clients/commerce';
import { useTranslation } from '@rbx/intl';
import { Merchant, merchantConfigs } from '../../configs/merchantConfigs';
import CommerceItemsTable from '../CommerceItemsTable';

interface CommerceItemsTableProps {
  merchant: Merchant;
  commerceItems: CommerceItemModel[];
  createButton: ReactNode;
  importButton: ReactNode;
  showCheckboxes?: boolean;
  showArchiveButtons?: boolean;
  onClickArchive?: (commerceItemIds: string[]) => void;
  alert?: ReactNode;
  catalogSelectedCommerceItemIds?: string[];
  setCatalogSelectedCommerceItemIds?: React.Dispatch<React.SetStateAction<string[]>>;
  updateCatalogSelectedCommerceItemIds?: boolean;
}

/**
 * View of commerce items for a specific merchant (title, import button, selectable table).
 */
const CommerceItemsTableView: FunctionComponent<CommerceItemsTableProps> = ({
  merchant,
  commerceItems,
  createButton,
  importButton,
  showCheckboxes,
  showArchiveButtons,
  onClickArchive,
  alert,
  catalogSelectedCommerceItemIds,
  setCatalogSelectedCommerceItemIds,
  updateCatalogSelectedCommerceItemIds,
}) => {
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
      {alert}
      <CommerceItemsTable
        showCheckboxes={showCheckboxes}
        showArchiveButtons={showArchiveButtons}
        commerceItems={commerceItems}
        onClickArchive={onClickArchive}
        catalogSelectedCommerceItemIds={catalogSelectedCommerceItemIds}
        setCatalogSelectedCommerceItemIds={setCatalogSelectedCommerceItemIds}
        updateCatalogSelectedCommerceItemIds={updateCatalogSelectedCommerceItemIds}
      />
    </Grid>
  );
};

export default CommerceItemsTableView;
