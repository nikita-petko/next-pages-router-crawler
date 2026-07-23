/* istanbul ignore file */
import { createContext, useCallback, useRef } from 'react';
import { clsx } from '@rbx/foundation-ui';
import type {
  TTailwindBgClass,
  TTailwindGapClass,
  TTailwindGapXClass,
  TTailwindGapYClass,
  TTailwindHeightClass,
  TTailwindPaddingClass,
  TTailwindPaddingXClass,
  TTailwindPaddingYClass,
  TTailwindRadiusClass,
  TTailwindSizeClass,
  TTailwindStrokeClass,
  TTailwindTextBodyClass,
  TTailwindTextTitleClass,
} from '@rbx/foundation-tailwind/classes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const disabledOpacity = 'opacity-[0.5]';

export const interactable =
  'relative clip group/interactable focus-visible:outline-focus disabled:outline-none';

// ---------------------------------------------------------------------------
// StateLayer – hover / press overlay for interactive elements
// ---------------------------------------------------------------------------

export const StateLayer = () => (
  <div
    role='presentation'
    className={clsx(
      'absolute',
      'inset-[0]',
      'transition-colors',
      'group-hover/interactable:bg-[var(--color-state-hover)]',
      'group-active/interactable:bg-[var(--color-state-press)]',
      'group-disabled/interactable:bg-none',
    )}
  />
);

// ---------------------------------------------------------------------------
// useId – stable auto-incrementing id for SSR-safe ARIA ids
// ---------------------------------------------------------------------------

let globalId = 0;

export const useId = (prefix = ':r'): string => {
  const idRef = useRef<string>(undefined);
  if (!idRef.current) {
    globalId += 1;
    idRef.current = `${prefix}${globalId}`;
  }
  return idRef.current;
};

// ---------------------------------------------------------------------------
// useTypeahead – keyboard typeahead search for option lists
// ---------------------------------------------------------------------------

const TYPEAHEAD_TIMEOUT = 500;
const LETTER_REGEX = /^[a-z0-9]$/i;

export type TTypeaheadOptions = {
  getItems: () => HTMLElement[];
  getLabel?: (element: HTMLElement) => string;
  isDisabled?: (element: HTMLElement) => boolean;
  getCurrentIndex?: (items: HTMLElement[]) => number;
  onMatch: (element: HTMLElement) => void;
};

const defaultGetLabel = (el: HTMLElement): string => el.dataset.label ?? '';

const defaultIsDisabled = (el: HTMLElement): boolean => el.getAttribute('aria-disabled') === 'true';

const defaultGetCurrentIndex = (items: HTMLElement[]): number => {
  const active = document.activeElement;
  return items.findIndex((el) => el === active || el.contains(active));
};

export function useTypeahead({
  getItems,
  getLabel = defaultGetLabel,
  isDisabled = defaultIsDisabled,
  getCurrentIndex = defaultGetCurrentIndex,
  onMatch,
}: TTypeaheadOptions) {
  const searchRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isTypeaheadKey = useCallback((key: string) => LETTER_REGEX.test(key), []);

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    searchRef.current = '';
  }, []);

  const handleTypeahead = useCallback(
    (key: string) => {
      clearTimeout(timerRef.current);
      const isStarting = searchRef.current.length === 0;
      searchRef.current += key.toLowerCase();
      timerRef.current = setTimeout(() => {
        searchRef.current = '';
      }, TYPEAHEAD_TIMEOUT);

      const items = getItems();
      const search = searchRef.current;
      const currentIdx = getCurrentIndex(items);

      const enabledMatches = items
        .map((el, i) => ({ el, i }))
        .filter(({ el }) => {
          if (isDisabled(el)) return false;
          return getLabel(el).toLowerCase().startsWith(search);
        });

      if (enabledMatches.length === 0) return;

      const next = isStarting
        ? (enabledMatches.find(({ i }) => i > currentIdx) ?? enabledMatches[0])
        : (enabledMatches.find(({ i }) => i >= currentIdx) ?? enabledMatches[0]);

      onMatch(next.el);
    },
    [getItems, getLabel, isDisabled, getCurrentIndex, onMatch],
  );

  return { handleTypeahead, isTypeaheadKey, reset } as const;
}

// ---------------------------------------------------------------------------
// Dropdown / MultiSelect shared context & size maps
// ---------------------------------------------------------------------------

export const dropdownSizes = ['XSmall', 'Small', 'Medium', 'Large'] as const;
export type TDropdownSize = (typeof dropdownSizes)[number];

