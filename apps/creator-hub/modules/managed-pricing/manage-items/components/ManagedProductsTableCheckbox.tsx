import { memo } from 'react';
import { Checkbox } from '@rbx/foundation-ui';
import {
  useSelectionActions,
  useHeaderSelection,
  useItemSelection,
} from '@modules/monetization-shared/table-selection/hooks';
import type { ManagedProduct } from '../types';

type HeaderProps = {
  'aria-label': string;
};

export const ManagedProductsTableHeaderCheckbox = memo((props: HeaderProps) => {
  const { checked, indeterminate, disabled } = useHeaderSelection<string, ManagedProduct>();
  const actions = useSelectionActions<string, ManagedProduct>();

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
ManagedProductsTableHeaderCheckbox.displayName = 'ManagedProductsTableHeaderCheckbox';

type RowProps = {
  product: ManagedProduct;
  'aria-label': string;
};

export const ManagedProductsTableRowCheckbox = memo(({ product, ...props }: RowProps) => {
  const { checked, disabled } = useItemSelection(product);
  const actions = useSelectionActions<string, ManagedProduct>();

  return (
    <Checkbox
      placement='Start'
      color='secondary'
      aria-label={props['aria-label']}
      isChecked={checked}
      isDisabled={disabled}
      size='Medium'
      onCheckedChange={(isChecked) => (disabled ? null : actions.toggleItem(product, !!isChecked))}
    />
  );
});
ManagedProductsTableRowCheckbox.displayName = 'ManagedProductsTableRowCheckbox';
