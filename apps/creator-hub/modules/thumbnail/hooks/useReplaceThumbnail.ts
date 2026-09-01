import { useCallback, useMemo, useRef } from 'react';
import {
  useDeleteHomepageThumbnailMutation,
  useUploadMultipleHomepageThumbnailsMutation,
} from '@modules/react-query/thumbnailPersonalization';

/** Replace thumbnail steps:
 * 1. upload new thumbnail
 * 2. delete old thumbnail iff upload success
 * 3. in case of either upload failure or delete failure, the thumbnail will be left as is
 *    notice if upload succeeds but delete fails, we leave the old thumbnail as is. Since delete
 *    failure is quite rare, and user can always retry deleting the old thumbnail manually, this
 *    is the trade-off we are willing to make.
 */
const useReplaceThumbnail = (
  universeId: number,
  onSuccess?: (replacedThumbnailId: string) => void,
  onError?: () => void,
) => {
  const thumbnailIdToReplaceRef = useRef<string | null>(null);

  const onSuccessfulDelete = useCallback(() => {
    if (!thumbnailIdToReplaceRef.current) {
      throw new Error('no thumbnail id to replace');
    }
    onSuccess?.(thumbnailIdToReplaceRef.current);
    thumbnailIdToReplaceRef.current = null;
  }, [onSuccess, thumbnailIdToReplaceRef]);
  const onDeleteFailure = useCallback(() => {
    onError?.();
    thumbnailIdToReplaceRef.current = null;
  }, [onError]);
  const { deleteHomepageThumbnails, isDeleting } = useDeleteHomepageThumbnailMutation(
    universeId,
    false,
    onSuccessfulDelete,
    onDeleteFailure,
  );

  const onSuccessfulUpload = useCallback(() => {
    if (!thumbnailIdToReplaceRef.current) {
      throw new Error('no thumbnail id to replace');
    }
    deleteHomepageThumbnails([thumbnailIdToReplaceRef.current]);
  }, [deleteHomepageThumbnails]);
  const onUploadFailure = useCallback(() => {
    onError?.();
    thumbnailIdToReplaceRef.current = null;
  }, [onError]);

  const { uploadMultipleThumbnailsForUniverse, isUploading } =
    useUploadMultipleHomepageThumbnailsMutation(universeId, onSuccessfulUpload, onUploadFailure);

  const replaceThumbnail = useCallback(
    (file: File, thumbnailIdToReplace: string) => {
      thumbnailIdToReplaceRef.current = thumbnailIdToReplace;
      uploadMultipleThumbnailsForUniverse([file]);
    },
    [uploadMultipleThumbnailsForUniverse],
  );

  return useMemo(
    () => ({
      replaceThumbnail,
      isReplacing: isUploading || isDeleting,
    }),
    [isDeleting, isUploading, replaceThumbnail],
  );
};

export default useReplaceThumbnail;
