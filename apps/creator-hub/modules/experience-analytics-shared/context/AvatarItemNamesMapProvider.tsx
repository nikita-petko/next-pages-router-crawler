import type { FC } from 'react';
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

type AvatarItemNamesMapContextType = {
  avatarItemNamesMap: ReadonlyMap<string, string>;
  setAvatarItemNamesMap: (map: ReadonlyMap<string, string>) => void;
};

const emptyAvatarItemNamesMap = new Map<string, string>();

const AvatarItemNamesMapContext = createContext<AvatarItemNamesMapContextType>({
  avatarItemNamesMap: emptyAvatarItemNamesMap,
  setAvatarItemNamesMap: () => {},
});

export const useAvatarItemNamesMapFromContext = (): AvatarItemNamesMapContextType => {
  return useContext(AvatarItemNamesMapContext);
};

type AvatarItemNamesMapProviderProps = {
  children: React.ReactNode;
  initialMap?: ReadonlyMap<string, string>;
};

export const AvatarItemNamesMapProvider: FC<AvatarItemNamesMapProviderProps> = ({
  children,
  initialMap,
}) => {
  const [mapState, setMapState] = useState(() => ({
    source: initialMap,
    value: initialMap ?? emptyAvatarItemNamesMap,
  }));
  const hasNewInitialMap = initialMap !== undefined && initialMap !== mapState.source;
  const avatarItemNamesMap = hasNewInitialMap ? initialMap : mapState.value;

  if (hasNewInitialMap) {
    setMapState({
      source: initialMap,
      value: initialMap,
    });
  }

  const setAvatarItemNamesMap = useCallback((map: ReadonlyMap<string, string>) => {
    setMapState((currentState) => ({
      ...currentState,
      value: map,
    }));
  }, []);

  const value = useMemo(
    () => ({
      avatarItemNamesMap,
      setAvatarItemNamesMap,
    }),
    [avatarItemNamesMap, setAvatarItemNamesMap],
  );

  return (
    <AvatarItemNamesMapContext.Provider value={value}>
      {children}
    </AvatarItemNamesMapContext.Provider>
  );
};

export default AvatarItemNamesMapProvider;
