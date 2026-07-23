import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { universesClient, developClient } from '@modules/clients';

/**
 * Roblox game URLs use the root place ID: e.g. https://www.roblox.com/games/12345/Experience-Name
 * Supports production, stx, and bare place ID strings (e.g. "12345").
 */
const GAMES_URL_PLACE_ID_REGEX =
  /^(https?:\/\/)?(www\.)?(sitetest\d\.)?roblox(labs)?\.com(\/[A-Za-z]{2}(?:-[A-Za-z0-9]{2,3})?)?\/games\/(\d+)/;
/** Extracts the place ID segment after /games/ without relying on the main regex's capture index. */
const GAMES_PLACE_ID_SEGMENT_REGEX = /\/games\/(\d+)/;

/**
 * Validates that the string is a positive integer (no leading zeros, no decimals).
 * Uses Number() for conversion; rejects if the normalized form doesn't match the segment.
 */
const parsePlaceIdSegment = (segment: string): number | undefined => {
  const num = Number(segment);
  if (
    !Number.isInteger(num) ||
    num <= 0 ||
    num > Number.MAX_SAFE_INTEGER ||
    String(num) !== segment
  ) {
    return undefined;
  }
  return num;
};

export const extractExperienceRootPlaceId = (urlString: string | undefined): number | undefined => {
  const trimmed = urlString?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (GAMES_URL_PLACE_ID_REGEX.test(trimmed)) {
    const segmentMatch = trimmed.match(GAMES_PLACE_ID_SEGMENT_REGEX);
    if (segmentMatch?.[1]) {
      return parsePlaceIdSegment(segmentMatch[1]);
    }
  }
  if (/^\d+$/.test(trimmed)) {
    return parsePlaceIdSegment(trimmed);
  }
  return undefined;
};

/**
 * Resolves a Roblox experience URL or root place ID string to a universe ID.
 * Returns null if the input is invalid or the place has no universe.
 */
export const getUniverseIdFromExperienceInput = async (
  urlOrPlaceId: string | undefined,
): Promise<number | null> => {
  const rootPlaceId = extractExperienceRootPlaceId(urlOrPlaceId);
  if (rootPlaceId === undefined) {
    return null;
  }
  try {
    const response = await universesClient.getUniverseContainingPlace(rootPlaceId);
    return response?.universeId ?? null;
  } catch {
    return null;
  }
};

const DEFAULT_DEBOUNCE_MS = 500;
const MIN_LOADING_MS = 400;

export interface UseExperienceUrlInputOptions {
  value?: string;
  onResolved: (universeId: number, rawInput: string) => void;
  onError: (message: string | undefined) => void;
  debounceMs?: number;
  /** When set, minimum time to show loading before reporting result. Omit or 0 to report immediately. */
  minLoadingMs?: number;
}

export interface UseExperienceUrlInputResult {
  inputValue: string;
  handleChange: (newValue: string) => void;
  isLoading: boolean;
}

/**
 * Encapsulates experience URL / root place ID input: debounced validation,
 * getUniverseIdFromExperienceInput resolution, and success/error callbacks.
 *
 * Once we start resolving we show loading for at least MIN_LOADING_MS and only
 * then report success or error, so the user sees a single transition
 * (e.g. spinner then result, or spinner then error) instead of error appearing
 * before the spinner disappears.
 */
