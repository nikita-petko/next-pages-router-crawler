import { type FunctionComponent, useCallback } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import type { UseCategoryManagerReturn } from '../hooks/useCategoryManager';
import type { CategoryFormState, PresetStatus } from '../types';
import CategoryGroup from './CategoryGroup';
import PresetTable from './PresetTable';

type QuickWordsContentProps = {
  categoryManager: UseCategoryManagerReturn;
  overallStatus?: PresetStatus;
  isPublishPending?: boolean;
};

const DEFAULT_MIN_PRESETS = 3;
const DEFAULT_MAX_PRESETS = 10;

type CategoryItemProps = {
  category: CategoryFormState;
  categoryIndex: number;
  minPresetsPerCategory: number;
  maxPresetsPerCategory: number;
  isDisabled?: boolean;
  overrideStatus?: PresetStatus;
  removeCategory: (id: string) => void;
  updateCategoryName: (id: string, name: string) => void;
  addPreset: (categoryId: string) => void;
  removePreset: (categoryId: string, presetId: string) => void;
  updatePresetText: (categoryId: string, presetId: string, text: string) => void;
  reorderPresets: (categoryId: string, presetIds: string[]) => void;
};

const CategoryItem: FunctionComponent<CategoryItemProps> = ({
  category,
  categoryIndex,
  minPresetsPerCategory,
  maxPresetsPerCategory,
  isDisabled,
  overrideStatus,
  removeCategory,
  updateCategoryName,
  addPreset,
  removePreset,
  updatePresetText,
  reorderPresets,
}) => {
  const handleDeleteCategory = useCallback(
    () => removeCategory(category.id),
    [removeCategory, category.id],
  );

  const handleAddPreset = useCallback(() => addPreset(category.id), [addPreset, category.id]);

  const handleDeletePreset = useCallback(
    (presetId: string) => removePreset(category.id, presetId),
    [removePreset, category.id],
  );

  const handleUpdatePresetText = useCallback(
    (presetId: string, text: string) => updatePresetText(category.id, presetId, text),
    [updatePresetText, category.id],
  );

  const handleReorderPresets = useCallback(
    (presetIds: string[]) => reorderPresets(category.id, presetIds),
    [reorderPresets, category.id],
  );

  return (
    <CategoryGroup
      categoryIndex={categoryIndex}
      category={category}
      onNameChange={updateCategoryName}
      isDisabled={isDisabled}
      overrideStatus={overrideStatus}>
      <PresetTable
        presets={category.presets}
        minPresetsPerCategory={minPresetsPerCategory}
        maxPresetsPerCategory={maxPresetsPerCategory}
        onAddPreset={handleAddPreset}
        onDeletePreset={handleDeletePreset}
        onUpdatePresetText={handleUpdatePresetText}
        onReorderPresets={handleReorderPresets}
        onDeleteCategory={handleDeleteCategory}
        canAddPreset={category.presets.length < maxPresetsPerCategory}
        isDisabled={isDisabled}
        overrideStatus={overrideStatus}
      />
    </CategoryGroup>
  );
};

const QuickWordsContent: FunctionComponent<QuickWordsContentProps> = ({
  categoryManager,
  overallStatus,
  isPublishPending,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { settings } = useSettings();
  const isPublishing = overallStatus === 'PUBLISHING' || (isPublishPending ?? false);
  const statusOverride: PresetStatus | undefined = isPublishing ? 'PUBLISHING' : undefined;
  const {
    categories,
    addCategory,
    removeCategory,
    updateCategoryName,
    addPreset,
    removePreset,
    updatePresetText,
    reorderPresets,
    canAddCategory,
  } = categoryManager;

  const minPresetsPerCategory =
    settings.presetChatMinPresetsPerCategory > 0
      ? settings.presetChatMinPresetsPerCategory
      : DEFAULT_MIN_PRESETS;
  const maxPresetsPerCategory =
    settings.presetChatMaxPresetsPerCategory > 0
      ? settings.presetChatMaxPresetsPerCategory
      : DEFAULT_MAX_PRESETS;

  if (categories.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-large padding-y-xxlarge'>
        <div className='flex flex-col items-center text-align-x-center gap-small'>
          <h3 className='text-heading-small margin-none'>
            {tPendingTranslation(
              'No custom Quick Words category yet',
              'Empty state title when no categories exist',
              translationKey('EmptyState.Title', TranslationNamespace.PresetChat),
            )}
          </h3>
          <p className='text-body-large content-default margin-none'>
            {tPendingTranslation(
              'Add custom Quick Words to your in-game chat for players of all ages to coordinate gameplay.',
              'Empty state description explaining what Quick Words does',
              translationKey('EmptyState.Description', TranslationNamespace.PresetChat),
            )}
          </p>
        </div>
        <Button variant='Emphasis' size='Medium' isDisabled={isPublishing} onClick={addCategory}>
          {tPendingTranslation(
            'Add category',
            'Button to add a new preset category',
            translationKey('Action.AddCategory', TranslationNamespace.PresetChat),
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-xlarge'>
      {categories.map((category, index) => (
        <CategoryItem
          key={category.id}
          categoryIndex={index + 1}
          category={category}
          minPresetsPerCategory={minPresetsPerCategory}
          maxPresetsPerCategory={maxPresetsPerCategory}
          isDisabled={isPublishing}
          overrideStatus={statusOverride}
          removeCategory={removeCategory}
          updateCategoryName={updateCategoryName}
          addPreset={addPreset}
          removePreset={removePreset}
          updatePresetText={updatePresetText}
          reorderPresets={reorderPresets}
        />
      ))}
      <Button
        className='self-start'
        variant='Standard'
        size='Medium'
        isDisabled={!canAddCategory || isPublishing}
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
