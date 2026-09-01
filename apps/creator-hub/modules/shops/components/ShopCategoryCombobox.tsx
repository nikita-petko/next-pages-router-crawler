import { useCallback } from 'react';
import type { Category } from '@rbx/client-shops-api/v1';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Combobox } from '@modules/monetization-shared/foundation-combobox';
import type { TComboboxProps } from '@modules/monetization-shared/foundation-combobox';
import { MAX_CATEGORY_NAME_LENGTH } from '../constants';
import { findCategoryByName } from '../utils/categorySelection';

/** Sentinel value for the inline "Add category" combobox option. */
const ADD_CATEGORY_VALUE = '__add-category__';

const ADD_CATEGORY_ICON = <Icon name='icon-filled-plus-large' size='Medium' />;

type FilterOption = NonNullable<TComboboxProps['filterOption']>;

type ShopCategoryComboboxProps = Omit<TComboboxProps, 'children' | 'filterOption' | 'maxLength'> & {
  availableCategories: readonly Category[];
  /** Receives the trimmed input when "Add category" is chosen. */
  onAddCategorySelect: (trimmedName: string) => void;
  /** Hides the inline "Add category" option (e.g. at the category cap). */
  isAddCategoryHidden?: boolean;
};

/**
 * Shared category combobox for shop flows: lists the shop's existing categories
 * plus an inline "Add category" option for the typed name. Typeahead filtering
 * is derived from `availableCategories`; hint/error/disable behavior is left to
 * the consumer so each flow can surface its own cap and helper messaging.
 */
export function ShopCategoryCombobox({
  availableCategories,
  onAddCategorySelect,
  isAddCategoryHidden,
  value = '',
  ...comboboxProps
}: ShopCategoryComboboxProps) {
  const { translate } = useTranslation();

  const filterOption = useCallback<FilterOption>(
    (inputValue, option) => {
      if (option.value === ADD_CATEGORY_VALUE) {
        return inputValue.trim().length > 0 && !findCategoryByName(availableCategories, inputValue);
      }
      const input = inputValue.trim().toLowerCase();
      if (input.length === 0) {
        return true;
      }
      return option.title.toLowerCase().includes(input);
    },
    [availableCategories],
  );

  const isAddCategoryVisible =
    !isAddCategoryHidden && filterOption(value, { value: ADD_CATEGORY_VALUE, title: '' });

  // Skip the menu entirely when nothing matches so doesn't render an empty bar.
  const hasVisibleOptions =
    isAddCategoryVisible ||
    availableCategories.some((category) =>
      filterOption(value, { value: category.id, title: category.name }),
    );

  return (
    <Combobox
      {...comboboxProps}
      value={value}
      filterOption={filterOption}
      variant='Standard'
      maxLength={MAX_CATEGORY_NAME_LENGTH}>
      {hasVisibleOptions && (
        <Combobox.Menu>
          <Combobox.MenuSection>
            {availableCategories.map((category) => (
              <Combobox.MenuItem key={category.id} value={category.id} title={category.name} />
            ))}
            {isAddCategoryVisible && (
              <Combobox.MenuItem
                value={ADD_CATEGORY_VALUE}
                title={translate('Action.AddCategory')}
                description={translate('Description.CreateCategory', {
                  categoryName: value.trim(),
                })}
                leading={ADD_CATEGORY_ICON}
                onSelect={() => onAddCategorySelect(value.trim())}
              />
            )}
          </Combobox.MenuSection>
        </Combobox.Menu>
      )}
    </Combobox>
  );
}
