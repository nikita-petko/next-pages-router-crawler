import React from 'react';
import { TextField } from '@rbx/ui';
import { InventorySelectionType } from '../../constants';

interface BundlingQuantitySelectionProps {
  commerceProductId: string;
  inventoryType: Map<string, string>;
  quantityMap: Map<string, number>;
  setQuantity: React.Dispatch<React.SetStateAction<Map<string, number>>>;
  hasGrantables: boolean;
}

const BundlingQuantitySelection: React.FC<BundlingQuantitySelectionProps> = ({
  commerceProductId,
  inventoryType,
  quantityMap,
  setQuantity,
  hasGrantables,
}) => {
  if (!hasGrantables) {
    return null;
  }

  return (
    <TextField
      variant='outlined'
      id='quantity'
      disabled={inventoryType.get(commerceProductId) !== InventorySelectionType.FixedQuantity}
      value={(() => {
        const inventoryTypeValue = inventoryType.get(commerceProductId);
        if (inventoryTypeValue === InventorySelectionType.FixedQuantity) {
          return quantityMap.has(commerceProductId) ? quantityMap.get(commerceProductId) : 0;
        }
        return 'N/A';
      })()}
      label={undefined}
      onChange={(event) => {
        const qty = parseInt(event.target.value, 10);
        if (!Number.isNaN(qty)) {
          setQuantity((prev) => new Map(prev).set(commerceProductId, qty));
        }
      }}
    />
  );
};

export default BundlingQuantitySelection;
