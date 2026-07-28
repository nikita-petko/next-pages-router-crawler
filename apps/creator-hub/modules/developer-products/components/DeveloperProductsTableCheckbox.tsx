import { memo } from 'react';
import { Checkbox } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  useHeaderSelection,
  useItemSelection,
  useSelectionActions,
} from '@modules/monetization-shared/table-selection/hooks';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import type { DeveloperProductConfig } from '../types';

type HeaderProps = { 'aria-label': string };

export const DeveloperProductsTableHeaderCheckbox = memo((props: HeaderProps) => {
  const { checked, indeterminate, disabled } = useHeaderSelection();
  const actions = useSelectionActions<number, DeveloperProductConfig>();

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
DeveloperProductsTableHeaderCheckbox.displayName = 'DeveloperProductsTableHeaderCheckbox';

type RowProps = DeveloperProductConfig & { 'aria-label': string };

export const DeveloperProductsTableRowCheckbox = memo((props: RowProps) => {
  const { translate } = useTranslation();
  const { 'aria-label': ariaLabel, ...product } = props;
  const { checked, disabled, disabledReason } = useItemSelection(product);
  const actions = useSelectionActions<number, DeveloperProductConfig>();

  const tooltip = disabledReason ? translate('Label.Unavailable') : '';
  return (
    <Tooltip title={tooltip} disabled={!tooltip} addTriggerSlot>
      <Checkbox
        placement='Start'
        color='secondary'
        aria-label={ariaLabel}
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
DeveloperProductsTableRowCheckbox.displayName = 'DeveloperProductsTableRowCheckbox';
