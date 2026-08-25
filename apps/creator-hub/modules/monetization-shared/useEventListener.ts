import { useEffect } from 'react';
import type { RefObject } from 'react';

// MediaQueryList Event based useEventListener interface
function useEventListener<K extends keyof MediaQueryListEventMap>(
  eventName: K,
  handler: (event: MediaQueryListEventMap[K]) => void,
  element: RefObject<MediaQueryList | null>,
  options?: boolean | AddEventListenerOptions,
): void;

// Window Event based useEventListener interface
function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: undefined,
  options?: boolean | AddEventListenerOptions,
): void;

// Element Event based useEventListener interface
function useEventListener<
  K extends keyof HTMLElementEventMap & keyof SVGElementEventMap,
  TElement extends Element = K extends keyof HTMLElementEventMap ? HTMLDivElement : SVGElement,
>(
  eventName: K,
  handler: ((event: HTMLElementEventMap[K]) => void) | ((event: SVGElementEventMap[K]) => void),
  element: RefObject<TElement | null>,
  options?: boolean | AddEventListenerOptions,
): void;

// Document Event based useEventListener interface
function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: RefObject<Document | null>,
  options?: boolean | AddEventListenerOptions,
): void;

/**
 * Attaches a DOM event listener to `window`, a {@link Document}, an {@link Element}, or a
 * {@link MediaQueryList}. The latest `handler` is always invoked without re-subscribing on every
 * render (the handler reference is kept in a ref and updated when it changes).
 *
 * When `element` is omitted, listeners target `window`. Pass a ref whose `current` is the node or
 * object to listen on; if `current` is null or missing `addEventListener`, no listener is attached.
 *
 * @param eventName - DOM event name (typed against the target’s event map when using overloads).
 * @param handler - Callback receiving the event. Should be stable - identity updates sync which affects teardown.
 * @param element - Optional ref to the listener target. Omit for `window`.
 * @param options - Same as `addEventListener`’s third argument (`capture`, `passive`, etc.).
 *
 * @example
 * ```tsx
 * import { useRef } from 'react';
 * import { useEventListener } from '@modules/monetization-shared/useEventListener';
 *
 * export function Example() {
 *   const buttonRef = useRef<HTMLButtonElement>(null);
 *   const documentRef = useRef<Document>(document);
 *
 *   const onScroll = (event: Event) => {
 *     console.log('window scrolled!', event);
 *   };
 *
 *   const onClick = (event: Event) => {
 *     console.log('button clicked!', event);
 *   };
 *
 *   const onVisibilityChange = (event: Event) => {
 *     console.log('doc visibility changed!', {
 *       isVisible: !document.hidden,
 *       event,
 *     });
 *   };
 *
 *   useEventListener('scroll', onScroll);
 *   useEventListener('visibilitychange', onVisibilityChange, documentRef);
 *   useEventListener('click', onClick, buttonRef);
 *
 *   return (
 *     <div style={{ minHeight: '200vh' }}>
 *       <button type="button" ref={buttonRef}>
 *         Click me
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
function useEventListener<
  KW extends keyof WindowEventMap,
  KH extends keyof HTMLElementEventMap & keyof SVGElementEventMap,
  KM extends keyof MediaQueryListEventMap,
  TElement extends HTMLElement | SVGAElement | MediaQueryList = HTMLElement,
>(
  eventName: KW | KH | KM,
  handler: (
    event:
      | WindowEventMap[KW]
      | HTMLElementEventMap[KH]
      | SVGElementEventMap[KH]
      | MediaQueryListEventMap[KM]
      | Event,
  ) => void,
  element?: RefObject<TElement | null>,
  options?: boolean | AddEventListenerOptions,
) {
  useEffect(() => {
    // Define the listening target
    const targetElement: TElement | Window = element?.current ?? window;

    if (!(targetElement && targetElement.addEventListener)) {
      return undefined;
    }

    targetElement.addEventListener(eventName, handler, options);

    // Remove event listener on cleanup
    return () => targetElement.removeEventListener(eventName, handler, options);
  }, [eventName, element, options, handler]);
}

export { useEventListener };
