const PRIMARY_MOUSE_BUTTON = 0;

type TClickModifiers = Pick<MouseEvent, 'altKey' | 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey'>;

/**
 * Clicks the browser owns: Cmd/Ctrl (new tab), Shift (new window), Alt (download)
 * and any non-primary button. Nav click handlers must bail out before calling
 * `preventDefault` on these, otherwise the link is trapped in the current tab.
 */
const isModifiedClick = (event: TClickModifiers): boolean =>
  event.metaKey ||
  event.ctrlKey ||
  event.shiftKey ||
  event.altKey ||
  event.button !== PRIMARY_MOUSE_BUTTON;

export default isModifiedClick;
