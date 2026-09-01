import React, { useRef, useEffect, useCallback } from 'react';
import type { TTextInputProps } from '@rbx/foundation-ui';
import { TextInput } from '@rbx/foundation-ui';

const useBlurHandlerInStudioWebview = (givenHandleStringBlur?: () => void) => {
  const enabled = !!givenHandleStringBlur;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlerRef = useRef(givenHandleStringBlur);

  // Keep the handler ref up to date
  useEffect(() => {
    handlerRef.current = givenHandleStringBlur;
  }, [givenHandleStringBlur]);

  const debouncedBlurHandler = useCallback(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule the blur handler to be called after a short delay
    timeoutRef.current = setTimeout(() => {
      try {
        handlerRef.current?.();
      } catch {
        // no React.FocusEvent<HTMLInputElement> can be given, so there might be errors
        // in some implicit handlers that treat TextInputForWebview as a standard TextInput
      }
      timeoutRef.current = null;
    }, 0);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return () => {};
    }

    window.addEventListener('blur', debouncedBlurHandler);
    return () => {
      window.removeEventListener('blur', debouncedBlurHandler);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedBlurHandler, givenHandleStringBlur, enabled]);

  useEffect(() => {
    if (!enabled) {
      return () => {};
    }

    document.addEventListener('visibilitychange', debouncedBlurHandler);
    return () => {
      document.removeEventListener('visibilitychange', debouncedBlurHandler);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedBlurHandler, givenHandleStringBlur, enabled]);

  return {
    inputOnBlurHandler: debouncedBlurHandler,
  };
};

type TProps = TTextInputProps & { onBlur?: () => void };
const TextInputForWebview = React.forwardRef<HTMLInputElement, TProps>(
  ({ onBlur: handleStringBlur, ...props }: TProps, ref) => {
    const { inputOnBlurHandler } = useBlurHandlerInStudioWebview(handleStringBlur);
    return <TextInput {...props} onBlur={inputOnBlurHandler} ref={ref} />;
  },
);
TextInputForWebview.displayName = 'TextInputForWebview';

export default TextInputForWebview;
