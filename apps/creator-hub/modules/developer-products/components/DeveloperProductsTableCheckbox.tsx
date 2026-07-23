import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Checkbox } from '@rbx/foundation-ui';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import { useDeveloperProductSelectionContext } from '../contexts/DeveloperProductsSelectionContext';
import type { DeveloperProductConfig } from '../types';

type Props = { 'aria-label': string };

export const DeveloperProductsTableHeaderCheckbox = memo((props: Props) => {
  const {
    numSelectableOnPage,
    numSelectedOnPage,
    isDisabled,
    isBulkSelectionDisabled,
    isLimitReached,
    toggleBulkSelection,
  } = useDeveloperProductSelectionContext();

  const checked = numSelectedOnPage > 0;
  // Note: checkbox shows indeterminate state strictly based on displayed page.
  const indeterminate = numSelectedOnPage > 0 && numSelectedOnPage < numSelectableOnPage;
  // TODO(jeminpark): refactor this for clarity when migrating to store-based selectors
  const disabled = isDisabled || isBulkSelectionDisabled || (!checked && isLimitReached);

  return (
    <Checkbox
      placement='Start'
      color='secondary'
      aria-label={props['aria-label']}
      isChecked={indeterminate ? 'indeterminate' : checked}
      isDisabled={disabled}
      size='Medium'
      onCheckedChange={(isChecked) =>
        disabled ? null : toggleBulkSelection(indeterminate ? false : !!isChecked)
      }
    />
  );
});
DeveloperProductsTableHeaderCheckbox.displayName = 'DeveloperProductsTableHeaderCheckbox';

export const DeveloperProductsTableRowCheckbox = memo((props: DeveloperProductConfig & Props) => {
  const { translate } = useTranslation();
  const { selectedProducts, isSelectable, isDisabled, isLimitReached, toggleProductSelection } =
    useDeveloperProductSelectionContext();

  const checked = selectedProducts.has(props.productId);
  const isProductSelectable = isSelectable(props);
  const disabled = isDisabled || !isProductSelectable || (!checked && isLimitReached);

  const tooltip = !isProductSelectable ? translate('Label.Unavailable') : '';
  return (
    <Tooltip title={tooltip} disabled={!tooltip} addTriggerSlot delayDurationMs={0}>
      <Checkbox
        placement='Start'
        color='secondary'
        aria-label={props['aria-label']}
        isChecked={checked}
        isDisabled={disabled}
        size='Medium'
        onCheckedChange={(isChecked) =>
          disabled ? null : toggleProductSelection(props, !!isChecked)
        }
      />
    </Tooltip>
  );
});
DeveloperProductsTableRowCheckbox.displayName = 'DeveloperProductsTableRowCheckbox';
