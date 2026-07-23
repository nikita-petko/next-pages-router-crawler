import React, { FunctionComponent } from 'react';
import { FileUploadBase } from '@modules/miscellaneous/common';
import { bytesPerMB } from '@modules/miscellaneous/common/components/uploaders/constants/size';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import CsvUploadFailureStatus from '../../enums/CsvUploadFailureStatus';
import { acceptedCsvMimeTypes } from '../../constants/CsvParsingConstants';

export interface CsvUploaderProps {
  uploadedFile: File | null;
  maxSizeMB?: number;
  onUpload: (file: File) => void;
  onRejected: (error: CsvUploadFailureStatus | null) => void;
}

const CsvUploader: FunctionComponent<React.PropsWithChildren<CsvUploaderProps>> = ({
  uploadedFile,
  maxSizeMB,
  onUpload,
  onRejected,
}) => {
  const { translate } = useTranslation();

  const handleFileUpload = (files: FileList | File | null) => {
    onRejected(null);
    if (files === null) {
      return;
    }
    let file: File | null = null;
    if (files instanceof FileList) {
      if (files.length > 1) {
        onRejected(CsvUploadFailureStatus.TooManyFiles);
        return;
      }
      if (files.length === 1) {
        file = files.item(0);
      }
    } else if (files instanceof File) {
      file = files;
    }
    if (file === null) {
      return;
    }
    if (maxSizeMB && file.size > maxSizeMB * bytesPerMB) {
      onRejected(CsvUploadFailureStatus.FileSizeTooLarge);
      return;
    }
    if (!acceptedCsvMimeTypes.has(file.type)) {
      onRejected(CsvUploadFailureStatus.InvalidFileType);
      return;
    }
    onUpload(file);
  };

  return (
    <div>
      <FileUploadBase
        accept='.csv'
        size={maxSizeMB ? maxSizeMB * bytesPerMB : undefined}
        onChange={handleFileUpload}>
        {(onClick) => (
          <Button
            onClick={onClick}
            variant='contained'
            color='primaryBrand'
            disabled={uploadedFile !== null}>
            {uploadedFile !== null ? translate('Label.Uploading') : translate('Label.UploadCsv')}
          </Button>
        )}
      </FileUploadBase>
    </div>
  );
};

export default CsvUploader;
