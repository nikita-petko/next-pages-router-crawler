import { memo } from 'react';
import { Checkbox } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  useSelectionActions,
  useHeaderSelection,
  useItemSelection,
} from '@modules/monetization-shared/table-selection/hooks';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import { ITEM_IN_PRICE_TEST_REASON, type ManagedProduct } from '../../types';

type HeaderProps = {
  'aria-label': string;
};

export const ManagedProductsTableHeaderCheckbox = memo((props: HeaderProps) => {
  const { checked, indeterminate, disabled } = useHeaderSelection();
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
  const { translate } = useTranslation();
  const { checked, disabled, disabledReason } = useItemSelection(product);
  const actions = useSelectionActions<string, ManagedProduct>();

  const tooltipTitle = disabledReason ? translate('Label.Unavailable') : '';
  const tooltipDescription =
    disabledReason === ITEM_IN_PRICE_TEST_REASON
      ? translate('Message.SelectionDisabled.ItemInPriceTest' /* TranslationNamespace.Creations */)
      : '';

  return (
    <Tooltip
      title={tooltipTitle}
      description={tooltipDescription}
      disabled={!tooltipTitle}
      position='top-start'
      addTriggerSlot>
      <Checkbox
        placement='Start'
        color='secondary'
        aria-label={props['aria-label']}
        isChecked={checked}
        isDisabled={disabled}
        size='Medium'
        onCheckedChange={(isChecked) =>
          disabled ? null : actions.toggleItem(product, !!isChecked)
        }
      />
    </Tooltip>
  );
});
ManagedProductsTableRowCheckbox.displayName = 'ManagedProductsTableRowCheckbox';
