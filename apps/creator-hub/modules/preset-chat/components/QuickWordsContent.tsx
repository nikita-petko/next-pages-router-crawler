import { type FunctionComponent, useCallback } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useCategoryManager from '../hooks/useCategoryManager';
import type { CategoryFormState } from '../types';
import CategoryGroup from './CategoryGroup';
import PresetTable from './PresetTable';

const noop = () => {};

type CategoryItemProps = {
  category: CategoryFormState;
  categoryIndex: number;
  maxPresetsPerCategory: number;
  removeCategory: (id: string) => void;
  updateCategoryName: (id: string, name: string) => void;
};

const CategoryItem: FunctionComponent<CategoryItemProps> = ({
  category,
  categoryIndex,
  maxPresetsPerCategory,
  removeCategory,
  updateCategoryName,
}) => {
  const handleDeleteCategory = useCallback(
    () => removeCategory(category.id),
    [removeCategory, category.id],
  );

  return (
    <CategoryGroup
      categoryIndex={categoryIndex}
      category={category}
      onNameChange={updateCategoryName}>
      <PresetTable
        onAddPreset={noop}
        onDeleteCategory={handleDeleteCategory}
        canAddPreset={category.presets.length < maxPresetsPerCategory}
      />
    </CategoryGroup>
  );
};

const QuickWordsContent: FunctionComponent = () => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { settings } = useSettings();
  const { categories, addCategory, removeCategory, updateCategoryName, canAddCategory } =
    useCategoryManager();
  const maxPresetsPerCategory =
    settings.presetChatMaxPresetsPerCategory > 0 ? settings.presetChatMaxPresetsPerCategory : 10;

  return (
    <div className='flex flex-col gap-xlarge'>
      {categories.map((category, index) => (
        <CategoryItem
          key={category.id}
          categoryIndex={index + 1}
          category={category}
          maxPresetsPerCategory={maxPresetsPerCategory}
          removeCategory={removeCategory}
          updateCategoryName={updateCategoryName}
        />
      ))}
      <Button
        className='self-start'
        variant='Standard'
        size='Medium'
        isDisabled={!canAddCategory}
        onClick={addCategory}>
        {tPendingTranslation(
          'Add category',
          'Button to add a new preset category',
          translationKey('Action.AddCategory', TranslationNamespace.PresetChat),
        )}
      </Button>
    </div>
  );
};

export default QuickWordsContent;
