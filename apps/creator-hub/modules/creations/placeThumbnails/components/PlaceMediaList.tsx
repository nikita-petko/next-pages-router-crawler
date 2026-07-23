import React, { FC, useState, useCallback, useEffect, useMemo, memo } from 'react';
import { Alert, Button, Collapse, Link, makeStyles, Tooltip } from '@rbx/ui';
import { Preview } from '@rbx/clients/assetsUploadApi';
import { Flex } from '@modules/miscellaneous/common/components';
import { useTranslation } from '@rbx/intl';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { getGameDetailsUrl } from '@modules/miscellaneous/common/urls/www';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import MediaList from './MediaList/MediaList';
import useReorderThumbnailsForPlaceMutation from '../hooks/useReorderThumbnailsForPlaceMutation';
import useGetPlaceMediaQuery from '../hooks/useGetPlaceMediaQuery';
import { Media } from '../types/Media';

const useStyles = makeStyles()((theme) => {
  return {
    alert: {
      marginBottom: '14px',
    },
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
    classes: { alert, actions },
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
    <React.Fragment>
      <Collapse in={itemsOrderChanged} mountOnEnter unmountOnExit>
        <Alert color='info' classes={{ root: alert }}>
          {translateHTML(
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
                    <Link
                      href={getGameDetailsUrl(placeId)}
                      target='_blank'
                      underline='always'
                      color='inherit'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ],
          )}
        </Alert>
      </Collapse>
      <MediaList
        mediaItems={mediaItems}
        updateMediaItems={setMediaItems}
        placeId={placeId}
        isAssetUploading={isAssetUploading}
      />
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
    </React.Fragment>
  );
};

export default memo(PlaceMediaList);
