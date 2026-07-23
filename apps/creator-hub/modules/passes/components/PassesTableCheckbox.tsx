import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Checkbox } from '@rbx/foundation-ui';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import { usePassesSelectionContext } from './PassesSelectionContext';
import type { GamePass } from '../types';

type Props = { 'aria-label': string };

export const PassesTableHeaderCheckbox = memo((props: Props) => {
  const { numSelected, numSelectable, isDisabled, isBulkSelectionDisabled, toggleBulkSelection } =
    usePassesSelectionContext();

  const checked = numSelected > 0;
  const indeterminate = numSelected > 0 && numSelected < numSelectable;
  const disabled = isDisabled || isBulkSelectionDisabled;

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
PassesTableHeaderCheckbox.displayName = 'PassesTableHeaderCheckbox';

export const PassesTableRowCheckbox = memo((props: GamePass & Props) => {
  const { translate } = useTranslation();
  const { selectedPasses, isSelectable, isDisabled, togglePassSelection } =
    usePassesSelectionContext();

  const checked = selectedPasses.has(props.passId);
  const isPassSelectable = isSelectable(props);
  const disabled = isDisabled || !isPassSelectable;

  const tooltip = !isPassSelectable ? translate('Label.Unavailable') : '';
  return (
    <Tooltip title={tooltip} disabled={!tooltip} addTriggerSlot delayDurationMs={0}>
      <Checkbox
        placement='Start'
        color='secondary'
        aria-label={props['aria-label']}
        isChecked={checked}
        isDisabled={disabled}
        size='Medium'
        onCheckedChange={(isChecked) => (disabled ? null : togglePassSelection(props, !!isChecked))}
      />
    </Tooltip>
  );
});
PassesTableRowCheckbox.displayName = 'PassesTableRowCheckbox';
