import type { KeyboardEvent } from 'react';
import {
  footerID,
  leftNavID,
  mainID,
  rightNavID,
  secondaryNavID,
  topNavQuerySelector,
} from '../constants/layoutConstants';
import type { KeyHandler } from '../types';
import getQuerySelectors, { FOCUSABLE_QUERY } from './getQuerySelectors';

export const isInteractKey = (e: KeyboardEvent<Element>): boolean => {
  const { key } = e;
  return key === 'Enter' || key === ' ' || key === 'Spacebar';
};

const isSameLinkText = (
  element1: HTMLAnchorElement | null,
  element2: HTMLAnchorElement | null,
): boolean => {
  if (!element1 || !element2) {
    return false;
  }
  return element1?.textContent === element2?.textContent;
};
const isInParent = (
  parent:
    | {
        parentId: string;
      }
    | { parentQuerySelector: string },
  element: HTMLAnchorElement | EventTarget | null,
  maxSearchDepth = Infinity,
  returnParentIfFound = false,
): boolean | HTMLAnchorElement => {
  if (!element || (element as HTMLAnchorElement).nodeName === 'BODY' || maxSearchDepth === 0) {
    return false;
  }
  const matchesElement =
    'parentId' in parent
      ? (element as HTMLAnchorElement).id === parent.parentId
      : isSameLinkText(
          element as HTMLAnchorElement,
          document.querySelector(parent.parentQuerySelector) as HTMLAnchorElement,
        );
  if (returnParentIfFound && matchesElement) {
    return element as HTMLAnchorElement;
  }

  return (
    matchesElement ||
    isInParent(parent, (element as Element).parentElement, maxSearchDepth - 1, returnParentIfFound)
  );
};
const isInTreeGroup = (target: EventTarget | null): Element | null =>
  isInParent({ parentQuerySelector: '.MuiTreeItem-group' }, target, 30, true) as Element;

let querySelectorsCached: ReturnType<typeof getQuerySelectors> | null = null;

const SCROLL_OFFSET = 100;
const ismoveForwardInMenu = (event: KeyboardEvent<unknown>): boolean =>
  event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey);
const isMoveBackInMenu = (event: KeyboardEvent<unknown>): boolean =>
  event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey);

