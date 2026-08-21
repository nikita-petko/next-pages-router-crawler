/**
 * `MediaQueryList` only became an `EventTarget` in Safari 14. Before that it has
 * just the legacy `addListener`/`removeListener` pair, so the modern API throws
 * `TypeError: ... removeEventListener is not a function` while React commits and
 * takes the tree down. `@rbx/settings`' ThemeModeProvider hits it first, but
 * `@rbx/analytics-ui` and `useIsCustomDashboardNarrowViewport` call it too, hence
 * shimming the prototype rather than individual call sites.
 *
 * Faithful for `'change'`, which is all we use. The `capture`, `once` and `signal`
 * options cannot be honoured, so they warn rather than being dropped silently.
 * Nullish listeners are ignored like the native API: the DOM types rule them out,
 * but untyped callers reach the patched prototype too.
 */

type ChangeListener = (event: MediaQueryListEvent) => void;
type ListenerOptions = boolean | AddEventListenerOptions;

const ChangeEventType = 'change';
const UnsupportedOptionNames = ['capture', 'once', 'signal'] as const;

// Object listeners need a stable wrapper, or `removeListener` gets a different
// function than `addListener` saw and silently removes nothing.
const objectListenerWrappers = new WeakMap<EventListenerObject, ChangeListener>();

const asChangeListener = (listener: EventListenerOrEventListenerObject): ChangeListener => {
  if (typeof listener === 'function') {
    return listener;
  }

  const existingWrapper = objectListenerWrappers.get(listener);
  if (existingWrapper) {
    return existingWrapper;
  }

  const wrapper: ChangeListener = (event) => listener.handleEvent(event);
  objectListenerWrappers.set(listener, wrapper);
  return wrapper;
};

const ignoredOptionNames = (options?: ListenerOptions): readonly string[] => {
  if (typeof options === 'boolean') {
    return options ? ['capture'] : [];
  }
  if (!options) {
    return [];
  }
  return UnsupportedOptionNames.filter((name) => Boolean(options[name]));
};

// The legacy API only fires for `change` and takes no options, so staying silent
// here would look like a working listener that never fires.
const warnAboutUnsupportedArguments = (
  method: string,
  type: string,
  options?: ListenerOptions,
): void => {
  if (type !== ChangeEventType) {
    console.warn(`MediaQueryList polyfill: ${method} ignored '${type}' event type.`);
  }

  const ignoredOptions = ignoredOptionNames(options);
  if (ignoredOptions.length > 0) {
    console.warn(
      `MediaQueryList polyfill: ${method} ignored unsupported option(s) ${ignoredOptions.join(', ')}.`,
    );
  }
};

/**
 * Probes a live instance rather than the `MediaQueryList` global, which iOS 13
 * Safari does not expose. Returns the prototype to patch, or `undefined` when the
 * modern API already works — including on the server, where there is nothing to
 * patch.
 */
const findPrototypeNeedingShim = (): object | undefined => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return undefined;
  }

  const probe = window.matchMedia('all');
  // oxlint-disable-next-line typescript/no-deprecated -- the deprecated pair is all Safari 13 has
  const hasLegacyApi = typeof probe.addListener === 'function';
  if (typeof probe.addEventListener === 'function' || !hasLegacyApi) {
    return undefined;
  }

  const prototype: unknown = Object.getPrototypeOf(probe);
  // Never patch `Object.prototype`; that is worse than an unshimmed media query.
  return typeof prototype === 'object' && prototype !== null && prototype !== Object.prototype
    ? prototype
    : undefined;
};

// Runs on import; exported so tests can drive it directly.
export const installMediaQueryListPolyfill = (): void => {
  const prototypeNeedingShim = findPrototypeNeedingShim();
  if (!prototypeNeedingShim) {
    return;
  }

  // `defineProperty` keeps these non-enumerable like the natives, and avoids
  // casting around `addEventListener`'s overloads.
  Object.defineProperty(prototypeNeedingShim, 'addEventListener', {
    value: function addEventListener(
      this: MediaQueryList,
      type: string,
      listener: EventListenerOrEventListenerObject | null | undefined,
      options?: ListenerOptions,
    ): void {
      warnAboutUnsupportedArguments('addEventListener', type, options);
      if (type !== ChangeEventType || listener === null || listener === undefined) {
        return;
      }
      // oxlint-disable-next-line typescript/no-deprecated -- the legacy API is the whole point of this shim
      this.addListener(asChangeListener(listener));
    },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(prototypeNeedingShim, 'removeEventListener', {
    value: function removeEventListener(
      this: MediaQueryList,
      type: string,
      listener: EventListenerOrEventListenerObject | null | undefined,
      options?: ListenerOptions,
    ): void {
      warnAboutUnsupportedArguments('removeEventListener', type, options);
      if (type !== ChangeEventType || listener === null || listener === undefined) {
        return;
      }
      // oxlint-disable-next-line typescript/no-deprecated -- see addEventListener above
      this.removeListener(asChangeListener(listener));
    },
    writable: true,
    configurable: true,
  });
};

installMediaQueryListPolyfill();
