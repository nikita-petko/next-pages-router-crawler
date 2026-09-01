/* oxlint-disable check-file/no-index, oxc/no-barrel-file -- Intentional compound component barrel for the multiselect API. */
import {
  MultiSelect as FoundationBasedMultiSelect,
  multiSelectSizes,
  multiSelectVariants,
} from './FoundationBasedMultiSelect';
import type {
  TMultiSelectMenuAlign,
  TMultiSelectProps,
  TMultiSelectSize,
  TMultiSelectValue,
  TMultiSelectVariant,
} from './FoundationBasedMultiSelect';
import {
  Menu,
  MenuItem,
  MenuLabel,
  MenuSection,
  MenuSeparator,
} from './FoundationBasedMultiSelectMenu';
import type {
  TMenuItemProps,
  TMenuLabelProps,
  TMenuProps,
  TMenuSectionProps,
  TMenuSeparatorProps,
} from './FoundationBasedMultiSelectMenu';

export const MultiSelect = Object.assign(FoundationBasedMultiSelect, {
  Menu,
  MenuItem,
  MenuLabel,
  MenuSection,
  MenuSeparator,
});

export { multiSelectSizes, multiSelectVariants };

export type {
  TMenuItemProps,
  TMenuLabelProps,
  TMenuProps,
  TMenuSectionProps,
  TMenuSeparatorProps,
  TMultiSelectMenuAlign,
  TMultiSelectProps,
  TMultiSelectSize,
  TMultiSelectValue,
  TMultiSelectVariant,
};
