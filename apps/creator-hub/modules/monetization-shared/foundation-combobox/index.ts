/* oxlint-disable check-file/no-index, oxc/no-barrel-file -- Intentional compound component barrel for the combobox API. */
import {
  Combobox as FoundationBasedCombobox,
  comboboxSizes,
  comboboxVariants,
} from './FoundationBasedCombobox';
import type {
  TComboboxMenuAlign,
  TComboboxProps,
  TComboboxSize,
  TComboboxVariant,
} from './FoundationBasedCombobox';
import {
  Menu,
  MenuItem,
  MenuLabel,
  MenuSection,
  MenuSeparator,
} from './FoundationBasedComboboxMenu';
import type {
  TMenuItemProps,
  TMenuLabelProps,
  TMenuProps,
  TMenuSectionProps,
  TMenuSeparatorProps,
} from './FoundationBasedComboboxMenu';

export const Combobox = Object.assign(FoundationBasedCombobox, {
  Menu,
  MenuItem,
  MenuLabel,
  MenuSection,
  MenuSeparator,
});

export { comboboxSizes, comboboxVariants };

export type {
  TComboboxMenuAlign,
  TComboboxProps,
  TComboboxSize,
  TComboboxVariant,
  TMenuItemProps,
  TMenuLabelProps,
  TMenuProps,
  TMenuSectionProps,
  TMenuSeparatorProps,
};
