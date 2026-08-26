/**
 * Coalesces rapid intent changes onto a single in-flight writer.
 *
 * Each `submit` records the latest intent. At most one `write` runs at a time.
 * When that write settles, a newer intent (if any) is flushed with the
 * now-fresh server version. A failed write does not retry the same intent;
 * a newer submit that arrived during the failure is flushed afterward.
 */

export type SerializedIntentWriter<TIntent> = {
  readonly submit: (intent: TIntent) => void;
};

export function createSerializedIntentWriter<TIntent>(options: {
  readonly write: (intent: TIntent) => Promise<void>;
  readonly onSuccess?: (intent: TIntent) => void;
  readonly onError?: (error: unknown, intent: TIntent) => void;
}): SerializedIntentWriter<TIntent> {
  let latestIntent: TIntent | undefined;
  let lastWritten: TIntent | undefined;
  let hasWritten = false;
  let epoch = 0;
  let inFlight = false;

  const drain = (): void => {
    if (inFlight || latestIntent === undefined) {
      return;
    }
    inFlight = true;
    // Scope the dedup baseline to a single drain pass so a fresh click after a
    // burst always reaches the service. Without this, `lastWritten` survives
    // across drains and a toggle back to the last written value is skipped,
    // leaving the optimistic flip lingering if the server state diverged.
    hasWritten = false;

    void (async () => {
      let drainEpoch = epoch;
      let intent: TIntent | undefined;
      try {
        while (latestIntent !== undefined) {
          drainEpoch = epoch;
          intent = latestIntent;
          if (hasWritten && Object.is(lastWritten, intent)) {
            if (epoch === drainEpoch) {
              latestIntent = undefined;
              break;
            }
            continue;
          }
          await options.write(intent);
          lastWritten = intent;
          hasWritten = true;
          options.onSuccess?.(intent);
          if (epoch === drainEpoch) {
            latestIntent = undefined;
            break;
          }
        }
      } catch (error) {
        if (intent !== undefined) {
          options.onError?.(error, intent);
        }
        if (epoch === drainEpoch) {
          latestIntent = undefined;
        }
      } finally {
        inFlight = false;
        if (latestIntent !== undefined) {
          drain();
        }
      }
    })();
  };

  return {
    submit: (intent) => {
      latestIntent = intent;
      epoch += 1;
      drain();
    },
  };
}