export function useExperienceUrlInput({
  value = '',
  onResolved,
  onError,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  minLoadingMs = MIN_LOADING_MS,
}: UseExperienceUrlInputOptions): UseExperienceUrlInputResult {
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validationFailedRef = useRef(false);
  const reportErrorWhenDoneRef = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      if (value === '' && validationFailedRef.current) {
        return;
      }
      validationFailedRef.current = false;
      setInputValue(value);
    }
  }, [value, isLoading]);

  const handleChange = useCallback(
    (newValue: string) => {
      validationFailedRef.current = false;
      setInputValue(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      const trimmed = newValue.trim();
      if (!trimmed) {
        onError(undefined);
        onResolved(0, '');
        return;
      }

      debounceRef.current = setTimeout(async () => {
        debounceRef.current = null;
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 0));
        const start = Date.now();
        try {
          const universeId = await getUniverseIdFromExperienceInput(trimmed);
          if (universeId === null) {
            validationFailedRef.current = true;
            reportErrorWhenDoneRef.current = true;
            return;
          }
          onResolved(universeId, trimmed);
          onError(undefined);
        } catch {
          validationFailedRef.current = true;
          reportErrorWhenDoneRef.current = true;
        } finally {
          const elapsed = Date.now() - start;
          if (minLoadingMs > 0 && elapsed < minLoadingMs) {
            await new Promise((resolve) => setTimeout(resolve, minLoadingMs - elapsed));
          }
          if (reportErrorWhenDoneRef.current) {
            reportErrorWhenDoneRef.current = false;
            onError('');
          }
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs, minLoadingMs, onError, onResolved],
  );

  return { inputValue, handleChange, isLoading };
}

export interface UseExperiencePrivacyCheckProps {
  universeId: number | undefined;
  isResolved: boolean;
  /** Called when experience is not permitted (private, archived, or draft). */
  onNotPermitted: () => void;
  onPublic?: () => void;
  minLoadingMs?: number;
}

export interface UseExperiencePrivacyCheckResult {
  isPrivate: boolean;
  isPublic: boolean;
  /** True when experience is not permitted: private, archived, or draft (not active). */
  isNotPermitted: boolean;
  isCheckingPrivacy: boolean;
  /** True while we know it's not permitted but haven't invoked onNotPermitted yet (min delay). Keep showing loading UI. */
  isNotPermittedPending: boolean;
}

/**
 * Fetches universe details for a resolved universe ID and invokes callbacks when
 * the experience is not permitted (private, archived, or draft) or is public.
 * Enforces a minimum loading time (same as invalid-experience flow) before calling
 * onNotPermitted so the spinner is visible for at least minLoadingMs before the error appears.
 */
export function useExperiencePrivacyCheck({
  universeId,
  isResolved,
  onNotPermitted,
  onPublic,
  minLoadingMs = MIN_LOADING_MS,
}: UseExperiencePrivacyCheckProps): UseExperiencePrivacyCheckResult {
  const notPermittedCheckStartTimeRef = useRef<number | null>(null);
  const [notPermittedReported, setNotPermittedReported] = useState(false);

  const universeDetailsQuery = useQuery({
    queryKey: ['universeDetails', universeId],
    queryFn: async () => {
      if (universeId == null) return null;
      const res = await developClient.getUniversesDetails([universeId]);
      return res.data?.[0] ?? null;
    },
    enabled: universeId != null,
  });

  const { data } = universeDetailsQuery;
  const isPrivate = data?.privacyType === 'Private';
  const isArchived = data?.isArchived === true;
  const isDraft = data?.isActive === false;
  const isNotPermitted = isPrivate || isArchived || isDraft;
  const isPublic =
    data != null &&
    data.privacyType === 'Public' &&
    data.isArchived !== true &&
    data.isActive !== false;
  const isCheckingPrivacy = data == null;
  const isNotPermittedPending = isNotPermitted && !notPermittedReported;

  useEffect(() => {
    if (universeId == null) {
      setNotPermittedReported(false);
    }
  }, [universeId]);

  useEffect(() => {
    if (universeId != null) {
      if (notPermittedCheckStartTimeRef.current === null) {
        notPermittedCheckStartTimeRef.current = Date.now();
      }
    } else {
      notPermittedCheckStartTimeRef.current = null;
    }
  }, [universeId]);

  useEffect(() => {
    if (isNotPermitted) {
      const startTime = notPermittedCheckStartTimeRef.current ?? Date.now();
      const elapsed = Date.now() - startTime;
      const delayMs = Math.max(0, minLoadingMs - elapsed);

      if (delayMs > 0) {
        const timeoutId = setTimeout(() => {
          setNotPermittedReported(true);
          onNotPermitted();
          notPermittedCheckStartTimeRef.current = null;
        }, delayMs);
        return () => clearTimeout(timeoutId);
      }

      setNotPermittedReported(true);
      onNotPermitted();
      notPermittedCheckStartTimeRef.current = null;
    } else if (isResolved && isPublic) {
      onPublic?.();
      notPermittedCheckStartTimeRef.current = null;
    }
    return undefined;
  }, [isNotPermitted, isResolved, isPublic, minLoadingMs, onNotPermitted, onPublic]);

  return { isPrivate, isPublic, isNotPermitted, isCheckingPrivacy, isNotPermittedPending };
}
