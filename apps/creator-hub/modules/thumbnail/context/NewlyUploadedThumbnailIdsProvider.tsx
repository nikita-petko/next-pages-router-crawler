import React, { FC, useState, useMemo, createContext, useContext } from 'react';

type TNewlyUploadedThumbnailIdsContext = {
  newlyUploadedThumbnailIds: string[];
  setNewlyUploadedThumbnailIds: React.Dispatch<React.SetStateAction<string[]>>;
};

const NewlyUploadedThumbnailIdsContext = createContext<TNewlyUploadedThumbnailIdsContext>({
  newlyUploadedThumbnailIds: [],
  setNewlyUploadedThumbnailIds: () => {
    throw new Error('useFileUploader is invoked without FileUploaderProvider');
  },
});

export const useNewlyUploadedThumbnailIdsContext = () => {
  return useContext(NewlyUploadedThumbnailIdsContext);
};

export const NewlyUploadedThumbnailIdsProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const [newlyUploadedThumbnailIds, setNewlyUploadedThumbnailIds] = useState<string[]>([]);

  const providerValue: TNewlyUploadedThumbnailIdsContext = useMemo(
    () => ({
      newlyUploadedThumbnailIds,
      setNewlyUploadedThumbnailIds,
    }),
    [newlyUploadedThumbnailIds],
  );

  return (
    <NewlyUploadedThumbnailIdsContext.Provider value={providerValue}>
      {children}
    </NewlyUploadedThumbnailIdsContext.Provider>
  );
};
