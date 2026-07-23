type TCallback<Event = unknown, TArgs extends unknown[] = []> = (
  event: Event,
  ...args: TArgs
) => void;

type EventCallbacksMap<Events> = Map<keyof Events, TCallback<Events[keyof Events]>[]>;

export default function emitter<
  Events extends Record<string, unknown> = Record<string, unknown>
>() {
  const all: EventCallbacksMap<Events> = new Map();

  return {
    on<TEventName extends keyof Events>(type: TEventName, callback: TCallback<Events[TEventName]>) {
      const typedCallback = callback as TCallback<Events[keyof Events]>;
      if (all.has(type)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        all.get(type)!.push(typedCallback);
      } else {
        all.set(type, [typedCallback]);
      }
    },

    off<TEventName extends keyof Events>(
      type: TEventName,
      callback: TCallback<Events[TEventName]>
    ) {
      if (all.has(type)) {
        all.set(
          type,
          (all.get(type) || []).filter((fn) => fn !== callback)
        );
      }
    },

    emit<TEventName extends keyof Events>(
      type: TEventName,
      event: Events[TEventName],
      ...args: unknown[]
    ) {
      (all.get(type) || []).forEach((callback: TCallback<Events[TEventName], unknown[]>) => {
        callback(event, ...args);
      });
    },
  };
}
