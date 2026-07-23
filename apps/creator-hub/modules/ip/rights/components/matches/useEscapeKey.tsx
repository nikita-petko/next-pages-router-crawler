import { useEffect, useCallback } from 'react';

const ESCAPE_KEY_ESC = 'Escape';

const useEscapeKey = (key: string, handleKey: () => void) => {
  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === key) {
        handleKey();
      }
    },
    [key, handleKey],
  );
  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey]);
};

export default useEscapeKey;
export { ESCAPE_KEY_ESC };
