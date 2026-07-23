import React, {
  FunctionComponent,
  useContext,
  createContext,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useGetThumbnailUrlsMap } from '../utils/thumbnailsUtils';

type ThumbnailUrlsMapBundle = {
  thumbnailUrlsMap: ReadonlyMap<string, string>;
  addAssetIds: (ids: number[]) => void;
};
export const ThumbnailUrlsMapContext = createContext<ThumbnailUrlsMapBundle>({
  thumbnailUrlsMap: new Map<string, string>(),
  addAssetIds: () => {},
});
ThumbnailUrlsMapContext.displayName = 'LocaleMapContext';

export const useThumbnailUrlsMapFromContext = (): ThumbnailUrlsMapBundle => {
  return useContext(ThumbnailUrlsMapContext);
};
export const ThumbnailUrlsMapProvider: FunctionComponent<React.PropsWithChildren> = ({
  children,
}) => {
  const [assetIds, setAssetIds] = useState<Set<number>>(new Set<number>());

  const { data: thumbnailUrlsMap } = useGetThumbnailUrlsMap(Array.from(assetIds));

  const addAssetIds = useCallback(
    (ids: number[]) => {
      const newIds = new Set(ids.filter((id) => !Number.isNaN(id)));
      setAssetIds((prev) => {
        prev.forEach((id) => {
          newIds.add(id);
        });
        return newIds;
      });
    },
    [setAssetIds],
  );

  const context = useMemo(() => {
    return {
      thumbnailUrlsMap,
      addAssetIds,
    };
  }, [thumbnailUrlsMap, addAssetIds]);

  return (
    <ThumbnailUrlsMapContext.Provider value={context}>{children}</ThumbnailUrlsMapContext.Provider>
  );
};
