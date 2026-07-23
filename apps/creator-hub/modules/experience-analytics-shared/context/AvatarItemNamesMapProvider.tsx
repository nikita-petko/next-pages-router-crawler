import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  FC,
} from 'react';

type AvatarItemNamesMapContextType = {
  avatarItemNamesMap: ReadonlyMap<string, string>;
  setAvatarItemNamesMap: (map: ReadonlyMap<string, string>) => void;
};

const AvatarItemNamesMapContext = createContext<AvatarItemNamesMapContextType>({
  avatarItemNamesMap: new Map(),
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
  const [avatarItemNamesMap, setAvatarItemNamesMapState] = useState<ReadonlyMap<string, string>>(
    initialMap ?? new Map(),
  );

  // Sync from parent when initialMap is updated (e.g. after async fetch in MigratedAvatarTabContent)
  useEffect(() => {
    if (initialMap !== undefined) {
      setAvatarItemNamesMapState(initialMap);
    }
  }, [initialMap]);

  const setAvatarItemNamesMap = useCallback((map: ReadonlyMap<string, string>) => {
    setAvatarItemNamesMapState(map);
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
