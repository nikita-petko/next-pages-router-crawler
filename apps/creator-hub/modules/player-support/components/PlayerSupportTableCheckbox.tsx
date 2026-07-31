import { memo, type SyntheticEvent } from 'react';
import { Checkbox } from '@rbx/foundation-ui';
import type { CreatorTicketSummary } from '@modules/clients/creatorCommunication';
import {
  useHeaderSelection,
  useItemSelection,
  useSelectionActions,
} from '@modules/monetization-shared/table-selection/hooks';

const stopPropagation = (event: SyntheticEvent) => {
  event.stopPropagation();
};

interface HeaderCheckboxProps {
  ariaLabel: string;
  isDisabled: boolean;
  label?: string;
}

export const PlayerSupportTableHeaderCheckbox = memo(
  ({ ariaLabel, isDisabled, label }: HeaderCheckboxProps) => {
    const { checked, indeterminate, disabled } = useHeaderSelection<string, CreatorTicketSummary>();
    const { toggleBulk } = useSelectionActions<string, CreatorTicketSummary>();
    const isSelectionDisabled = disabled || isDisabled;
    const accessibleProps = label ? { label } : { 'aria-label': ariaLabel };

    return (
      <Checkbox
        {...accessibleProps}
        placement='Start'
        size='Small'
        isChecked={indeterminate ? 'indeterminate' : checked}
        isDisabled={isSelectionDisabled}
        onCheckedChange={(isChecked) => {
          if (!isSelectionDisabled) {
            toggleBulk(indeterminate ? false : Boolean(isChecked));
          }
        }}
      />
    );
  },
);
PlayerSupportTableHeaderCheckbox.displayName = 'PlayerSupportTableHeaderCheckbox';

interface RowCheckboxProps {
  ticket: CreatorTicketSummary;
  ariaLabel: string;
  isDisabled: boolean;
}

export const PlayerSupportTableRowCheckbox = memo(
  ({ ticket, ariaLabel, isDisabled }: RowCheckboxProps) => {
    const { checked, disabled } = useItemSelection<string, CreatorTicketSummary>(ticket);
    const { toggleItem } = useSelectionActions<string, CreatorTicketSummary>();
    const isSelectionDisabled = disabled || isDisabled;

    return (
      <span onClick={stopPropagation} onKeyDown={stopPropagation} role='presentation'>
        <Checkbox
          placement='Start'
          size='Small'
          aria-label={ariaLabel}
          isChecked={checked}
          isDisabled={isSelectionDisabled}
          onCheckedChange={(isChecked) => {
            if (!isSelectionDisabled) {
              toggleItem(ticket, Boolean(isChecked));
            }
          }}
        />
      </span>
    );
  },
);
PlayerSupportTableRowCheckbox.displayName = 'PlayerSupportTableRowCheckbox';
