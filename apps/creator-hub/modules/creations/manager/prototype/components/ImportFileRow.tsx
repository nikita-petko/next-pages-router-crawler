import { memo, useEffect, useMemo, type FunctionComponent } from 'react';
import {
  Icon,
  IconButton,
  ProgressBar,
  StatusIndicator,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import type { TStatusIndicatorColor } from '@rbx/foundation-ui';
import type { ImportFile, ImportFileStatus, ImportableFileType } from '../importStore';
import type { ImportQueueTranslations } from '../useImportQueueTranslations';

const STATUS_INDICATOR_COLORS: Record<ImportFileStatus, TStatusIndicatorColor> = {
  queued: 'Neutral',
  invalid: 'Alert',
  ready: 'Emphasis',
  importing: 'Warning',
  processing: 'Warning',
  uploaded: 'Success',
  moderation_pending: 'Warning',
  approved: 'Success',
  failed: 'Alert',
};

const FILE_TYPE_ICONS: Record<
  ImportableFileType,
  | 'icon-regular-image'
  | 'icon-regular-speaker'
  | 'icon-regular-video-camera'
  | 'icon-regular-file-box'
> = {
  image: 'icon-regular-image',
  audio: 'icon-regular-speaker',
  video: 'icon-regular-video-camera',
  unknown: 'icon-regular-file-box',
};

function isCompletedStatus(status: ImportFileStatus): boolean {
  return status === 'uploaded' || status === 'moderation_pending' || status === 'approved';
}

function useImagePreviewUrl(file: ImportFile): string | undefined {
  const previewUrl = useMemo(
    () => (file.fileType === 'image' ? URL.createObjectURL(file.file) : undefined),
    [file.file, file.fileType],
  );

  useEffect(() => {
    return () => {
      if (previewUrl != null) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return previewUrl;
}

type ImportAssetLockupProps = {
  file: ImportFile;
  translations: ImportQueueTranslations;
};

const ImportAssetLockup: FunctionComponent<ImportAssetLockupProps> = ({ file, translations }) => {
  const previewUrl = useImagePreviewUrl(file);
  const extension = file.extension.replace(/^\./, '').toLowerCase();
  const metadata = translations.fileMetadata(
    translations.fileTypeLabels[file.fileType],
    extension,
    file.fileSize,
  );
  const showUploadProgress = file.status === 'importing' && file.progress !== undefined;
  const showStatusLine = !showUploadProgress && !isCompletedStatus(file.status);

  return (
    <div className='flex items-center gap-medium grow-1 min-width-0'>
      <div className='size-1200 radius-small bg-shift-200 flex items-center justify-center shrink-0 clip'>
        {previewUrl != null ? (
          <img src={previewUrl} alt='' className='size-full [object-fit:contain]' />
        ) : (
          <Icon name={FILE_TYPE_ICONS[file.fileType]} size='Medium' className='content-muted' />
        )}
      </div>

      <div className='flex flex-col gap-xxsmall min-width-0 grow-1'>
        <span className='height-400 text-body-medium content-emphasis text-truncate-end min-width-0'>
          {file.displayName}
        </span>
        <span className='height-400 text-body-small content-muted text-truncate-end'>
          {metadata}
        </span>
        {showUploadProgress && (
          <div className='flex items-center height-400 width-full'>
            <ProgressBar
              variant='Determinate'
              value={file.progress}
              valuesLocation='None'
              ariaLabel={translations.fileUploadProgress}
              className='width-full'
            />
          </div>
        )}
        {file.assetId != null && (
          <div className='flex items-center height-400 min-width-0'>
            <Tooltip position='top-center' title={translations.clickToCopyAssetId}>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  className='text-body-small content-emphasis text-no-wrap bg-none stroke-none padding-none cursor-pointer'
                  onClick={() => {
                    void navigator.clipboard?.writeText(String(file.assetId));
                  }}>
                  {translations.assetId(file.assetId)}
                </button>
              </TooltipTrigger>
            </Tooltip>
          </div>
        )}
        {showStatusLine && (
          <div className='flex items-center height-400 gap-xsmall text-body-small content-default min-width-0'>
            <StatusIndicator
              aria-hidden
              color={file.errorType != null ? 'Alert' : STATUS_INDICATOR_COLORS[file.status]}
              size='Small'
            />
            <span className='text-truncate-end min-width-0'>
              {file.errorType != null
                ? translations.errorLabels[file.errorType](file.errorParameters)
                : translations.statusLabels[file.status]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export type ImportFileRowProps = {
  disabled: boolean;
  file: ImportFile;
  onRemoveFile: (fileId: string) => void;
  translations: ImportQueueTranslations;
};

const ImportFileRow: FunctionComponent<ImportFileRowProps> = ({
  disabled,
  file,
  onRemoveFile,
  translations,
}) => {
  return (
    <div className='flex items-center gap-small padding-x-small min-height-1800 [border-bottom:var(--stroke-thin)_solid_var(--color-stroke-default)] last:stroke-none hover:bg-shift-100'>
      <ImportAssetLockup file={file} translations={translations} />
      {isCompletedStatus(file.status) && (
        <Icon
          name='icon-regular-circle-check'
          size='Small'
          className='content-system-success shrink-0'
          aria-label={translations.statusLabels[file.status]}
        />
      )}
      <Tooltip position='top-center' title={translations.removeFromQueue}>
        <TooltipTrigger asChild>
          <IconButton
            ariaLabel={translations.removeFromQueue}
            className='shrink-0 [&_.icon]:content-muted'
            icon='icon-regular-trash-can'
            isDisabled={disabled || file.status === 'importing'}
            size='XSmall'
            variant='Utility'
            onClick={() => onRemoveFile(file.id)}
          />
        </TooltipTrigger>
      </Tooltip>
    </div>
  );
};

export default memo(ImportFileRow);
