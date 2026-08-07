import { useCallback, useState } from 'react';
import { MaxCustomCategories } from '../constants/presetChatConstants';
import type { CategoryFormState } from '../types';

export type UseCategoryManagerReturn = {
  categories: CategoryFormState[];
  addCategory: () => void;
  removeCategory: (id: string) => void;
  updateCategoryName: (id: string, name: string) => void;
  canAddCategory: boolean;
};

const useCategoryManager = (): UseCategoryManagerReturn => {
  const [categories, setCategories] = useState<CategoryFormState[]>([]);

  const addCategory = useCallback(() => {
    setCategories((prev) => {
      if (prev.length >= MaxCustomCategories) {
        return prev;
      }
      const newCategory: CategoryFormState = {
        id: crypto.randomUUID(),
        name: '',
        presets: [],
        status: 'DRAFT',
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

  const canAddCategory = categories.length < MaxCustomCategories;

  return { categories, addCategory, removeCategory, updateCategoryName, canAddCategory };
};

export default useCategoryManager;
