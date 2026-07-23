import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  Button,
  clsx,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
  SheetTrigger,
} from '@rbx/foundation-ui';

/** Context for closing the filter sheet - used for primary / secondary actions when uncontrolled. */
const FilterSheetCloseContext = createContext<() => void>(() => {});

// ---------------------------------------------------------------------------
// FilterSheetRoot
// ---------------------------------------------------------------------------

export type FilterSheetRootProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};

/**
 * Open-state container for the filter sheet family. Accepts the same `open` / `onOpenChange` /
 * `defaultOpen` props as foundation-ui's `SheetRoot`; omit them to run uncontrolled.
 */
export function FilterSheetRoot({
  children,
  open: openProp,
  onOpenChange,
  defaultOpen,
}: FilterSheetRootProps) {
  const isControlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(defaultOpen ?? false);
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const close = useMemo(() => () => setOpen(false), [setOpen]);

  return (
    <FilterSheetCloseContext.Provider value={close}>
      <SheetRoot open={open} onOpenChange={setOpen}>
        {children}
      </SheetRoot>
    </FilterSheetCloseContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// FilterSheetTrigger
// ---------------------------------------------------------------------------

export type FilterSheetTriggerProps = {
  /** Button label. Omit for an icon-only filter button. */
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  /** More accessible name for filter trigger, recommended for general use */
  'aria-label'?: string;
};

/**
 * Default-styled filter trigger.
 */
export function FilterSheetTrigger({
  children,
  disabled,
  className,
  'aria-label': ariaLabel,
}: FilterSheetTriggerProps) {
  return (
    <SheetTrigger>
      <Button
        // Note: overriding padding-right for better visual spacing
        className={clsx('!padding-right-large', className)}
        variant='Standard'
        size='Medium'
        isDisabled={disabled}
        icon='icon-filled-three-bars-horizontal-narrowing'
        aria-label={ariaLabel}>
        {children}
      </Button>
    </SheetTrigger>
  );
}

// ---------------------------------------------------------------------------
// FilterSheet
// ---------------------------------------------------------------------------

// TODO(@jeminpark): currently this doesn't accept form, but should be a valid case
// Look to update this sometime in the future.

export type FilterSheetDraftProps<TFilters> = {
  draftFilters: TFilters;
  setDraftFilters: React.Dispatch<React.SetStateAction<TFilters>>;
};

export type FilterSheetProps<TFilters> = {
  /** Currently-applied filters. Seeds the in-sheet draft each time the sheet opens. */
  filters: TFilters;
  /** Reset target. Reset all commits this value via `setFilters` and closes the sheet. */
  defaultFilters: NoInfer<TFilters>;
  /** Called with the committed filters on Apply (the draft) or Reset all (`defaultFilters`). */
  setFilters: (filters: TFilters) => void | Promise<void>;
  title: string;
  applyLabel: string;
  resetLabel: string;
  closeLabel: string;
  /**
   * Equality check that disables Apply when the draft matches the applied filters. Defaults to a
   * shallow comparison that treats `undefined`-valued keys as absent; override for filters with
   * reference-typed values (nested objects, arrays).
   */
  areFiltersEqual?: (a: NoInfer<TFilters>, b: NoInfer<TFilters>) => boolean;
  /** Render-prop for the filter controls. Bind inputs to the draft. */
  children: (params: FilterSheetDraftProps<TFilters>) => React.ReactNode;
};

function defaultAreFiltersEqual<TFilters>(a: TFilters, b: TFilters): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (!isPlainRecord(a) || !isPlainRecord(b)) {
    return false;
  }

  const aKeys = Object.keys(a).filter((key) => a[key] !== undefined);
  const bKeys = Object.keys(b).filter((key) => b[key] !== undefined);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => Object.is(a[key], b[key]));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Side-anchored generic filter sheet body.
 *
 * ```tsx
 * <FilterSheetRoot>
 *   <FilterSheetTrigger>{translate('Label.FilterBy')}</FilterSheetTrigger>
 *   <FilterSheet
 *     filters={filters}
 *     defaultFilters={{}}
 *     setFilters={setFilters}
 *     title={translate('Label.FilterBy')}
 *     applyLabel={translate('Action.Apply')}
 *     resetLabel={translate('Action.ResetAll')}
 *     closeLabel={translate('Action.Close')}
 *   >
 *     {({ draftFilters, setDraftFilters }) => (
 *      <div className='flex flex-col gap-xxlarge'>
 *        <RadioGroup … />
 *        <TextInput … />
 *        <Checkbox … />
 *      </div>
 *     )}
 *   </FilterSheet>
 * </FilterSheetRoot>
 * ```
 */
export function FilterSheet<TFilters>(props: FilterSheetProps<TFilters>) {
  return (
    <SheetContent largeScreenVariant='side' closeLabel={props.closeLabel}>
      <FilterSheetBody {...props} />
    </SheetContent>
  );
}

/**
 * Filter sheet body - split from FilterSheet to handle draft state reset on close
 * as sheet content unmounts its children.
 */
function FilterSheetBody<TFilters>({
  filters,
  defaultFilters,
  setFilters,
  title,
  applyLabel,
  resetLabel,
  areFiltersEqual = defaultAreFiltersEqual,
  children,
}: FilterSheetProps<TFilters>): React.JSX.Element {
  // Handle loading state in case of async setFilters - notably on backend-based filter calls
  const [isLoading, setIsLoading] = useState(false);
  const [draftFilters, setDraftFilters] = useState<TFilters>(filters);

  const close = useContext(FilterSheetCloseContext);

  const isApplyDisabled = isLoading || areFiltersEqual(filters, draftFilters);

  // Only flip to a loading state and await when `setFilters` returns a Promise — sync setters
  // (e.g. `useState` returning `void`) should close in the same React batch as the state update.
  const commitFilters = async (next: TFilters) => {
    const maybePromise = setFilters(next);
    if (maybePromise instanceof Promise) {
      setIsLoading(true);
      await maybePromise;
    }
    close();
  };

  const handleApply = () => commitFilters(draftFilters);
  const handleReset = () => commitFilters(defaultFilters);

  return (
    <>
      <SheetTitle>{title}</SheetTitle>
      <SheetBody className='flex flex-col gap-large padding-top-small padding-bottom-large'>
        {children({ draftFilters, setDraftFilters })}
      </SheetBody>
      <SheetActions className='flex gap-small'>
        <Button
          variant='Emphasis'
          size='Medium'
          className='fill basis-0'
          isLoading={isLoading}
          isDisabled={isApplyDisabled}
          onClick={handleApply}>
          {applyLabel}
        </Button>
        <Button
          variant='Standard'
          size='Medium'
          className='fill basis-0'
          onClick={handleReset}
          isDisabled={isLoading}>
          {resetLabel}
        </Button>
      </SheetActions>
    </>
  );
}
