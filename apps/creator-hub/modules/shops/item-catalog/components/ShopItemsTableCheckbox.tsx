import { memo } from 'react';
import { Checkbox } from '@rbx/foundation-ui';
import {
  useHeaderSelection,
  useItemSelection,
  useSelectionActions,
} from '@modules/monetization-shared/table-selection/hooks';
import type { ShopItem } from '../../types';

type HeaderProps = {
  'aria-label': string;
};

export const ShopItemsTableHeaderCheckbox = memo((props: HeaderProps) => {
  const { checked, indeterminate, disabled } = useHeaderSelection();
  const actions = useSelectionActions<string, ShopItem>();

  return (
    <Checkbox
      placement='Start'
      color='secondary'
      aria-label={props['aria-label']}
      isChecked={indeterminate ? 'indeterminate' : checked}
      isDisabled={disabled}
      size='Medium'
      onCheckedChange={(isChecked) =>
        disabled ? null : actions.toggleBulk(indeterminate ? false : !!isChecked)
      }
    />
  );
});
ShopItemsTableHeaderCheckbox.displayName = 'ShopItemsTableHeaderCheckbox';

type RowProps = {
  item: ShopItem;
  'aria-label': string;
};

export const ShopItemsTableRowCheckbox = memo(({ item, ...props }: RowProps) => {
  const { checked, disabled } = useItemSelection(item);
  const actions = useSelectionActions<string, ShopItem>();

  return (
    <Checkbox
      placement='Start'
      color='secondary'
      aria-label={props['aria-label']}
      isChecked={checked}
      isDisabled={disabled}
      size='Medium'
      onCheckedChange={(isChecked) => (disabled ? null : actions.toggleItem(item, !!isChecked))}
    />
  );
});
ShopItemsTableRowCheckbox.displayName = 'ShopItemsTableRowCheckbox';
