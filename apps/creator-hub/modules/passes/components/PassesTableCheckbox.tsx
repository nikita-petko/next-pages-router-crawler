import { memo } from 'react';
import { Checkbox } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  useHeaderSelection,
  useItemSelection,
  useSelectionActions,
} from '@modules/monetization-shared/table-selection/hooks';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import type { GamePass } from '../types';

type HeaderProps = { 'aria-label': string };

export const PassesTableHeaderCheckbox = memo((props: HeaderProps) => {
  const { checked, indeterminate, disabled } = useHeaderSelection();
  const actions = useSelectionActions<number, GamePass>();

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
PassesTableHeaderCheckbox.displayName = 'PassesTableHeaderCheckbox';

type RowProps = GamePass & { 'aria-label': string };

export const PassesTableRowCheckbox = memo((props: RowProps) => {
  const { translate } = useTranslation();
  const { 'aria-label': ariaLabel, ...pass } = props;
  const { checked, disabled, disabledReason } = useItemSelection(pass);
  const actions = useSelectionActions<number, GamePass>();

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
        onCheckedChange={(isChecked) => (disabled ? null : actions.toggleItem(pass, !!isChecked))}
      />
    </Tooltip>
  );
});
PassesTableRowCheckbox.displayName = 'PassesTableRowCheckbox';