export type TDropdownContext = {
  size: TDropdownSize;
  selectedValues?: string[];
  onItemSelect?: (value: string) => void;
  onContentKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  contentId?: string;
  triggerWidth?: number;
};

export const DropdownContext = createContext<TDropdownContext | null>(null);

export const ICON_SIZE_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindSizeClass> = {
  XSmall: 'size-300',
  Small: 'size-400',
  Medium: 'size-500',
  Large: 'size-600',
};

export const PADDING_X_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindPaddingXClass> = {
  XSmall: 'padding-x-medium',
  Small: 'padding-x-medium',
  Medium: 'padding-x-medium',
  Large: 'padding-x-large',
};

export const LABEL_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindTextTitleClass> = {
  XSmall: 'text-title-small',
  Small: 'text-title-small',
  Medium: 'text-title-medium',
  Large: 'text-title-large',
};

export const TEXT_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindTextBodyClass> = {
  XSmall: 'text-body-small',
  Small: 'text-body-small',
  Medium: 'text-body-medium',
  Large: 'text-body-large',
};

export const GAP_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindGapClass> = {
  XSmall: 'gap-xsmall',
  Small: 'gap-small',
  Medium: 'gap-small',
  Large: 'gap-small',
};

export const DROPDOWN_RADIUS_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindRadiusClass> = {
  XSmall: 'radius-small',
  Small: 'radius-medium',
  Medium: 'radius-medium',
  Large: 'radius-medium',
};

export const HEIGHT_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindHeightClass> = {
  XSmall: 'height-600',
  Small: 'height-800',
  Medium: 'height-1000',
  Large: 'height-1200',
};

// ---------------------------------------------------------------------------
// Menu-specific size maps
// ---------------------------------------------------------------------------

export const MENU_RADIUS_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindRadiusClass> = {
  XSmall: 'radius-medium',
  Small: 'radius-large',
  Medium: 'radius-large',
  Large: 'radius-large',
};

export const SECTION_PADDING_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindPaddingClass> = {
  XSmall: 'padding-xsmall',
  Small: 'padding-small',
  Medium: 'padding-small',
  Large: 'padding-small',
};

export const MENU_PADDING_X_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindPaddingXClass> = {
  XSmall: 'padding-x-medium',
  Small: 'padding-x-medium',
  Medium: 'padding-x-medium',
  Large: 'padding-x-large',
};

export const MENU_ITEM_PADDING_Y_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindPaddingYClass> = {
  XSmall: 'padding-y-xsmall',
  Small: 'padding-y-small',
  Medium: 'padding-y-small',
  Large: 'padding-y-medium',
};

export const MENU_ITEM_GAP_X_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindGapXClass> = {
  XSmall: 'gap-x-medium',
  Small: 'gap-x-medium',
  Medium: 'gap-x-medium',
  Large: 'gap-x-large',
};

export const MENU_ITEM_GAP_Y_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindGapYClass> = {
  XSmall: 'gap-y-xxsmall',
  Small: 'gap-y-xxsmall',
  Medium: 'gap-y-xsmall',
  Large: 'gap-y-xsmall',
};

export const MENU_ITEM_RADIUS_CLASS_BY_SIZE: Record<TDropdownSize, TTailwindRadiusClass> = {
  XSmall: 'radius-small',
  Small: 'radius-medium',
  Medium: 'radius-medium',
  Large: 'radius-medium',
};

export const CHECK_ICON_SIZE_CLASS_BY_SIZE: Record<TDropdownSize, string> = {
  XSmall: 'size-[var(--icon-size-xsmall)]',
  Small: 'size-[var(--icon-size-small)]',
  Medium: 'size-[var(--icon-size-medium)]',
  Large: 'size-[var(--icon-size-large)]',
};

// ---------------------------------------------------------------------------
// Input variants
// ---------------------------------------------------------------------------

export const inputVariants = ['Standard', 'Contrast', 'Utility'] as const;
export type TInputVariant = (typeof inputVariants)[number];

export const BACKGROUND_CLASS_BY_INPUT_VARIANT: Record<TInputVariant, TTailwindBgClass> = {
  Standard: 'bg-none',
  Contrast: 'bg-shift-200',
  Utility: 'bg-none',
};

export const STROKE_CLASS_BY_INPUT_VARIANT: Record<TInputVariant, TTailwindStrokeClass> = {
  Standard: 'stroke-standard',
  Contrast: 'stroke-none',
  Utility: 'stroke-none',
};
