import React, { useCallback, useContext, useMemo, useState, useTransition } from 'react';

type ActivatedAnnotationContextType = {
  activeAnnotationId: string | null;
  updateActiveAnnotationId?: (id: string | null) => void;
};

const ActivatedAnnotationContext = React.createContext<ActivatedAnnotationContextType>({
  activeAnnotationId: null,
  updateActiveAnnotationId: undefined,
});

export const useActivatedAnnotation = () => {
  return useContext(ActivatedAnnotationContext);
};

export const ActivatedAnnotationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  // Use transition to handle rapid hover events on annotations smoothly,
  // preventing UI blocking when many annotations are present
  const [, startTransition] = useTransition();
  const updateActiveAnnotationId = useCallback(
    (newActiveAnnotationId: string | null) => {
      startTransition(() => {
        setActiveAnnotationId(newActiveAnnotationId);
      });
    },
    [startTransition],
  );

  const value = useMemo(
    () => ({
      activeAnnotationId,
      updateActiveAnnotationId,
    }),
    [activeAnnotationId, updateActiveAnnotationId],
  );

  return (
    <ActivatedAnnotationContext.Provider value={value}>
      {children}
    </ActivatedAnnotationContext.Provider>
  );
};
