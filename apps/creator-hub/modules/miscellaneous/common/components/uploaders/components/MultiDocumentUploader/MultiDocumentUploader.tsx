import React, { FunctionComponent, useCallback, useState, Ref, forwardRef } from 'react';
import { FileUploadBase } from '@modules/miscellaneous/common';
import {
  Button,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  DescriptionIcon,
  Typography,
  DeleteIcon,
} from '@rbx/ui';
import ErrorMessage from '../ErrorMessage';
import DragDropSort from '../DragDropSort';
import { bytesPerMB } from '../../constants/size';
import FileRejectStatus from '../../enums/FileRejectStatus';
import useMultiDocumentUploaderStyles from './MultiDocumentUploader.styles';

interface DocPreviewListItemProps {
  name: string;
  onRemove: () => void;
}

const DocPreviewListItem = forwardRef(function DocPreviewListItem(
  props: DocPreviewListItemProps,
  ref: Ref<HTMLDivElement>,
) {
  const { name, onRemove, ...otherProps } = props;
  const {
    classes: { listItemText },
  } = useMultiDocumentUploaderStyles();
  return (
    <div {...otherProps} ref={ref}>
      <ListItem>
        <DescriptionIcon />
        <ListItemText primary={name} className={listItemText} />
        <ListItemSecondaryAction>
          <IconButton aria-label='delete' color='secondary' onClick={onRemove} size='large'>
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    </div>
  );
});

export interface Doc {
  key: string; // we use file URL as the key
  name: string;
  file?: File;
}

export interface MultiDocumentUploaderProps {
  documentList: Doc[];
  acceptedMIMETypes: string[];
  uploadButtonText: string;
  placeholderForEmpty: string;
  errorMessage: string[];
  maxSizeMB?: number;
  maxCount: number;
  extraInformationText?: string;
  onRemove: (key: string) => void;
  onReorder: (sourceIndexInOriginArray: number, destinationIndexInResultArray: number) => void;
  onAdd: (files: File[]) => void;
  onReject: (rejects: Map<FileRejectStatus, File[]>) => void;
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  // eslint-disable-next-line react/no-unused-prop-types
  selectedKey?: string;
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  // eslint-disable-next-line react/no-unused-prop-types
  onSelect?: (key: string) => void;
}

function setFileRejectionToMap(
  rejects: Map<FileRejectStatus, File[]>,
  reason: FileRejectStatus,
  file: File,
): Map<FileRejectStatus, File[]> {
  const rejectedFiles = rejects.get(reason) || [];
  rejectedFiles.push(file);
  rejects.set(reason, rejectedFiles);
  return rejects;
}

const MultiDocumentUploader: FunctionComponent<
  React.PropsWithChildren<MultiDocumentUploaderProps>
> = ({
  errorMessage,
  maxCount,
  maxSizeMB,
  acceptedMIMETypes,
  documentList,
  onAdd,
  onRemove,
  onReorder,
  onReject,
  uploadButtonText,
  placeholderForEmpty,
  extraInformationText,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      setDragActive(false);
      if (files === null || files.length === 0) {
        return;
      }
      const fileRejectionMap = new Map<FileRejectStatus, File[]>();
      if (files.length + documentList.length > maxCount) {
        fileRejectionMap.set(FileRejectStatus.TooManyFiles, []);
      }
      const filesList = Array.from(files);
      filesList.forEach((file) => {
        if (maxSizeMB && file.size > maxSizeMB * bytesPerMB) {
          setFileRejectionToMap(fileRejectionMap, FileRejectStatus.FileTooBig, file);
        }
        if (acceptedMIMETypes.indexOf(file.type) === -1) {
          setFileRejectionToMap(fileRejectionMap, FileRejectStatus.FileWrongType, file);
        }
      });
      if (fileRejectionMap.size > 0) {
        onReject(fileRejectionMap);
      } else {
        onAdd(filesList);
      }
    },
    [documentList, maxCount, onReject, acceptedMIMETypes, onAdd, maxSizeMB],
  );

  const {
    classes: {
      container,
      uploadButtonContainer,
      fileUploadContentContainer,
      dragDropActive,
      fileList,
      addMediaButton,
    },
  } = useMultiDocumentUploaderStyles();

  return (
    <React.Fragment>
      <Container disableGutters maxWidth={false} className={container}>
        <FileUploadBase
          accept={acceptedMIMETypes.join(',')}
          multiple
          size={maxSizeMB ? maxSizeMB * bytesPerMB : undefined}
          onChange={handleFileUpload}
          onDragActiveHandler={() => setDragActive(true)}
          onDragLeaveHandler={() => setDragActive(false)}
          className={uploadButtonContainer}>
          {(onClick, _, onDrop, onDragOverOrEnter, onDragLeave) => (
            <div
              onDrop={onDrop}
              onDragEnter={onDragOverOrEnter}
              onDragOver={onDragOverOrEnter}
              onDragLeave={onDragLeave}
              className={`${fileUploadContentContainer} ${dragActive ? dragDropActive : ''}`}>
              <Button
                onClick={onClick}
                variant='outlined'
                color='primary'
                disabled={maxCount !== undefined && documentList.length >= maxCount}
                className={addMediaButton}>
                {uploadButtonText}
              </Button>
              {errorMessage.length > 0 && <ErrorMessage errors={errorMessage} alert />}
              {documentList.length === 0 ? (
                <Typography variant='body1' color='secondary' gutterBottom>
                  {placeholderForEmpty}
                </Typography>
              ) : (
                <List className={fileList}>
                  <DragDropSort
                    onReorder={onReorder}
                    sortItems={documentList.map((doc) => ({
                      key: doc.key,
                      item: (
                        <DocPreviewListItem name={doc.name} onRemove={() => onRemove(doc.key)} />
                      ),
                    }))}
                  />
                </List>
              )}
            </div>
          )}
        </FileUploadBase>
      </Container>
      {extraInformationText && (
        <Typography variant='captionHeader' color='secondary'>
          {extraInformationText}
        </Typography>
      )}
    </React.Fragment>
  );
};

export default MultiDocumentUploader;
