/**
 * Pure keyboard-shortcut and DOM-target predicates for the dashboard editor
 * canvas. Extracted from `EditPageCanvas` so the component body stays focused on
 * wiring; everything here is side-effect free and depends only on DOM event
 * shapes.
 */

type ShortcutEvent = Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'key'>;

export const isSummaryCardDeleteKey = (key: string): boolean =>
  key === 'Backspace' || key === 'Delete';

export const isCopyShortcut = (event: ShortcutEvent): boolean =>
  (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key === 'c';

export const isPasteShortcut = (event: ShortcutEvent): boolean =>
  (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key === 'v';

export const isUndoShortcut = (event: ShortcutEvent): boolean =>
  (event.metaKey || event.ctrlKey) &&
  !event.altKey &&
  !event.shiftKey &&
  event.key.toLowerCase() === 'z';

export const isRedoShortcut = (event: ShortcutEvent): boolean => {
  const key = event.key.toLowerCase();
  return (
    ((event.metaKey || event.ctrlKey) && !event.altKey && event.shiftKey && key === 'z') ||
    (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && key === 'y')
  );
};

export const isSelectionMoveKey = (key: string): boolean =>
  key === 'ArrowRight' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowUp';

const isEditableKeyboardTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  );
};

export const isTileActionsTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && !!target.closest('[data-custom-dashboard-tile-actions]');

const isShortcutModalOrMenuTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && !!target.closest('[role="dialog"], [role="menu"]');

export const shouldIgnorePageShortcut = (event: KeyboardEvent): boolean =>
  event.defaultPrevented ||
  isEditableKeyboardTarget(event.target) ||
  isTileActionsTarget(event.target) ||
  isShortcutModalOrMenuTarget(event.target);

export const isCanvasTileInteractionTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  !!target.closest('[data-custom-dashboard-tile-id], [data-custom-dashboard-tile-actions]');

export const stopTileActionEventPropagation = (event: { stopPropagation: () => void }): void => {
  event.stopPropagation();
};

export const getSelectionMoveDelta = (key: string): number =>
  key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
