import { createContext } from 'react';
import type { TListboxOption } from '../lib/foundation-listbox';

export type TComboboxOptionData = {
  value: string;
  title: string;
  disabled?: boolean;
};

export type TComboboxFilterOption = (inputValue: string, option: TComboboxOptionData) => boolean;

export type TComboboxContext = {
  inputValue: string;
  selectedValue?: string;
  activeOptionId?: string;
  visibleOptionCount: number;
  filterOption: TComboboxFilterOption;
  registerOption: (option: TListboxOption) => () => void;
  setActiveOptionId: (id: string | undefined) => void;
  onOptionSelect: (value: string, title: string) => void;
};

export const ComboboxContext = createContext<TComboboxContext | null>(null);

export type TComboboxMenuChildProps = {
  children?: React.ReactNode;
};

export const defaultFilterOption: TComboboxFilterOption = (inputValue, option) => {
  const trimmed = inputValue.trim();
  if (trimmed.length === 0) {
    return true;
  }
  return option.title.toLowerCase().includes(trimmed.toLowerCase());
};
