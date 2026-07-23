import React, { FunctionComponent, useMemo } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { MenuItem, Select } from '@rbx/ui';
import { CommerceTranslationKeys, InventorySelectionType } from '../../constants';

interface InventoryTypeSelectionProps {
  inventoryType: Map<string, string>;
  setInventoryType: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  commerceProductId: string;
  hasGrantables?: boolean;
}

const InventoryTypeSelection: FunctionComponent<InventoryTypeSelectionProps> = ({
  inventoryType,
  setInventoryType,
  commerceProductId,
  hasGrantables,
}) => {
  const { translate } = useTranslation();

  const inventoryTypeValue = useMemo(
    () => inventoryType.get(commerceProductId),
    [inventoryType, commerceProductId],
  );

  if (!hasGrantables || inventoryTypeValue === undefined) {
    return null;
  }

  return (
    <Select
      value={inventoryTypeValue}
      key={commerceProductId}
      onChange={(x) => {
        setInventoryType((prev) => new Map(prev).set(commerceProductId, x.target.value));
      }}>
      <MenuItem value={InventorySelectionType.FixedQuantity}>
        {translate(CommerceTranslationKeys.FixedQuantity)}
      </MenuItem>
      <MenuItem value={InventorySelectionType.MerchOnDemand}>
        {translate(CommerceTranslationKeys.MerchOnDemand)}
      </MenuItem>
      <MenuItem value={InventorySelectionType.PreOrder}>
        {translate(CommerceTranslationKeys.PreOrder)}
      </MenuItem>
    </Select>
  );
};

export default withTranslation(InventoryTypeSelection, [TranslationNamespace.Commerce]);
