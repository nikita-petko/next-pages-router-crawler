import { useCallback, useState } from 'react';
import { DefaultPresetsPerCategory, MaxCustomCategories } from '../constants/presetChatConstants';
import type { CategoryFormState, CategoryGroupResponse, Preset, PresetStatus } from '../types';

const createEmptyPresets = (count: number): Preset[] =>
  Array.from({ length: count }, () => ({
    id: crypto.randomUUID(),
    text: '',
    state: 'DRAFT' as const,
  }));

function mapCategoryGroupsToFormState(
  categoryGroups: CategoryGroupResponse[],
  overallStatus?: PresetStatus,
): CategoryFormState[] {
  return categoryGroups.flatMap((group) =>
    group.categories
      .filter((category) => !(overallStatus === 'ROBLOX_DEFAULT' && category.name === 'General'))
      .map((category) => ({
        id: category.id,
        name: category.name,
        state: category.state,
        isNew: false,
        presets: category.presets.map((preset) => ({
          id: preset.id,
          text: preset.value,
          state: preset.state,
        })),
      })),
  );
}

export type UseCategoryManagerReturn = {
  categories: CategoryFormState[];
  addCategory: () => void;
  removeCategory: (id: string) => void;
  updateCategoryName: (id: string, name: string) => void;
  addPreset: (categoryId: string) => void;
  removePreset: (categoryId: string, presetId: string) => void;
  updatePresetText: (categoryId: string, presetId: string, text: string) => void;
  reorderPresets: (categoryId: string, presetIds: string[]) => void;
  canAddCategory: boolean;
};

const useCategoryManager = (
  initialCategoryGroups?: CategoryGroupResponse[],
  overallStatus?: PresetStatus,
): UseCategoryManagerReturn => {
  const [categories, setCategories] = useState<CategoryFormState[]>(() =>
    initialCategoryGroups ? mapCategoryGroupsToFormState(initialCategoryGroups, overallStatus) : [],
  );

  const addCategory = useCallback(() => {
    setCategories((prev) => {
      if (prev.length >= MaxCustomCategories) {
        return prev;
      }
      const newCategory: CategoryFormState = {
        id: crypto.randomUUID(),
        name: '',
        presets: createEmptyPresets(DefaultPresetsPerCategory),
        state: 'DRAFT',
        isNew: true,
      };
      return [...prev, newCategory];
    });
  }, []);

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((category) => category.id !== id));
  }, []);

  const updateCategoryName = useCallback((id: string, name: string) => {
    setCategories((prev) =>
      prev.map((category) => (category.id === id ? { ...category, name } : category)),
    );
  }, []);

  const addPreset = useCallback((categoryId: string) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }
        const newPreset: Preset = {
          id: crypto.randomUUID(),
          text: '',
          state: 'DRAFT',
        };
        return { ...category, presets: [...category.presets, newPreset] };
      }),
    );
  }, []);

  const removePreset = useCallback((categoryId: string, presetId: string) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }
        return { ...category, presets: category.presets.filter((p) => p.id !== presetId) };
      }),
    );
  }, []);

  const updatePresetText = useCallback((categoryId: string, presetId: string, text: string) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }
        return {
          ...category,
          presets: category.presets.map((p) => (p.id === presetId ? { ...p, text } : p)),
        };
      }),
    );
  }, []);

  const reorderPresets = useCallback((categoryId: string, presetIds: string[]) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }
        const presetMap = new Map(category.presets.map((p) => [p.id, p]));
        const reordered = presetIds
          .map((id) => presetMap.get(id))
          .filter((p): p is Preset => p !== undefined);
        return { ...category, presets: reordered };
      }),
    );
  }, []);

  const canAddCategory = categories.length < MaxCustomCategories;

  return {
    categories,
    addCategory,
    removeCategory,
    updateCategoryName,
    addPreset,
    removePreset,
    updatePresetText,
    reorderPresets,
    canAddCategory,
  };
};

export default useCategoryManager;
