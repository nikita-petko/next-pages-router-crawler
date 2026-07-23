import type { FC } from 'react';
import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import type { Preview } from '@rbx/client-assets-upload-api/v1';
import { FeedbackBanner, Link } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button, makeStyles, Tooltip } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getGameDetailsUrl } from '@modules/miscellaneous/urls/www';
import useGetPlaceMediaQuery from '../hooks/useGetPlaceMediaQuery';
import useReorderThumbnailsForPlaceMutation from '../hooks/useReorderThumbnailsForPlaceMutation';
import type { Media } from '../types/Media';
import MediaList from './MediaList/MediaList';

const useStyles = makeStyles()((theme) => {
  return {
    actions: {
      position: 'sticky',
      bottom: 0,
      backgroundColor: theme.palette.content.inverse,
      padding: '16px 0',
    },
  };
});

type PlaceMediaListProps = {
  placeId: number;
  userId: number;
  isAssetUploading: boolean;
  videoPreview: Preview | undefined;
};

const PlaceMediaList: FC<PlaceMediaListProps> = ({
  placeId,
  userId,
  isAssetUploading,
  videoPreview,
}) => {
  const {
    classes: { actions },
  } = useStyles();
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());

  const { data: queriedPreviews, isPending, isError } = useGetPlaceMediaQuery(placeId, userId);
  const itemsOriginalOrder = useMemo(
    () => queriedPreviews?.map((preview) => preview.id),
    [queriedPreviews],
  );
  const [mediaItems, setMediaItems] = useState<Media[]>(queriedPreviews ?? []);
  const itemsOrderChanged = useMemo(() => {
    return (
      itemsOriginalOrder && mediaItems.some((item, index) => item.id !== itemsOriginalOrder[index])
    );
  }, [mediaItems, itemsOriginalOrder]);

  useEffect(() => {
    // update ordered lists when queried previews update
    // it happens due to user add a new thumbnail or delete a thumbnail
    if (!isPending && !isError && queriedPreviews) {
      setMediaItems(queriedPreviews ?? []);
    }
  }, [isError, isPending, queriedPreviews]);

  const { reorderThumbnailsForPlace, isUpdating } = useReorderThumbnailsForPlaceMutation();

  const onReorderConfirm = useCallback(async () => {
    reorderThumbnailsForPlace({
      placeId,
      newPreviewOrder: mediaItems.map((item) => item.id),
      videoPreview,
    });
  }, [mediaItems, placeId, reorderThumbnailsForPlace, videoPreview]);
  const onReorderCancel = useCallback(() => {
    setMediaItems(queriedPreviews ?? []);
  }, [queriedPreviews]);

  return (
    <>
      <MediaList
        mediaItems={mediaItems}
        updateMediaItems={setMediaItems}
        placeId={placeId}
        isAssetUploading={isAssetUploading}
      />
      {itemsOrderChanged && (
        <FeedbackBanner
          title={null}
          severity='Warning'
          variant='Standard'
          layout='Inline'
          description={translateHTML(
            translationKey(
              'Description.ReorderThumbnailsAlert',
              TranslationNamespace.PlaceThumbnails,
            ),
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link href={getGameDetailsUrl(placeId)} target='_blank' underline='always'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ],
          )}
        />
      )}
      <Flex gap={8} classes={{ root: actions }}>
        <Tooltip
          title={
            isAssetUploading
              ? translate(
                  translationKey(
                    'Label.WaitTilUploadFinishes',
                    TranslationNamespace.PlaceThumbnails,
                  ),
                )
              : undefined
          }>
          <span>
            <Button
              variant='outlined'
              onClick={onReorderCancel}
              color='secondary'
              disabled={
                mediaItems.length <= 1 || !itemsOrderChanged || isUpdating || isAssetUploading
              }>
              {translate(translationKey('Action.Cancel', TranslationNamespace.Controls))}
            </Button>
          </span>
        </Tooltip>
        <Tooltip
          title={
            isAssetUploading
              ? translate(
                  translationKey(
                    'Label.WaitTilUploadFinishes',
                    TranslationNamespace.PlaceThumbnails,
                  ),
                )
              : undefined
          }>
          <span>
            <Button
              variant='contained'
              disabled={mediaItems.length <= 1 || !itemsOrderChanged || isAssetUploading}
              loading={isUpdating}
              onClick={onReorderConfirm}>
              {translate(translationKey('Label.SaveChange', TranslationNamespace.PlaceThumbnails))}
            </Button>
          </span>
        </Tooltip>
      </Flex>
    </>
  );
};

export default memo(PlaceMediaList);
