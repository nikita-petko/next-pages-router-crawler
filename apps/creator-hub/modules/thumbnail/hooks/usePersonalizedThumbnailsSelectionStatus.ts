import { useEffect, useMemo, useState } from 'react';
import { useGetHomepageThumbnailsQuery } from '@modules/react-query/thumbnailPersonalization';

const emptyArray: string[] = [];

/**
 * Hook to manage the selection status of personalized thumbnails.
 * @param universeId - The ID of the universe.
 * @returns An object containing the selection status and functions to update it.
 */
const usePersonalizedThumbnailsSelectionStatus = (universeId: number) => {
  const { data: thumbnailsData, isPending } = useGetHomepageThumbnailsQuery(universeId);
  const initialActiveThumbnailIds = useMemo(
    () =>
      thumbnailsData?.thumbnails.filter(({ active }) => active).map(({ id }) => id) ?? emptyArray,
    [thumbnailsData?.thumbnails],
  );

  const [selectedThumbnailIds, setSelectedThumbnailIds] = useState(initialActiveThumbnailIds);
  useEffect(() => {
    if (!isPending) {
      setSelectedThumbnailIds(initialActiveThumbnailIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run once when initial load completes, that is when isLoading changes from true to false
  }, [isPending]);

  const isDirty = useMemo(() => {
    if (initialActiveThumbnailIds.length !== selectedThumbnailIds.length) {
      return true;
    }
    return initialActiveThumbnailIds.some((id) => !selectedThumbnailIds.includes(id));
  }, [initialActiveThumbnailIds, selectedThumbnailIds]);

  return useMemo(
    () => ({
      isDirty,
      initialActiveThumbnailIds,
      selectedThumbnailIds,
      updateSelectedThumbnailIds: setSelectedThumbnailIds,
    }),
    [isDirty, initialActiveThumbnailIds, selectedThumbnailIds],
  );
};

export default usePersonalizedThumbnailsSelectionStatus;
