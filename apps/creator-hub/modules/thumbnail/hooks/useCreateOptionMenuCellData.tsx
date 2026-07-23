import React, { useCallback, useEffect, useRef } from 'react';
import { ColumnType, TableValueTypes } from '@modules/charts-generic';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation } from '@rbx/intl';
import {
  PersonalizedThumbnail,
  useDeleteHomepageThumbnailMutation,
} from '@modules/react-query/thumbnailPersonalization';
import { useDialog, DialogTemplate } from '@rbx/ui';
import useReplaceThumbnail from './useReplaceThumbnail';
import { FileUploaderId, useFileUploader } from '../context/FileUploaderProvider';
import { acceptMimeTypes } from '../constants/homepageThumbnails';

enum ThumbnailOptionMenuAction {
  Replace = 'Replace',
  Delete = 'Delete',
}

const useCreateOptionMenuCellData = (
  universeId: number,
  onThumbnailsRemove: (removedThumbnailIds: string[]) => void,
  initialActiveThumbnailIds: string[],
): ((
  thumbnail: PersonalizedThumbnail,
  showReplaceOption?: boolean,
) => TableValueTypes<ThumbnailOptionMenuAction>[ColumnType.Actions]) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { register, openFileBrowser } = useFileUploader();

  const replaceThumbnailOption = translate(
    translationKey('Description.Table.ReplaceThumbnail', TranslationNamespace.Analytics),
  );

  /** beginning of replacing thumbnail callback */
  const onReplaceSucceed = useCallback(
    (replacedThumbnailId: string) => {
      onThumbnailsRemove([replacedThumbnailId]);
    },
    [onThumbnailsRemove],
  );
  const { replaceThumbnail } = useReplaceThumbnail(universeId, onReplaceSucceed);
  const thumbnailIdToReplaceRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    return register(FileUploaderId.ThumbnailTableFileReplacer, {
      acceptMimeTypes,
      handleChange: (files: FileList | null) => {
        if (files === null || files.length === 0) {
          return;
        }
        replaceThumbnail(files[0], thumbnailIdToReplaceRef.current ?? '');
        thumbnailIdToReplaceRef.current = undefined;
      },
    });
  }, [register, replaceThumbnail]);
  /** end of replacing thumbnail callback */

  const deleteThumbnailOption = translate(
    translationKey('Description.Table.DeleteThumbnail', TranslationNamespace.Analytics),
  );

  /** beginning of deleting thumbnail callback */
  const { open: openDialog, configure: configureDialog, close: closeDialog } = useDialog();
  const onSuccessDelete = useCallback(
    (deletedThumbnailIds: string[]) => {
      closeDialog();
      onThumbnailsRemove(deletedThumbnailIds);
    },
    [closeDialog, onThumbnailsRemove],
  );
  const { deleteHomepageThumbnails } = useDeleteHomepageThumbnailMutation(
    universeId,
    true,
    onSuccessDelete,
  );
  const onClickDelete = useCallback(
    (thumbnailId: string) => {
      const isDeletingActiveThumbnail = initialActiveThumbnailIds.includes(thumbnailId);
      configureDialog(
        <DialogTemplate
          color='destructive'
          variant='alert'
          title={translate(
            isDeletingActiveThumbnail
              ? translationKey('Title.DeleteActiveThumbnail', TranslationNamespace.PlaceThumbnails)
              : translationKey(
                  'Title.DeleteInactiveThumbnail',
                  TranslationNamespace.PlaceThumbnails,
                ),
          )}
          content={translate(
            isDeletingActiveThumbnail
              ? translationKey(
                  'Label.ConfirmDeleteActiveHomepageThumbnail',
                  TranslationNamespace.PlaceThumbnails,
                )
              : translationKey(
                  'Label.ConfirmDeleteHomepageThumbnail',
                  TranslationNamespace.PlaceThumbnails,
                ),
          )}
          cancelText={translate(
            translationKey('Label.Cancel', TranslationNamespace.PlaceThumbnails),
          )}
          confirmText={translate(
            translationKey('Label.YesDelete', TranslationNamespace.PlaceThumbnails),
          )}
          onConfirm={() => {
            deleteHomepageThumbnails([thumbnailId]);
          }}
          onCancel={closeDialog}
        />,
      );
      openDialog();
    },
    [
      closeDialog,
      configureDialog,
      deleteHomepageThumbnails,
      initialActiveThumbnailIds,
      openDialog,
      translate,
    ],
  );
  /** end of deleting thumbnail callback */

  return useCallback(
    (
      thumbnail: PersonalizedThumbnail,
      showReplaceOption?: boolean,
    ): TableValueTypes<ThumbnailOptionMenuAction>[ColumnType.Actions] => {
      const { id } = thumbnail;
      return {
        type: ColumnType.Actions,
        actions: showReplaceOption
          ? [
              {
                actionType: ThumbnailOptionMenuAction.Replace,
                displayLabel: replaceThumbnailOption,
                actionOn: id,
                renderedAsInNonCompactTable: 'menu-item',
                onActionInvoked: () => {
                  thumbnailIdToReplaceRef.current = thumbnail.id;
                  openFileBrowser(FileUploaderId.ThumbnailTableFileReplacer);
                },
              },
            ]
          : [
              {
                actionType: ThumbnailOptionMenuAction.Delete,
                displayLabel: deleteThumbnailOption,
                actionOn: id,
                renderedAsInNonCompactTable: 'menu-item',
                color: 'error',
                // disable delete option if the thumbnail is the only active thumbnail
                disabled:
                  initialActiveThumbnailIds.length === 1 && initialActiveThumbnailIds.includes(id),
                onActionInvoked: () => onClickDelete(thumbnail.id),
              },
            ],
      };
    },
    [
      deleteThumbnailOption,
      initialActiveThumbnailIds,
      onClickDelete,
      openFileBrowser,
      replaceThumbnailOption,
    ],
  );
};

export default useCreateOptionMenuCellData;
