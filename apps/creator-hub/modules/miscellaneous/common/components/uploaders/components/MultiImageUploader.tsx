import React, { FunctionComponent, useCallback, useMemo, ReactNode } from 'react';
import { FileUploadBase } from '@modules/miscellaneous/common';
import { Button, List } from '@rbx/ui';
import ErrorMessage from './ErrorMessage';
import DragDropSort from './DragDropSort';
import PreviewListItem from './PreviewListItem';
import useMultiImageUploaderStyles from './MultiImageUploader.styles';
import { ImageDescription } from '../types';
import { bytesPerMB } from '../constants/size';
import FileRejectStatus from '../enums/FileRejectStatus';

export interface ImageRejectDescription {
  relatedFiles: File[];
}

export interface MultiImageUploaderProps {
  imageList: ImageDescription[];
  acceptedImageTypes: string[];
  uploadButtonText: string;
  placeholderForEmpty: string;
  errorMessage?: string[];
  maxSizeMB?: number;
  maxCount: number;
  onRemove: (key: string) => void;
  onReorder: (sourceIndexInOriginArray: number, destinationIndexInResultArray: number) => void;
  onAdd: (files: File[]) => void;
  onReject: (rejects: Map<FileRejectStatus, ImageRejectDescription>) => void;
  selectedKey?: string;
  onSelect?: (key: string) => void;
  imagePreview?: ReactNode;
}

function setFileRejectionToMap(
  rejects: Map<FileRejectStatus, ImageRejectDescription>,
  reason: FileRejectStatus,
  file: File,
): Map<FileRejectStatus, ImageRejectDescription> {
  const rejectDescription = rejects.get(reason) || {
    relatedFiles: [],
  };
  rejectDescription.relatedFiles.push(file);
  rejects.set(reason, rejectDescription);
  return rejects;
}

const MultiImageUploader: FunctionComponent<React.PropsWithChildren<MultiImageUploaderProps>> = ({
  errorMessage,
  maxCount,
  maxSizeMB,
  acceptedImageTypes,
  imageList,
  onAdd,
  onRemove,
  onReorder,
  onReject,
  onSelect,
  uploadButtonText,
  placeholderForEmpty,
  selectedKey,
  imagePreview,
}) => {
  const {
    classes: { previewList },
  } = useMultiImageUploaderStyles();
  const acceptedMimeTypes = useMemo(
    () => acceptedImageTypes.map((item) => `image/${item}`),
    [acceptedImageTypes],
  );
  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (files === null || files.length === 0) {
        return;
      }
      const fileRejectionMap = new Map<FileRejectStatus, ImageRejectDescription>();
      if (files.length + imageList.length > maxCount) {
        fileRejectionMap.set(FileRejectStatus.TooManyFiles, { relatedFiles: [] });
      }
      const fileList = Array.from(files);
      fileList.forEach((file) => {
        if (maxSizeMB && file.size > maxSizeMB * bytesPerMB) {
          setFileRejectionToMap(fileRejectionMap, FileRejectStatus.FileTooBig, file);
        }
        if (acceptedMimeTypes.indexOf(file.type) === -1) {
          setFileRejectionToMap(fileRejectionMap, FileRejectStatus.FileWrongType, file);
        }
      });
      if (fileRejectionMap.size > 0) {
        onReject(fileRejectionMap);
      } else {
        onAdd(fileList);
      }
    },
    [imageList, maxCount, onReject, acceptedMimeTypes, onAdd, maxSizeMB],
  );

  return (
    <div>
      <FileUploadBase
        accept={acceptedMimeTypes.join(',')}
        multiple
        size={maxSizeMB ? maxSizeMB * bytesPerMB : undefined}
        onChange={handleFileUpload}>
        {(onClick) => (
          <Button
            onClick={onClick}
            variant='outlined'
            color='primary'
            disabled={maxCount !== undefined && imageList.length >= maxCount}>
            {uploadButtonText}
          </Button>
        )}
      </FileUploadBase>
      <ErrorMessage errors={errorMessage ?? []} />
      {imagePreview}
      {imageList.length === 0 ? (
        placeholderForEmpty
      ) : (
        <List className={previewList}>
          <DragDropSort
            onReorder={onReorder}
            sortItems={imageList.map((image) => ({
              key: image.key,
              item: (
                <PreviewListItem
                  selected={selectedKey === image.key}
                  onClick={() => onSelect && onSelect(image.key)}
                  onRemove={() => onRemove(image.key)}
                  image={image}
                />
              ),
            }))}
          />
        </List>
      )}
    </div>
  );
};

export default MultiImageUploader;
