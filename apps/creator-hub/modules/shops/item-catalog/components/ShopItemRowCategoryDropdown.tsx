import { memo, useCallback, useMemo, type SyntheticEvent } from 'react';
import type { Category } from '@rbx/client-shops-api/v1';
import { Badge, Dropdown, Icon, Menu, MenuItem, MenuSeparator } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { noop } from '@modules/monetization-shared/noop';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import { MAX_SHOP_CATEGORIES } from '../../constants';
import type { ShopItem } from '../../types';
import { useCategoryCounts } from '../contexts/CategoryCountsContext';
import { openAddCategoryDialog } from '../dialogs/AddCategoryDialog';
import { openRenameCategoryDialog } from '../dialogs/RenameCategoryDialog';

// Sentinel value distinguishes the "Add category" entry from real category ids.
const ADD_CATEGORY_VALUE = '__add_category__';

// Per-category counts above this cap collapse to "999+" to keep the badge tight.
const MAX_DISPLAYED_COUNT = 999;

const formatCount = (n: number): string =>
  n > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : String(n);

type Props = {
  item: ShopItem;
  availableCategories: readonly Category[];
  onChangeCategory?: (item: ShopItem, nextCategory: Category) => void;
  /** Receives the trimmed new name from the Edit dialog. No-op until wired. */
  onRenameCategory?: (categoryId: string, newName: string) => void;
  /** Receives the trimmed new name and the source row from the Add dialog. No-op until wired. */
  onAddCategory?: (item: ShopItem, name: string) => void;
  /** Locks the dropdown, e.g. while a publish is in flight. */
  disabled?: boolean;
};

type CategoryTrailingProps = {
  category: Category;
  count: number | undefined;
  onEdit: (category: Category) => void;
};

// Radix Select fires selection on pointerup, so we stop pointer + click events
// on the pencil to keep the underlying category from being reselected when the
// user clicks the edit affordance.
const stopMenuSelection = (e: SyntheticEvent) => e.stopPropagation();

const CategoryTrailing = memo(({ category, count, onEdit }: CategoryTrailingProps) => {
  const handleClick = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation();
      onEdit(category);
    },
    [category, onEdit],
  );

  if (count === undefined) {
    return null;
  }

  return (
    <div className='relative flex items-center justify-end'>
      <Badge
        label={formatCount(count)}
        variant='Neutral'
        className='group-hover/category-row:invisible'
      />
      <span
        aria-hidden='true'
        className='absolute inset-0 hidden cursor-pointer items-center justify-center group-hover/category-row:flex'
        onPointerDown={stopMenuSelection}
        onPointerUp={stopMenuSelection}
        onClick={handleClick}>
        <Icon name='icon-regular-pencil' size='Medium' />
      </span>
    </div>
  );
});
CategoryTrailing.displayName = 'CategoryTrailing';

function ShopItemRowCategoryDropdown({
  item,
  availableCategories,
  onChangeCategory,
  onRenameCategory = noop,
  onAddCategory = noop,
  disabled,
}: Props) {
  const { translate } = useTranslation();
  const categoryCounts = useCategoryCounts();

  const isAtCategoryLimit = availableCategories.length >= MAX_SHOP_CATEGORIES;

  const allCategoryNames = useMemo(
    () => availableCategories.map((category) => category.name),
    [availableCategories],
  );

  const handleRenameCategory = useCallback(
    (category: Category) => {
      openRenameCategoryDialog({
        category,
        // Exclude the current category by id (not by name) so the user can keep
        // the original name without the duplicate check tripping on itself.
        existingNames: availableCategories
          .filter((other) => other.id !== category.id)
          .map((other) => other.name),
        onConfirm: (newName) => onRenameCategory(category.id, newName),
      });
    },
    [availableCategories, onRenameCategory],
  );

  const handleAddCategory = useCallback(() => {
    if (isAtCategoryLimit) {
      return;
    }
    openAddCategoryDialog({
      existingNames: allCategoryNames,
      onConfirm: (name) => onAddCategory(item, name),
    });
  }, [isAtCategoryLimit, allCategoryNames, onAddCategory, item]);

  const handleValueChange = useCallback(
    (nextId: string) => {
      if (nextId === ADD_CATEGORY_VALUE) {
        handleAddCategory();
        return;
      }
      const nextCategory = availableCategories.find((category) => category.id === nextId);
      if (nextCategory) {
        onChangeCategory?.(item, nextCategory);
      }
    },
    [availableCategories, item, onChangeCategory, handleAddCategory],
  );

  return (
    <Dropdown
      size='Medium'
      value={item.category.id}
      placeholder={translate('Label.SelectCategory')}
      isDisabled={disabled}
      ariaLabel={translate('Label.AriaLabel.CategoryName', {
        itemName: item.name,
      })}
      className='max-width-[320px]'
      onValueChange={handleValueChange}>
      <Menu className='padding-small'>
        {isAtCategoryLimit ? (
          <Tooltip
            title={translate('Message.MaxCategoriesReached', {
              limit: MAX_SHOP_CATEGORIES.toString(),
            })}
            position='top-start'
            addTriggerSlot>
            <MenuItem
              value={ADD_CATEGORY_VALUE}
              disabled
              leading={<Icon name='icon-filled-plus-small' size='Medium' />}
              title={translate('Action.AddCategory')}
            />
          </Tooltip>
        ) : (
          <MenuItem
            value={ADD_CATEGORY_VALUE}
            leading={<Icon name='icon-filled-plus-small' size='Medium' />}
            title={translate('Action.AddCategory')}
          />
        )}
        <MenuSeparator className='margin-y-[6px]' />
        {availableCategories.map((category) => (
          <MenuItem
            key={category.id}
            value={category.id}
            title={category.name}
            className='group/category-row text-truncate-end'
            trailing={
              <CategoryTrailing
                category={category}
                count={categoryCounts?.get(category.id)}
                onEdit={handleRenameCategory}
              />
            }
          />
        ))}
      </Menu>
    </Dropdown>
  );
}

export default memo(ShopItemRowCategoryDropdown);
