import React, { useCallback } from 'react';
import { ColumnType, TableValueTypes } from '@modules/charts-generic';
import { makeStyles, useDialog } from '@rbx/ui';
import { PersonalizedThumbnail } from '@modules/react-query/thumbnailPersonalization';

const thumbnailWidth = 768;
const thumbnailHeight = 432;
const aspectRatio = thumbnailWidth / thumbnailHeight;

const useStyles = makeStyles()((theme) => {
  return {
    thumbnailDialogPaper: {
      backgroundColor: 'transparent',
    },
    thumbnailInDialog: {
      aspectRatio: `${aspectRatio}`,
      maxHeight: '100%',
      height: thumbnailHeight,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundColor: theme.palette.surface[200],
    },
  };
});

const useCreateThumbnailImageCellData = (): (({
  thumbnail,
  displayTextForSummaryRow,
}: {
  thumbnail?: PersonalizedThumbnail;
  displayTextForSummaryRow?: string;
}) => TableValueTypes[ColumnType.Image]) => {
  const {
    classes: { thumbnailInDialog, thumbnailDialogPaper },
  } = useStyles();
  const { open: openDialog, configure: configureDialog } = useDialog();
  const onClickThumbnail = useCallback(
    (src: string) => {
      configureDialog(
        <div
          className={thumbnailInDialog}
          style={{
            backgroundImage: `url(${src})`,
          }}
        />,
        {
          classes: { paper: thumbnailDialogPaper },
          maxWidth: false,
        },
      );
      openDialog();
    },
    [configureDialog, openDialog, thumbnailDialogPaper, thumbnailInDialog],
  );

  return useCallback(
    ({ thumbnail, displayTextForSummaryRow }) => ({
      type: ColumnType.Image,
      src: thumbnail?.imageUrl ?? '',
      displayTextForSummaryRow,
      width: 100,
      height: 100 / aspectRatio,
      onClick: thumbnail
        ? () => {
            onClickThumbnail(thumbnail.imageUrl);
          }
        : undefined,
      dataId: thumbnail ? `${thumbnail.assetId}` : undefined,
    }),
    [onClickThumbnail],
  );
};

export default useCreateThumbnailImageCellData;
