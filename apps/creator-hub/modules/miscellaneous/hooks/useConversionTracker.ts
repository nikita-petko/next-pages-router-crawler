import { useEffect, useRef, useCallback } from 'react';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import useDebouncedFunction from './useDebouncedFunction';
/**
 * NOTE (jcountryman, 05/23/24): The useConversionTracker is used to measure how visual cues lead to user action.
 * More details are available at https://roblox.atlassian.net/wiki/spaces/CREATORSUCCESS/pages/2604600958/Conversion+Tracking+impression+and+click+events
 * @constructor
 * @param {string} name - The conversion group name. This is what helps join both impressions with their respective conversions.
 * @param {number} duration - The time observed element was on screen in miliseconds.
 * @param {IntRange<0,101>} threshold - Accepts the value from 0 - 100. This
 */

type TEnumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : TEnumerate<N, [...Acc, Acc['length']]>;
export type TIntRange<F extends number, T extends number> = Exclude<TEnumerate<T>, TEnumerate<F>>;
const useConversionTracker = <T extends Element>(
  name: string,
  {
    duration = 100,
    threshold = 50,
    additionalParams = {},
  }: {
    duration?: number;
    threshold?: TIntRange<0, 101>;
    additionalParams?: Omit<Record<string, string>, 'duration' | 'threshold'>;
  } = {},
) => {
  const ref = useRef<T>(null);
  const countRef = useRef(1);
  const handleImpression = useCallback(() => {
    unifiedLoggerClient.logImpressionEvent({
      eventName: name,
      parameters: {
        duration: String(duration),
        threshold: String(threshold),
        count: String(countRef.current),
        ...additionalParams,
      },
    });
    countRef.current += 1;
  }, [name, duration, threshold, additionalParams]);
  const [debouncedHandleImpression] = useDebouncedFunction(handleImpression, duration);

  useEffect(() => {
    if (ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            debouncedHandleImpression();
          }
        },
        { threshold: threshold / 100.0 },
      );
      observer.observe(ref.current);
      return () => {
        observer.disconnect();
      };
    }
    return () => {};
  }, [ref, threshold, debouncedHandleImpression]);

  const onConvert = useCallback(
    (conversionName: string) => {
      unifiedLoggerClient.logClickEvent({
        eventName: name,
        parameters: { conversionName, ...additionalParams },
      });
    },
    [additionalParams, name],
  );

  return { ref, onConvert };
};

export default useConversionTracker;
