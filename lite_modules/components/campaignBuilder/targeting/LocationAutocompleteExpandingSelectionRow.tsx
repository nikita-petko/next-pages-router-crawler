import { Checkbox, Icon } from '@rbx/foundation-ui';
import React from 'react';

import { CheckboxState, RowType } from '@constants/locationAutocomplete';

interface LocationSelectionCheckboxProps {
  checkboxState: CheckboxState;
  rowType: RowType;
  title: string;
}

interface LocationExpandToggleProps {
  isExpandable: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Leading accessory of a location option row. Foundation owns the option shell, so the
 * checkbox is presentational: the surrounding `AutocompleteOption` handles the toggle.
 * Country rows are indented to show that they sit under their region.
 */
export const LocationSelectionCheckbox = ({
  checkboxState,
  rowType,
  title,
}: LocationSelectionCheckboxProps) => (
  <div className={rowType === RowType.COUNTRY ? 'margin-left-large' : undefined}>
    <Checkbox
      aria-label={title}
      isChecked={
        checkboxState === CheckboxState.PARTIAL
          ? 'indeterminate'
          : checkboxState === CheckboxState.CHECKED
      }
      placement='Start'
      size='XSmall'
    />
  </div>
);

/**
 * Trailing accessory of a region option row. Clicking anywhere on a Foundation
 * `AutocompleteOption` selects it, so expanding must swallow the event instead of
 * letting it reach the option. Rows without children still render this component (as
 * nothing) because supplying a trailing accessory is what suppresses Foundation's own
 * check indicator, which the row checkbox already stands in for.
 */
export const LocationExpandToggle = ({
  isExpandable,
  isExpanded,
  onToggle,
}: LocationExpandToggleProps) => {
  const handleToggle = (event: React.KeyboardEvent | React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    onToggle();
  };

  if (!isExpandable) {
    return null;
  }

  return (
    <div
      aria-expanded={isExpanded}
      className='flex items-center'
      onClick={handleToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          handleToggle(event);
        }
      }}
      role='button'
      tabIndex={0}>
      {isExpanded ? (
        <Icon data-testid='expandLessIcon' name='icon-regular-chevron-small-up' size='Medium' />
      ) : (
        <Icon data-testid='expandMoreIcon' name='icon-regular-chevron-small-down' size='Medium' />
      )}
    </div>
  );
};
