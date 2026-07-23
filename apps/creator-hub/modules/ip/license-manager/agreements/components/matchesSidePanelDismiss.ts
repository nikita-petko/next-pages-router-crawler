/** MUI / portaled menus render outside the panel; match nodes on the event path. */
const PORTAL_MENU_INTERACTION_SELECTORS = [
  '[role="listbox"]',
  '[role="menu"]',
  '[role="option"]',
  '.MuiPopover-root',
  '.MuiPopper-root',
  '.MuiMenu-root',
  '.MuiMenu-list',
  '.MuiList-root',
  '.MuiMenu-paper',
] as const;

function eventComposedPathMatchesAnySelector(event: Event, selectors: readonly string[]): boolean {
  const path = event.composedPath();
  return path.some((node) => {
    if (!(node instanceof Element)) {
      return false;
    }
    return selectors.some((selector) => node.matches(selector) || node.closest(selector) != null);
  });
}

function isPortaledMenuInteraction(event: Event, target: Element): boolean {
  if (eventComposedPathMatchesAnySelector(event, PORTAL_MENU_INTERACTION_SELECTORS)) {
    return true;
  }

  if (target.closest('.MuiMenu-paper') != null) {
    return true;
  }

  return event
    .composedPath()
    .some((node) => node instanceof Element && node.classList.contains('MuiMenu-paper'));
}

function clickPathIntersectsPanel(event: Event, panel: HTMLElement | null): boolean {
  if (panel == null) {
    return false;
  }

  return event.composedPath().some((node) => node instanceof Node && panel.contains(node));
}

/**
 * Match panel: dismiss on any pointerdown outside the panel except table-row activation
 * and portaled menus (e.g. MUI Select).
 */
export function shouldDismissMatchSidePanel(event: Event, panel: HTMLElement | null): boolean {
  const target = event.target;
  if (!(target instanceof Element) || panel == null) {
    return false;
  }

  if (panel.contains(target)) {
    return false;
  }

  // Pointer started inside the panel (including targets that unmounted during the same event).
  if (clickPathIntersectsPanel(event, panel)) {
    return false;
  }

  if (target.closest('[data-ip-table-row-activatable]')) {
    return false;
  }

  if (isPortaledMenuInteraction(event, target)) {
    return false;
  }

  return true;
}

/**
 * Filter panel: dismiss on pointerdown outside the panel except the filter trigger
 * and portaled menus.
 */
export function shouldDismissFilterSidePanel(
  event: Event,
  panel: HTMLElement | null,
  triggerButton: HTMLButtonElement | null,
): boolean {
  const target = event.target;
  if (!(target instanceof Element) || panel == null) {
    return false;
  }

  if (panel.contains(target)) {
    return false;
  }

  if (triggerButton?.contains(target)) {
    return false;
  }

  if (clickPathIntersectsPanel(event, panel)) {
    return false;
  }

  if (isPortaledMenuInteraction(event, target)) {
    return false;
  }

  return true;
}
