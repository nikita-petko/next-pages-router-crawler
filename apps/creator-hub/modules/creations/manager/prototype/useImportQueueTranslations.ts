import { useMemo, type ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type {
  ImportFileError,
  ImportFileErrorParameters,
  ImportFileStatus,
  ImportableFileType,
} from './importStore';

const CREATIONS_NAMESPACE = TranslationNamespace.Creations;
const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE;

type ImportQueueTranslationFunctions = Pick<
  ReturnType<typeof useTranslationWrapper>,
  'tPendingHtmlTranslation' | 'tPendingTranslation'
>;

const buildImportQueueTranslations = ({
  tPendingHtmlTranslation,
  tPendingTranslation,
}: ImportQueueTranslationFunctions) => {
  const fileTypeLabels: Record<ImportableFileType, string> = {
    image: tPendingTranslation(
      'Image',
      'File type label for an image in the bulk asset upload queue.',
      translationKey('Label.BulkUpload.FileType.Image', CREATIONS_NAMESPACE),
    ),
    audio: tPendingTranslation(
      'Audio',
      'File type label for audio in the bulk asset upload queue.',
      translationKey('Label.BulkUpload.FileType.Audio', CREATIONS_NAMESPACE),
    ),
    video: tPendingTranslation(
      'Video',
      'File type label for video in the bulk asset upload queue.',
      translationKey('Label.BulkUpload.FileType.Video', CREATIONS_NAMESPACE),
    ),
    unknown: tPendingTranslation(
      'Unknown',
      'File type label for an unsupported file in the bulk asset upload queue.',
      translationKey('Label.BulkUpload.FileType.Unknown', CREATIONS_NAMESPACE),
    ),
  };

  const errorLabels: Record<ImportFileError, (parameters?: ImportFileErrorParameters) => string> = {
    missing_creator_scope: () =>
      tPendingTranslation(
        'No creator/inventory scope specified. Ensure you are logged in.',
        'Error shown when a file cannot be uploaded because no creator scope is available.',
        translationKey('Message.BulkUpload.MissingCreatorScope', CREATIONS_NAMESPACE),
      ),
    unsupported_asset_type: () =>
      tPendingTranslation(
        'Unsupported asset type for upload',
        'Error shown when a file maps to an unsupported asset type.',
        translationKey('Message.BulkUpload.UnsupportedAssetType', CREATIONS_NAMESPACE),
      ),
    missing_asset_id: () =>
      tPendingTranslation(
        'Upload completed but no asset ID returned.',
        'Error shown when an upload operation completes without returning an asset ID.',
        translationKey('Message.BulkUpload.MissingAssetId', CREATIONS_NAMESPACE),
      ),
    unsupported_file_type: (parameters) =>
      tPendingTranslation(
        'Unsupported file type: {extension}',
        'Error shown for a file extension that bulk asset upload does not support.',
        translationKey('Message.BulkUpload.UnsupportedFileType', CREATIONS_NAMESPACE),
        { extension: parameters?.extension ?? '—' },
      ),
    file_too_large: (parameters) =>
      tPendingTranslation(
        'File too large ({fileSizeMB} MB). Maximum is {maxFileSizeMB} MB.',
        'Error shown when a file exceeds the size limit for its asset type.',
        translationKey('Message.BulkUpload.FileTooLarge', CREATIONS_NAMESPACE),
        {
          fileSizeMB: new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(
            parameters?.fileSizeMB ?? 0,
          ),
          maxFileSizeMB: new Intl.NumberFormat().format(parameters?.maxFileSizeMB ?? 0),
        },
      ),
    empty_file: () =>
      tPendingTranslation(
        'File is empty (0 bytes).',
        'Error shown when an empty file is added to the bulk asset upload queue.',
        translationKey('Message.BulkUpload.EmptyFile', CREATIONS_NAMESPACE),
      ),
    upload_failed: () =>
      tPendingTranslation(
        'Upload failed. Try again.',
        'Error shown when a bulk asset upload request fails.',
        translationKey('Message.BulkUpload.UploadFailed', CREATIONS_NAMESPACE),
      ),
  };

  const fileSizeUnits = {
    bytes: tPendingTranslation(
      'B',
      'Abbreviated byte unit in bulk upload file metadata.',
      translationKey('Label.BulkUpload.FileSizeUnit.Bytes', CREATIONS_NAMESPACE),
    ),
    kilobytes: tPendingTranslation(
      'KB',
      'Abbreviated kilobyte unit in bulk upload file metadata.',
      translationKey('Label.BulkUpload.FileSizeUnit.Kilobytes', CREATIONS_NAMESPACE),
    ),
    megabytes: tPendingTranslation(
      'MB',
      'Abbreviated megabyte unit in bulk upload file metadata.',
      translationKey('Label.BulkUpload.FileSizeUnit.Megabytes', CREATIONS_NAMESPACE),
    ),
  };

  const statusLabels: Record<ImportFileStatus, string> = {
    queued: tPendingTranslation(
      'Queued',
      'Status for a file waiting in the bulk asset upload queue.',
      translationKey('Label.BulkUpload.Status.Queued', CREATIONS_NAMESPACE),
    ),
    invalid: tPendingTranslation(
      'Invalid',
      'Status for an invalid file in the bulk asset upload queue.',
      translationKey('Label.BulkUpload.Status.Invalid', CREATIONS_NAMESPACE),
    ),
    ready: tPendingTranslation(
      'Ready',
      'Status for a file ready to upload.',
      translationKey('Label.BulkUpload.Status.Ready', CREATIONS_NAMESPACE),
    ),
    importing: tPendingTranslation(
      'Importing...',
      'Status for a file that is currently uploading.',
      translationKey('Label.BulkUpload.Status.Importing', CREATIONS_NAMESPACE),
    ),
    processing: tPendingTranslation(
      'Processing',
      'Status for an accepted upload that is still processing.',
      translationKey('Label.BulkUpload.Status.Processing', CREATIONS_NAMESPACE),
    ),
    uploaded: tPendingTranslation(
      'Uploaded',
      'Status for a file that finished uploading.',
      translationKey('Label.BulkUpload.Status.Uploaded', CREATIONS_NAMESPACE),
    ),
    moderation_pending: tPendingTranslation(
      'Moderation pending',
      'Status for an uploaded asset awaiting moderation.',
      translationKey('Label.BulkUpload.Status.ModerationPending', CREATIONS_NAMESPACE),
    ),
    approved: tPendingTranslation(
      'Available',
      'Status for an uploaded asset that is available.',
      translationKey('Label.BulkUpload.Status.Available', CREATIONS_NAMESPACE),
    ),
    failed: tPendingTranslation(
      'Failed',
      'Status for a file that failed to upload.',
      translationKey('Label.BulkUpload.Status.Failed', CREATIONS_NAMESPACE),
    ),
  };

  return {
    addFiles: tPendingTranslation(
      'Add files',
      'Button that adds more files to the bulk asset upload queue.',
      translationKey('Action.BulkUpload.AddFiles', CREATIONS_NAMESPACE),
    ),
    addFilesToImport: tPendingTranslation(
      'Add files to import',
      'Heading for an empty bulk asset upload drop zone.',
      translationKey('Heading.BulkUpload.AddFiles', CREATIONS_NAMESPACE),
    ),
    allTypes: tPendingTranslation(
      'All types',
      'Dropdown option that shows all file types in the bulk asset upload queue.',
      translationKey('Label.BulkUpload.AllTypes', CREATIONS_NAMESPACE),
    ),
    applySettingsToMatchingFiles: tPendingTranslation(
      'Apply settings to matching files',
      'Accessible label for applying one file configuration to matching files.',
      translationKey('Action.BulkUpload.ApplySettingsToMatching', CREATIONS_NAMESPACE),
    ),
    assetId: (assetId: number) =>
      tPendingTranslation(
        'ID {assetId}',
        'Asset ID shown after a file finishes uploading; {assetId} is the numeric identifier.',
        translationKey('Label.BulkUpload.AssetIdValue', CREATIONS_NAMESPACE),
        { assetId: String(assetId) },
      ),
    browseFiles: tPendingTranslation(
      'Browse files',
      'Button that opens a file picker for bulk asset upload.',
      translationKey('Action.BulkUpload.BrowseFiles', CREATIONS_NAMESPACE),
    ),
    browseFolder: tPendingTranslation(
      'Browse folder',
      'Button that opens a folder picker for bulk asset upload.',
      translationKey('Action.BulkUpload.BrowseFolder', CREATIONS_NAMESPACE),
    ),
    clearFileSearch: tPendingTranslation(
      'Clear file search',
      'Accessible label for clearing the file search.',
      translationKey('Action.BulkUpload.ClearSearch', CREATIONS_NAMESPACE),
    ),
    clearQueue: tPendingTranslation(
      'Clear queue',
      'Button that removes all files from the bulk asset upload queue.',
      translationKey('Action.BulkUpload.ClearQueue', CREATIONS_NAMESPACE),
    ),
    clickToCopyAssetId: tPendingTranslation(
      'Click to copy asset ID',
      'Tooltip for an uploaded asset ID that can be copied.',
      translationKey('Label.BulkUpload.CopyAssetIdTooltip', CREATIONS_NAMESPACE),
    ),
    closeAssetImporter: tPendingTranslation(
      'Close asset importer',
      'Accessible label for closing the bulk asset importer.',
      translationKey('Action.BulkUpload.Close', CREATIONS_NAMESPACE),
    ),
    confirmAndImport: tPendingTranslation(
      'Confirm and import',
      'Button that confirms upload fees and starts importing assets.',
      translationKey('Action.BulkUpload.ConfirmAndImport', CREATIONS_NAMESPACE),
    ),
    confirmUploadCosts: tPendingTranslation(
      'Confirm upload costs',
      'Heading for the upload fee confirmation sheet.',
      translationKey('Heading.BulkUpload.ConfirmCosts', CREATIONS_NAMESPACE),
    ),
    costConfirmationDescription: tPendingTranslation(
      'Some assets in your queue require Robux to upload.',
      'Description shown before confirming bulk asset upload fees.',
      translationKey('Description.BulkUpload.ConfirmCosts', CREATIONS_NAMESPACE),
    ),
    dropFilesHere: tPendingTranslation(
      'Drop files here',
      'Drop-zone heading while files are dragged over the bulk asset importer.',
      translationKey('Heading.BulkUpload.DropFilesHere', CREATIONS_NAMESPACE),
    ),
    fileTypeLabels,
    errorLabels,
    fileMetadata: (fileType: string, extension: string, bytes: number) => {
      let fileSize: string;
      let unit: string;
      if (bytes < BYTES_PER_KILOBYTE) {
        fileSize = new Intl.NumberFormat().format(bytes);
        unit = fileSizeUnits.bytes;
      } else if (bytes < BYTES_PER_MEGABYTE) {
        fileSize = new Intl.NumberFormat().format(Math.round(bytes / BYTES_PER_KILOBYTE));
        unit = fileSizeUnits.kilobytes;
      } else {
        fileSize = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(
          bytes / BYTES_PER_MEGABYTE,
        );
        unit = fileSizeUnits.megabytes;
      }
      return tPendingTranslation(
        '{fileType} • {extension} • {fileSize} {unit}',
        'File metadata in the bulk upload queue; values identify its type, extension, localized size, and size unit.',
        translationKey('Label.BulkUpload.FileMetadata', CREATIONS_NAMESPACE),
        { fileType, extension, fileSize, unit },
      );
    },
    filterByFileType: tPendingTranslation(
      'Filter by file type',
      'Accessible label for the file type filter.',
      translationKey('Label.BulkUpload.FilterByFileType', CREATIONS_NAMESPACE),
    ),
    importAssetCount: (count: number) =>
      count === 1
        ? tPendingTranslation(
            'Import 1 asset',
            'Button that starts importing one enabled asset.',
            translationKey('Action.BulkUpload.ImportOneAsset', CREATIONS_NAMESPACE),
          )
        : tPendingTranslation(
            'Import {count} assets',
            'Button that starts importing multiple enabled assets.',
            translationKey('Action.BulkUpload.ImportMultipleAssets', CREATIONS_NAMESPACE),
            { count: String(count) },
          ),
    importAssets: tPendingTranslation(
      'Import assets',
      'Heading for the bulk asset importer.',
      translationKey('Heading.BulkUpload.ImportAssets', CREATIONS_NAMESPACE),
    ),
    importFailedAll: (count: number) =>
      tPendingTranslation(
        'Import failed for all {count} files',
        'Error heading when every file in a bulk upload fails.',
        translationKey('Heading.BulkUpload.AllFailed', CREATIONS_NAMESPACE),
        { count: String(count) },
      ),
    importPartial: (completed: number, failed: number) =>
      tPendingTranslation(
        '{completed} imported, {failed} failed',
        'Warning heading when only some files in a bulk upload succeed.',
        translationKey('Heading.BulkUpload.PartialSuccess', CREATIONS_NAMESPACE),
        { completed: String(completed), failed: String(failed) },
      ),
    importProgress: tPendingTranslation(
      'Import progress',
      'Accessible label for overall bulk asset import progress.',
      translationKey('Label.BulkUpload.ImportProgress', CREATIONS_NAMESPACE),
    ),
    importedCount: (count: number) =>
      tPendingTranslation(
        '{count} imported',
        'Number of files imported successfully.',
        translationKey('Label.BulkUpload.ImportedCount', CREATIONS_NAMESPACE),
        { count: String(count) },
      ),
    insufficientRobux: tPendingTranslation(
      'Insufficient Robux',
      'Message shown when the creator cannot afford the asset upload fees.',
      translationKey('Label.BulkUpload.InsufficientRobux', CREATIONS_NAMESPACE),
    ),
    unableToVerifyUploadCosts: tPendingTranslation(
      'Unable to verify upload costs.',
      'Message shown when bulk asset upload fees cannot be loaded.',
      translationKey('Message.BulkUpload.UnableToVerifyCosts', CREATIONS_NAMESPACE),
    ),
    unableToVerifyRobuxBalance: tPendingTranslation(
      'Unable to verify Robux balance. The upload may fail if there are insufficient funds.',
      'Warning shown when the creator balance cannot be read before a paid bulk asset upload.',
      translationKey('Message.BulkUpload.UnableToVerifyBalance', CREATIONS_NAMESPACE),
    ),
    failedCount: (count: number) =>
      tPendingTranslation(
        '{count} failed',
        'Number of files that failed to import.',
        translationKey('Label.BulkUpload.FailedCount', CREATIONS_NAMESPACE),
        { count: String(count) },
      ),
    importing: tPendingTranslation(
      'Importing...',
      'Disabled button label while assets are importing.',
      translationKey('Action.BulkUpload.Importing', CREATIONS_NAMESPACE),
    ),
    stopImport: tPendingTranslation(
      'Stop import',
      'Button that stops an in-progress bulk asset import without clearing the queue.',
      translationKey('Action.BulkUpload.StopImport', CREATIONS_NAMESPACE),
    ),
    importingCount: (count: number) =>
      tPendingTranslation(
        '{count} importing...',
        'Number of files currently importing.',
        translationKey('Label.BulkUpload.ImportingCount', CREATIONS_NAMESPACE),
        { count: String(count) },
      ),
    importSuccessAll: (count: number) =>
      tPendingTranslation(
        'All {count} files imported successfully',
        'Success heading when every file in a bulk upload succeeds.',
        translationKey('Heading.BulkUpload.AllSucceeded', CREATIONS_NAMESPACE),
        { count: String(count) },
      ),
    invalidCount: (count: number) =>
      tPendingTranslation(
        '{count} invalid',
        'Number of invalid files in the bulk asset upload queue.',
        translationKey('Label.BulkUpload.InvalidCount', CREATIONS_NAMESPACE),
        { count: String(count) },
      ),
    unsupportedFilesSkipped: (count: number) =>
      count === 1
        ? tPendingTranslation(
            '1 unsupported file skipped.',
            'Completion summary when one unsupported file was excluded from a bulk upload.',
            translationKey('Description.BulkUpload.OneUnsupportedFileSkipped', CREATIONS_NAMESPACE),
          )
        : tPendingTranslation(
            '{count} unsupported files skipped.',
            'Completion summary when multiple unsupported files were excluded from a bulk upload.',
            translationKey(
              'Description.BulkUpload.MultipleUnsupportedFilesSkipped',
              CREATIONS_NAMESPACE,
            ),
            { count: String(count) },
          ),
    maxBatchSize: (count: number) =>
      tPendingTranslation(
        'Up to {count} files per batch',
        'Maximum number of files allowed in one bulk upload batch.',
        translationKey('Label.BulkUpload.MaxBatchSize', CREATIONS_NAMESPACE),
        { count: String(count) },
      ),
    batchLimitExceeded: (count: number) =>
      tPendingTranslation(
        'Some files were not added. Up to {count} files can be added per batch.',
        'Warning shown after files are skipped because the bulk upload queue reached its limit.',
        translationKey('Message.BulkUpload.BatchLimitExceeded', CREATIONS_NAMESPACE),
        { count: String(count) },
      ),
    pendingModerationDescription: tPendingTranslation(
      'Assets are pending moderation and will appear in your inventory once approved.',
      'Description shown after uploaded assets enter moderation.',
      translationKey('Description.BulkUpload.PendingModeration', CREATIONS_NAMESPACE),
    ),
    readyCount: (count: number) =>
      count === 1
        ? tPendingTranslation(
            '1 file ready',
            'Footer count when one file is ready to import.',
            translationKey('Label.BulkUpload.OneFileReady', CREATIONS_NAMESPACE),
          )
        : tPendingTranslation(
            '{count} files ready',
            'Footer count of files ready to import.',
            translationKey('Label.BulkUpload.MultipleFilesReady', CREATIONS_NAMESPACE),
            { count: String(count) },
          ),
    removeFromQueue: tPendingTranslation(
      'Remove from queue',
      'Accessible label for removing one file from the upload queue.',
      translationKey('Action.BulkUpload.RemoveFromQueue', CREATIONS_NAMESPACE),
    ),
    retryAll: tPendingTranslation(
      'Retry all',
      'Button that retries every failed file upload.',
      translationKey('Action.BulkUpload.RetryAll', CREATIONS_NAMESPACE),
    ),
    retryFailed: tPendingTranslation(
      'Retry failed',
      'Button that retries failed file uploads.',
      translationKey('Action.BulkUpload.RetryFailed', CREATIONS_NAMESPACE),
    ),
    retryCostCheck: tPendingTranslation(
      'Try again',
      'Button that retries loading bulk asset upload fees and the creator Robux balance.',
      translationKey('Action.BulkUpload.RetryCostCheck', CREATIONS_NAMESPACE),
    ),
    robux: tPendingTranslation(
      'Robux',
      'Accessible label for the Robux currency icon.',
      translationKey('Label.Robux', CREATIONS_NAMESPACE),
    ),
    search: tPendingTranslation(
      'Search',
      'Placeholder for searching files in the bulk asset upload queue.',
      translationKey('Label.BulkUpload.Search', CREATIONS_NAMESPACE),
    ),
    searchFiles: tPendingTranslation(
      'Search files',
      'Accessible label for searching files in the bulk asset upload queue.',
      translationKey('Label.BulkUpload.SearchFiles', CREATIONS_NAMESPACE),
    ),
    statusLabels,
    supportedFilesDescription: tPendingTranslation(
      'Drag and drop files or folders here, or browse your device. Files selected from folders are added as individual Development Items.',
      'Instructions shown in the empty bulk asset upload drop zone.',
      translationKey('Description.BulkUpload.DropZone', CREATIONS_NAMESPACE),
    ),
    supportedFormats: tPendingTranslation(
      'Supports images (.png, .jpg, .jpeg, .tga, .bmp), audio (.ogg, .mp3, .flac, .wav), and video (.mp4, .mov).',
      'Supported file formats shown in the bulk asset importer.',
      translationKey('Description.BulkUpload.SupportedFormats', CREATIONS_NAMESPACE),
    ),
    uploadAssetPage: (link: (chunks: ReactNode) => ReactNode) =>
      tPendingHtmlTranslation(
        'Upload individual assets on the {linkStart}Upload Asset page{linkEnd}.',
        'Link to the single-asset upload page from the bulk importer empty state.',
        translationKey('Description.BulkUpload.UploadAssetPage', CREATIONS_NAMESPACE),
        [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content: link,
          },
        ],
      ),
    totalCost: (cost: string, icon: ReactNode) =>
      tPendingHtmlTranslation(
        'Total: {icon} {cost}',
        'Total Robux fee on the bulk upload confirmation; {icon} is the Robux icon and {cost} is the formatted amount.',
        translationKey('Label.BulkUpload.TotalCost', CREATIONS_NAMESPACE),
        null,
        { cost, icon },
      ),
    uploadCompleteProgress: (completed: number, total: number) =>
      tPendingTranslation(
        '{completed} / {total} uploaded',
        'Completed and total file counts while a bulk upload is running.',
        translationKey('Label.BulkUpload.UploadProgressCount', CREATIONS_NAMESPACE),
        { completed: String(completed), total: String(total) },
      ),
    uploadFeeBreakdown: (videoCount: number) => {
      if (videoCount === 1) {
        return tPendingTranslation(
          '1 video file requires an upload fee.',
          'Video file count shown in the upload fee confirmation when one video is selected.',
          translationKey('Description.BulkUpload.FeeBreakdown.OneVideo', CREATIONS_NAMESPACE),
        );
      }
      return tPendingTranslation(
        '{videoCount} video files require upload fees.',
        'Video file count shown in the upload fee confirmation when multiple videos are selected.',
        translationKey('Description.BulkUpload.FeeBreakdown.MultipleVideos', CREATIONS_NAMESPACE),
        { videoCount: String(videoCount) },
      );
    },
    fileUploadProgress: tPendingTranslation(
      'File upload progress',
      'Accessible label for one file upload progress bar.',
      translationKey('Label.BulkUpload.FileProgress', CREATIONS_NAMESPACE),
    ),
  };
};

export default function useImportQueueTranslations() {
  const translationFunctions = useTranslationWrapper(useTranslation());
  return useMemo(() => buildImportQueueTranslations(translationFunctions), [translationFunctions]);
}

export type ImportQueueTranslations = ReturnType<typeof useImportQueueTranslations>;
