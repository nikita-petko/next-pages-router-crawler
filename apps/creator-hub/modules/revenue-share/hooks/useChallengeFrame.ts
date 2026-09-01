// Tracks the 2SV challenge iframe that @rbx/clients-core appends to document.body and lets a
// component take ownership of it, so the challenge can be presented as a stacked modal layer.
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

const CHALLENGE_FRAME_ID = 'challenge-frame';

const isChallengeFrameMounted = () => document.getElementById(CHALLENGE_FRAME_ID) !== null;

const isChallengeFrameMountedOnServer = () => false;

export type ChallengeFrame = {
  /** Whether a challenge iframe currently exists anywhere on the page. */
  isActive: boolean;
  /** Ref callback for the element that should own the challenge iframe while it is active. */
  setHost: (host: HTMLElement | null) => void;
};

const useChallengeFrame = (): ChallengeFrame => {
  const [host, setHost] = useState<HTMLElement | null>(null);

  const subscribe = useCallback(
    (onChallengeFrameChange: () => void) => {
      // Once the frame has been adopted the middleware removes it from the host, not from the body.
      const targets = host ? [document.body, host] : [document.body];
      const observers = targets.map((target) => {
        const observer = new MutationObserver(onChallengeFrameChange);
        observer.observe(target, { childList: true });
        return observer;
      });

      return () => {
        observers.forEach((observer) => {
          observer.disconnect();
        });
      };
    },
    [host],
  );

  const isActive = useSyncExternalStore(
    subscribe,
    isChallengeFrameMounted,
    isChallengeFrameMountedOnServer,
  );

  // No cleanup on purpose: the frame covers the viewport and swallows clicks, so an unfinished
  // challenge has to be torn down with its host rather than left on the body with no owner.
  useEffect(() => {
    if (!host) {
      return;
    }

    const frame = document.getElementById(CHALLENGE_FRAME_ID);
    if (frame && frame.parentElement !== host) {
      host.appendChild(frame);
    }
  }, [host, isActive]);

  return { isActive, setHost };
};

export default useChallengeFrame;