export const onKeyDown: KeyHandler = (event) => {
  const querySelectors = querySelectorsCached ?? getQuerySelectors();
  if (!querySelectorsCached) {
    querySelectorsCached = querySelectors;
  }
  const { mainLayout, topNav, secondaryNav, leftNav, rightNav, footer } = querySelectors;
  const { key, metaKey: metaKeyDepressed } = event as unknown as KeyboardEvent<HTMLAnchorElement>;
  const target = event.target as HTMLAnchorElement;
  const moveForwardInMenu = ismoveForwardInMenu(event as unknown as KeyboardEvent<unknown>);
  const moveBackInMenu = isMoveBackInMenu(event as unknown as KeyboardEvent<unknown>);
  const inLeftNav = isInParent({ parentId: leftNavID }, target, 30);
  const inRightNav = isInParent({ parentId: rightNavID }, target, 30);
  // provide easy way to start scrolling content via 'Escape' key
  if (key === 'Escape') {
    return mainLayout.element?.focus();
  }

  // TOP NAV
  // top nav to/from secondary-nav, left-nav to/from secondary-nav
  const inTopNav = isInParent({ parentQuerySelector: topNavQuerySelector }, target, 10);
  // top nav -> secondary nav
  if (inTopNav && key === 'ArrowDown') {
    return secondaryNav.firstLink?.focus();
  }

  // SECONDARY NAV
  const inSecondaryNav = isInParent({ parentId: secondaryNavID }, target, 6);
  if (inSecondaryNav) {
    // secondary nav -> top nav
    if (key === 'ArrowUp') {
      return topNav.firstLink?.focus();
    }
    // secondary nav -> left nav
    if (key === 'ArrowDown') {
      return leftNav.firstLink?.focus();
    }
  }
  // main/left nav -> secondary nav
  if (key === 'ArrowUp') {
    if (
      isSameLinkText(leftNav.firstLink, target) ||
      isSameLinkText(mainLayout.firstLink, target as HTMLAnchorElement)
    ) {
      return secondaryNav.firstLink?.focus();
    }
  }

  const isInMain = isInParent({ parentId: mainID }, target);

  // left-nav to/from mainLayout, mainLayout to/from left-nav
  if (key === 'ArrowRight' && inLeftNav) {
    return mainLayout.firstLink?.focus();
  }
  if (key === 'ArrowLeft' && inRightNav) {
    return mainLayout.firstLink?.focus();
  }

  // RIGHT NAV
  if (inRightNav) {
    // right nav -> mainLayout
    if (key === 'ArrowLeft') {
      return mainLayout.firstLink?.focus();
    }
    // right nav -> footer
    if (key === 'ArrowRight') {
      return footer.firstLink?.focus();
    }
  }

  // scroll mainLayout content on arrow key up/down
  if (!metaKeyDepressed && isInMain && (key === 'ArrowDown' || key === 'ArrowUp')) {
    if (isSameLinkText(mainLayout.firstLink, target as HTMLAnchorElement)) {
      return (secondaryNav.firstLink || topNav.firstLink)?.focus();
    }
    return mainLayout.element?.scrollBy(
      0,
      key === 'ArrowDown' ? SCROLL_OFFSET : -1 * SCROLL_OFFSET,
    );
  }

  // IN TREE NAV _____________________________________________
  if (!metaKeyDepressed && (inLeftNav || inRightNav)) {
    // navigate tree with arrow keys
    if (moveForwardInMenu || moveBackInMenu) {
      const nav = inLeftNav ? leftNav : rightNav;
      const focusableEls = Array.from(
        (nav ? nav.getFocusableElements() : []) || [],
      ) as Array<HTMLAnchorElement>;
      const currIdx = focusableEls.findIndex((el) => target.isEqualNode(el));
      if (currIdx !== -1) {
        if (moveForwardInMenu) {
          // at end of the tree and moved forward -> link to mainLayout
          if (!focusableEls[currIdx + 1]) {
            return mainLayout.firstLink?.focus();
          }
          return focusableEls[currIdx + 1].focus();
        }
        if (moveBackInMenu) {
          // at start of tree and moved back -> link to secondary nav
          if (currIdx === 0) {
            return mainLayout.firstLink?.focus();
          }
          return focusableEls[currIdx - 1].focus();
        }
      }
    }
  }
  // nav -> secondary nav if on first link
  if (moveBackInMenu && (inLeftNav || inRightNav)) {
    const nav = inLeftNav ? leftNav : rightNav;
    if (isSameLinkText(nav.firstLink, target)) {
      return (secondaryNav.firstLink || topNav.firstLink)?.focus();
    }
  }

  // META KEY INTERACTIONS _____________________________________________
  // within nav, navigate to first, last links
  if (metaKeyDepressed) {
    const inFooter = isInParent({ parentId: footerID }, target, 5);
    if (inTopNav) {
      // top nav -> secondary nav
      if (key === 'ArrowDown') {
        return [secondaryNav.firstLink, leftNav.firstLink, mainLayout.firstLink, footer.firstLink]
          .find(Boolean)
          ?.focus();
      }
    } else if (inSecondaryNav) {
      // secondary nav -> top nav
      if (key === 'ArrowUp') {
        return topNav.firstLink?.focus();
      }
      // secondary nav -> left nav
      if (key === 'ArrowDown') {
        return leftNav.getLastLink()?.focus();
      }
      // secondary nav -> mainLayout
      if (moveForwardInMenu) {
        return mainLayout.firstLink?.focus();
      }
    }
    if (inLeftNav || inRightNav) {
      const nav = inLeftNav ? leftNav : rightNav;
      // navigate to first/last link of sub trees
      const parentTree = isInTreeGroup(target) as Element;
      if (moveForwardInMenu) {
        if (parentTree) {
          const treeFocusableChildren = parentTree.querySelectorAll(FOCUSABLE_QUERY);
          // prevent default scroll to bottom
          event.preventDefault();
          const el = treeFocusableChildren[treeFocusableChildren.length - 1] as HTMLAnchorElement;
          if (el) {
            // prevent default scroll to bottom
            event.preventDefault();
            return el.focus();
          }
        }
        return nav.getLastLink()?.focus();
      }
      if (moveBackInMenu) {
        if (parentTree) {
          const treeFocusableChildren = parentTree.querySelectorAll(FOCUSABLE_QUERY);
          if (treeFocusableChildren[0]) {
            // prevent default scroll to top
            event.preventDefault();
            return (treeFocusableChildren[0] as HTMLAnchorElement).focus();
          }
        }
        return nav.firstLink?.focus();
      }
      // left nav -> mainLayout
      if (inLeftNav && moveForwardInMenu) {
        return mainLayout.firstLink?.focus();
      }
      // right nav -> mainLayout
      if (inRightNav && moveBackInMenu) {
        return mainLayout.firstLink?.focus();
      }
    } else if (inRightNav) {
      if (moveBackInMenu || key === 'ArrowUp' || key === 'ArrowLeft') {
        return mainLayout.firstLink?.focus();
      }
      if (moveForwardInMenu || key === 'ArrowDown' || key === 'ArrowRight') {
        // on last link -> move to footer
        if (isSameLinkText(rightNav.getLastLink(), target)) {
          return footer.firstLink?.focus();
        }
      }
    } else if (isInMain) {
      // in mainLayout content, can use arrow keys to navigate in-mainLayout content.
      // only bind to meta keydown + arrow keys for navigating to other layout areas

      // mainLayout -> secondary nav
      if (moveBackInMenu) {
        return (secondaryNav.firstLink || topNav.firstLink)?.focus();
      }
      // mainLayout -> right nav
      if (moveForwardInMenu || key === 'ArrowRight') {
        return rightNav.firstLink?.focus();
      }
      // mainLayout -> left nav
      if (moveBackInMenu) {
        return leftNav.firstLink?.focus();
      }
      // mainLayout -> footer
      if (key === 'ArrowDown') {
        return footer.firstLink?.focus();
      }
    } else if (isInMain || inFooter) {
      // mainLayout -> left nav or right nav or top of mainLayout
      if (moveBackInMenu) {
        return leftNav.firstLink?.focus();
      }
      if (moveForwardInMenu) {
        return footer.firstLink?.focus();
      }
      if (key === 'ArrowUp') {
        return mainLayout.firstLink?.focus();
      }
    } else if (inFooter) {
      // footer -> mainLayout
      if (key === 'ArrowUp') {
        return mainLayout.firstLink?.focus();
      }
      // footer -> left nav
      if (moveBackInMenu) {
        return leftNav.firstLink?.focus();
      }
      // footer -> right nav
      if (moveForwardInMenu) {
        return rightNav.firstLink?.focus();
      }
    }
  }
};
