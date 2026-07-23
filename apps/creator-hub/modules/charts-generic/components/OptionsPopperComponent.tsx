import React, { FC, useCallback, useRef, useMemo, useLayoutEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { autocompleteClasses } from '@rbx/ui';
import useAutocompleteChoiceControlStyles from './AutocompleteChoiceControl.styles';

function isOverflowElement(ele: Element): boolean {
  const { overflow, overflowX, overflowY } = (
    ele.ownerDocument.defaultView || window
  ).getComputedStyle(ele);

  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX);
}

function getNearestOverflowParentElement(ele: Element): Element {
  if (ele === ele.ownerDocument.body) return ele.ownerDocument.body;
  if (isOverflowElement(ele)) return ele;
  return getNearestOverflowParentElement(ele.parentElement || ele.ownerDocument.body);
}

type OptionsPopperComponentProps = {
  anchorEl?: unknown;
  disablePortal?: boolean;
  container?: Element | (() => Element | null) | null;
  open: boolean;
  style?: React.CSSProperties;
};

/**
 * Metric control options dropdown has two style modes: compact and expanded.
 *
 * Expanded mode is used when viewport is wide enough to fit all grouped options so users
 * don't have to scroll to see all options. It's used whenever possible.
 * Compact mode is used when viewport is not wider enough to achieve Expanded mode. It makes
 * the dropdown as wide as the anchor element and makes the listbox scrollable.
 *
 * To achieve this, we need a this customized Popper component since MUI Autocomplete's default
 * Popper component doesn't support this behavior. The steps we take to determine which style mode
 * to render:
 *
 * 1. Observe scroll event on the nearest overflow parent element of the anchor element, resize events
 *   on window object, anchor element and overflow parent element. Also observe options list changes upon
 *  typing and call update function to update styles.
 * 2. In 'update':
 *   a. Calculate the position of the popper relative to the anchor element.
 *   b. Update listbox with Expanded mode styles and check if it fits in viewport by
 *    making group lists wrapped and see if container becomes scrollable.
 *   c. If it fits, set width to listbox scroll width.
 *   d. If it doesn't fit, reset styles so it becomes the default dropdown again. i.e Compact style
 *
 */
const OptionsPopperComponent: FC<OptionsPopperComponentProps> = (props) => {
  const { anchorEl, disablePortal, container: givenContainer, open, ...other } = props;
  const {
    classes: { expandedListbox },
  } = useAutocompleteChoiceControlStyles();
  const popperRef = useRef<HTMLDivElement>(null);

  const anchorElement: null | HTMLElement = useMemo(() => {
    return typeof anchorEl === 'function' ? anchorEl() : anchorEl;
  }, [anchorEl]);
  const containerElement = useMemo(() => {
    return typeof givenContainer === 'function' ? givenContainer() : givenContainer;
  }, [givenContainer]);

  const update = useCallback(() => {
    const popper = popperRef.current;
    if (!anchorElement || !popper) return;
    const { top, left, height, width: anchorElementWidth } = anchorElement.getBoundingClientRect();
    popper.style.setProperty('left', `${left}px`);
    popper.style.setProperty('top', `${top + height}px`);
    popper.style.setProperty('min-width', `${anchorElementWidth}px`);

    const listbox = popper.querySelector(`.${autocompleteClasses.listbox}`) as HTMLElement | null;
    function updateListboxStyles(expandedStyleMode: boolean) {
      if (!listbox) return;
      if (expandedStyleMode) {
        listbox.classList.add(expandedListbox);
      } else {
        listbox.classList.remove(expandedListbox);
      }
      listbox.style.setProperty('max-height', `min(800px, calc(100vh - ${top + height + 16}px)`);
    }

    // reset popper width
    popper.style.removeProperty('width');
    if (listbox) {
      // then check if listbox fits in viewport by updating its styles with Expanded style mode
      updateListboxStyles(true);

      const view = anchorElement.ownerDocument.defaultView;
      const listboxScrollWidth = listbox.scrollWidth;
      if (
        left + listboxScrollWidth < (view?.innerWidth || 0) &&
        listboxScrollWidth > anchorElementWidth
      ) {
        // if it fits, set width to listbox scroll width
        popper.style.setProperty('width', `${listboxScrollWidth}px`);
      } else {
        popper.style.setProperty('width', `${anchorElementWidth}px`);
        // if expanded listbox doesn't fit, reset styles
        updateListboxStyles(false);
      }
    }
  }, [anchorElement, expandedListbox]);

  useLayoutEffect(() => {
    if (!anchorElement || !open) return () => {};

    // observe scroll
    const overflowParentElement = getNearestOverflowParentElement(anchorElement);
    overflowParentElement.addEventListener('scroll', update);

    // observe window resize
    const view = anchorElement.ownerDocument.defaultView;
    view?.addEventListener('resize', update);

    // resize event is only supported on window object
    // observe anchorElement and overflowParentElement resize with ResizeObserver
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(anchorElement);
    resizeObserver.observe(overflowParentElement);

    // observe options list changes due to input changes upon typing
    const mutationObserver = new MutationObserver(update);
    if (popperRef.current) {
      mutationObserver.observe(popperRef.current, { childList: true, subtree: true });
    }

    return () => {
      overflowParentElement.removeEventListener('scroll', update);
      view?.removeEventListener('resize', update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [open, anchorElement, update]);

  const popperStyleInPortal: CSSProperties = useMemo(
    () => ({ position: 'absolute', display: !open ? 'none' : undefined }),
    [open],
  );

  return disablePortal ? (
    <div {...other} ref={popperRef} />
  ) : (
    createPortal(
      <div {...other} ref={popperRef} style={popperStyleInPortal} />,
      containerElement ?? document.body,
    )
  );
};

export default OptionsPopperComponent;
