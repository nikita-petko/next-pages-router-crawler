import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FunctionComponent,
} from 'react';
import {
  Alert,
  Button,
  Dropdown,
  Icon,
  IconButton,
  Link,
  Menu,
  MenuItem,
  ProgressBar,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
  TextInput,
  clsx,
} from '@rbx/foundation-ui';
import Asset from '@modules/miscellaneous/common/enums/Asset';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { useImport } from '../ImportContext';
import {
  IMPORT_LIMITS,
  SUPPORTED_EXTENSIONS,
  resolveDroppedItems,
  type ImportableFileType,
} from '../importStore';
import useImportQueueTranslations from '../useImportQueueTranslations';
import ImportCostConfirmation from './ImportCostConfirmation';
import ImportFileRow from './ImportFileRow';
import ImportStatusAlert from './ImportStatusAlert';

type ImportTypeFilter = ImportableFileType | 'all';

const isImportTypeFilter = (value: string): value is ImportTypeFilter =>
  value === 'all' || value === 'image' || value === 'audio' || value === 'video';

const ImportQueue: FunctionComponent = () => {
  const translations = useImportQueueTranslations();
  const importStore = useImport();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  // Tracked as state so the observer below re-attaches whenever the sheet mounts a new list node.
  const [queueListElement, setQueueListElement] = useState<HTMLDivElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [queueScrollbarGutter, setQueueScrollbarGutter] = useState(0);
  const [batchLimitExceeded, setBatchLimitExceeded] = useState(false);

  const {
    isOpen,
    files,
    filteredFiles,
    searchFilter,
    typeFilter,
    showConfirmation,
    importInProgress,
    feesLoading,
    batchStats,
    batchStatus,
    importProgress,
    statusAlertDismissed,
    closeImporter,
    resetImporter,
    addFiles,
    removeFile,
    clearQueue,
    confirmCosts,
    startImport,
    stopImport,
    retryFailed,
    retryCostCheck,
    dismissStatusAlert,
    setSearchFilter,
    setTypeFilter,
    setShowConfirmation,
  } = importStore;

  const remainingBatchSlots = Math.max(
    IMPORT_LIMITS.maxBatchSize - (batchStats.total - batchStats.completed),
    0,
  );
  const hasCompletedBatch =
    batchStatus === 'complete_success' ||
    batchStatus === 'complete_partial' ||
    batchStatus === 'complete_failed';
  const showStatusAlert = hasCompletedBatch && !statusAlertDismissed;

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFolderSelect = useCallback(() => {
    folderInputRef.current?.click();
  }, []);

  const handleFolderInputRef = useCallback((element: HTMLInputElement | null) => {
    folderInputRef.current = element;
    element?.setAttribute('webkitdirectory', '');
  }, []);

  const handleCloseImporter = useCallback(() => {
    if (files.length === 0) {
      resetImporter();
      setBatchLimitExceeded(false);
    }
    if (showStatusAlert) {
      dismissStatusAlert();
    }
    closeImporter();
  }, [closeImporter, dismissStatusAlert, files.length, resetImporter, showStatusAlert]);

  const handleClearQueue = useCallback(() => {
    clearQueue();
    setBatchLimitExceeded(false);
  }, [clearQueue]);

  const handleCancelCostConfirmation = useCallback(() => {
    setShowConfirmation(false);
  }, [setShowConfirmation]);

  const handleConfirmCostConfirmation = useCallback(() => {
    confirmCosts();
    void startImport();
  }, [confirmCosts, startImport]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleCloseImporter();
      }
    },
    [handleCloseImporter],
  );

  // `scrollbar-gutter: stable` reserves the scrollbar inside the list, which would inset the rows
  // relative to the toolbar above. Measure the reserved width — 0 on platforms with overlay
  // scrollbars — so the list can be pulled into the sheet's right padding by exactly that much.
  useLayoutEffect(() => {
    const updateScrollbarGutter = () => {
      setQueueScrollbarGutter(
        queueListElement == null ? 0 : queueListElement.offsetWidth - queueListElement.clientWidth,
      );
    };

    updateScrollbarGutter();
    if (queueListElement == null) {
      return undefined;
    }

    const observer = new ResizeObserver(updateScrollbarGutter);
    observer.observe(queueListElement);
    return () => observer.disconnect();
  }, [queueListElement]);

  const addFilesWithFeedback = useCallback(
    (selectedFiles: File[]) => {
      const result = addFiles(selectedFiles);
      setBatchLimitExceeded(result.overLimit);
    },
    [addFiles],
  );

  const handleFilesChosen = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);
      if (selectedFiles.length > 0) {
        addFilesWithFeedback(selectedFiles);
      }
      if (fileInputRef.current != null) {
        fileInputRef.current.value = '';
      }
      if (folderInputRef.current != null) {
        folderInputRef.current.value = '';
      }
    },
    [addFilesWithFeedback],
  );

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      const droppedFiles = await resolveDroppedItems(event.dataTransfer, remainingBatchSlots + 1);
      if (droppedFiles.length > 0) {
        addFilesWithFeedback(droppedFiles);
      }
    },
    [addFilesWithFeedback, remainingBatchSlots],
  );

  const supportedExtensions = Object.values(SUPPORTED_EXTENSIONS).flat().join(',');
  const videoCount = files.filter(
    (file) => file.fileType === 'video' && file.status === 'ready',
  ).length;

  return (
    <>
      <SheetRoot open={isOpen} onOpenChange={handleOpenChange}>
        {isOpen && (
          <SheetContent
            largeScreenVariant='side'
            closeLabel={translations.closeAssetImporter}
            largeScreenClassName='![max-width:460px]'>
            <SheetTitle>{translations.importAssets}</SheetTitle>
            <SheetBody
              hasPaddingX={false}
              className='relative flex grow-1 flex-col min-height-0 [overflow:hidden] padding-left-xlarge padding-right-large padding-y-none'>
              {batchLimitExceeded && (
                <Alert hasCloseAffordance={false} severity='Warning' variant='System'>
                  {translations.batchLimitExceeded(IMPORT_LIMITS.maxBatchSize)}
                </Alert>
              )}
              <input
                ref={fileInputRef}
                type='file'
                multiple
                accept={supportedExtensions}
                className='hidden'
                onChange={handleFilesChosen}
              />
              <input
                ref={handleFolderInputRef}
                type='file'
                multiple
                className='hidden'
                onChange={handleFilesChosen}
              />

              {/* Intentionally unclipped horizontally so the list can extend into the sheet's
                  right padding; SheetBody still clips at its padding box. */}
              <div className='flex flex-col grow-1 min-width-0 min-height-0 gap-xlarge'>
                {files.length > 0 && (
                  <div className='flex flex-col gap-xlarge'>
                    <div className='flex items-center justify-between gap-medium'>
                      <Button
                        variant='Standard'
                        size='Small'
                        className='shrink-0'
                        icon='icon-regular-plus-small'
                        isDisabled={importInProgress || batchStatus === 'importing'}
                        onClick={handleFileSelect}>
                        {translations.addFiles}
                      </Button>
                      <Button
                        variant='Utility'
                        size='Small'
                        className='shrink-0'
                        icon='icon-regular-trash-can'
                        isDisabled={importInProgress || batchStatus === 'importing'}
                        onClick={handleClearQueue}>
                        {translations.clearQueue}
                      </Button>
                    </div>
                    <div className='flex items-center gap-small'>
                      <div className='grow-1 min-width-0'>
                        <TextInput
                          id='import-search'
                          size='Small'
                          className='width-full'
                          placeholder={translations.search}
                          aria-label={translations.searchFiles}
                          value={searchFilter}
                          isDisabled={importInProgress}
                          leadingIconName='icon-regular-magnifying-glass'
                          trailingIconNode={
                            searchFilter.length > 0 ? (
                              <IconButton
                                variant='Utility'
                                size='Small'
                                isCircular
                                icon='icon-regular-x'
                                ariaLabel={translations.clearFileSearch}
                                onClick={() => setSearchFilter('')}
                              />
                            ) : undefined
                          }
                          onChange={(event) => setSearchFilter(event.target.value)}
                        />
                      </div>
                      <div className='width-[140px] shrink-0'>
                        <Dropdown
                          size='Small'
                          className='width-full'
                          value={typeFilter}
                          placeholder={translations.allTypes}
                          ariaLabel={translations.filterByFileType}
                          isDisabled={importInProgress}
                          onValueChange={(value) => {
                            if (isImportTypeFilter(value)) {
                              setTypeFilter(value);
                            }
                          }}>
                          <Menu className='padding-small'>
                            <MenuItem value='all' title={translations.allTypes} />
                            <MenuItem value='image' title={translations.fileTypeLabels.image} />
                            <MenuItem value='audio' title={translations.fileTypeLabels.audio} />
                            <MenuItem value='video' title={translations.fileTypeLabels.video} />
                          </Menu>
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                )}

                {files.length > 0 && showStatusAlert && (
                  <ImportStatusAlert status={batchStatus} translations={translations} />
                )}

                <div
                  className='flex grow-1 flex-col min-height-0 bg-surface-100'
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(event) => {
                    void handleDrop(event);
                  }}>
                  {files.length === 0 ? (
                    <div
                      className={clsx(
                        'flex grow-1 flex-col items-center justify-center gap-medium padding-xlarge radius-medium stroke-standard [border-style:dashed] bg-surface-100 transition-colors [margin-bottom:var(--gap-xlarge)]',
                        isDragOver ? 'stroke-emphasis bg-shift-200' : 'stroke-default',
                      )}>
                      <Icon
                        name='icon-regular-folder'
                        size='Large'
                        className='content-muted'
                        aria-hidden
                      />
                      <span className='text-title-large content-emphasis'>
                        {isDragOver ? translations.dropFilesHere : translations.addFilesToImport}
                      </span>
                      <span className='text-body-medium content-muted text-align-x-center max-width-[400px]'>
                        {translations.supportedFilesDescription}
                      </span>
                      <span className='text-body-medium content-muted text-align-x-center max-width-[400px]'>
                        {translations.supportedFormats}
                      </span>
                      <div className='flex gap-medium'>
                        <Button variant='Emphasis' size='Medium' onClick={handleFileSelect}>
                          {translations.browseFiles}
                        </Button>
                        <Button variant='Standard' size='Medium' onClick={handleFolderSelect}>
                          {translations.browseFolder}
                        </Button>
                      </div>
                      <span className='text-caption-medium content-muted'>
                        {translations.maxBatchSize(IMPORT_LIMITS.maxBatchSize)}
                      </span>
                      <span className='text-body-medium content-muted text-align-x-center max-width-[400px]'>
                        {translations.uploadAssetPage((chunks) => (
                          <Link
                            href={dashboard.getUploadUrl(Asset.Decal)}
                            isExternal={false}
                            underline='always'
                            variant='Inline'>
                            {chunks}
                          </Link>
                        ))}
                      </span>
                    </div>
                  ) : (
                    <div
                      ref={setQueueListElement}
                      className='grow-1 min-height-0 scroll-y [scrollbar-gutter:stable]'
                      style={{ marginRight: -queueScrollbarGutter }}>
                      {filteredFiles.map((file) => (
                        <ImportFileRow
                          key={file.id}
                          disabled={importInProgress}
                          file={file}
                          onRemoveFile={removeFile}
                          translations={translations}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SheetBody>

            {files.length > 0 && (
              <SheetActions className='flex flex-col gap-medium width-full'>
                {importInProgress && (
                  <ProgressBar
                    variant='Determinate'
                    value={Math.round(
                      (importProgress.completed / Math.max(importProgress.total, 1)) * 100,
                    )}
                    valuesLocation='None'
                    ariaLabel={translations.importProgress}
                    // ProgressBar has no size prop; its track and fill are both height-100.
                    className='width-full [&>div>div]:height-200 [&>div>div>div]:height-200'
                  />
                )}
                <div className='flex items-center gap-medium width-full'>
                  <div className='flex grow-1 [flex-wrap:wrap] items-center gap-medium min-width-0 text-body-medium'>
                    {importInProgress ? (
                      <span className='content-default'>
                        {translations.uploadCompleteProgress(
                          importProgress.completed,
                          importProgress.total,
                        )}
                      </span>
                    ) : (
                      <>
                        <span className='content-default'>
                          {translations.readyCount(batchStats.ready)}
                        </span>
                        {batchStats.importing > 0 && (
                          <span className='content-system-warning'>
                            {translations.importingCount(batchStats.importing)}
                          </span>
                        )}
                        {batchStats.completed > 0 && (
                          <span className='content-system-success'>
                            {translations.importedCount(batchStats.completed)}
                          </span>
                        )}
                      </>
                    )}
                    {batchStats.failed > 0 && (
                      <span className='content-system-alert'>
                        {translations.failedCount(batchStats.failed)}
                      </span>
                    )}
                    {batchStats.invalid > 0 && (
                      <span className='content-system-alert'>
                        {translations.invalidCount(batchStats.invalid)}
                      </span>
                    )}
                    {batchStats.totalCost > 0 && (
                      <span className='inline-flex items-center gap-xxsmall content-default'>
                        <Icon
                          name='icon-filled-robux'
                          size='XSmall'
                          aria-label={translations.robux}
                        />
                        {batchStats.totalCost.toLocaleString()}
                      </span>
                    )}
                    {!feesLoading && batchStats.costsUnavailable ? (
                      <span className='content-system-alert'>
                        {translations.unableToVerifyUploadCosts}
                      </span>
                    ) : !feesLoading && batchStats.balanceUnavailable ? (
                      <span className='content-system-warning'>
                        {translations.unableToVerifyRobuxBalance}
                      </span>
                    ) : (
                      !feesLoading &&
                      !batchStats.canAfford && (
                        <span className='content-system-alert'>
                          {translations.insufficientRobux}
                        </span>
                      )
                    )}
                  </div>

                  {!showStatusAlert &&
                    (batchStatus !== 'importing' &&
                    batchStats.ready === 0 &&
                    batchStats.failed > 0 ? (
                      <Button
                        variant='Emphasis'
                        size='Medium'
                        className='shrink-0 min-width-fit text-no-wrap'
                        onClick={retryFailed}>
                        {translations.retryAll}
                      </Button>
                    ) : (batchStatus === 'ready' || batchStatus === 'has_invalid') &&
                      batchStats.costsUnavailable &&
                      !feesLoading ? (
                      <Button
                        variant='Standard'
                        size='Medium'
                        className='shrink-0 min-width-fit text-no-wrap'
                        onClick={retryCostCheck}>
                        {translations.retryCostCheck}
                      </Button>
                    ) : batchStatus === 'ready' || batchStatus === 'has_invalid' ? (
                      <Button
                        variant='Emphasis'
                        size='Medium'
                        className='shrink-0 min-width-fit text-no-wrap'
                        isDisabled={
                          batchStats.ready === 0 ||
                          importInProgress ||
                          feesLoading ||
                          !batchStats.canAfford
                        }
                        isLoading={feesLoading}
                        onClick={() => {
                          void startImport();
                        }}>
                        {translations.importAssetCount(batchStats.ready)}
                      </Button>
                    ) : batchStatus === 'importing' ? (
                      <Button
                        variant='Emphasis'
                        size='Medium'
                        className='shrink-0 min-width-fit text-no-wrap'
                        onClick={stopImport}>
                        {translations.stopImport}
                      </Button>
                    ) : statusAlertDismissed && batchStats.failed > 0 ? (
                      <Button
                        variant='Emphasis'
                        size='Medium'
                        className='shrink-0 min-width-fit text-no-wrap'
                        onClick={retryFailed}>
                        {translations.retryFailed}
                      </Button>
                    ) : null)}
                </div>
              </SheetActions>
            )}
          </SheetContent>
        )}
      </SheetRoot>

      <ImportCostConfirmation
        open={showConfirmation}
        totalCost={batchStats.totalCost}
        translations={translations}
        videoCount={videoCount}
        onCancel={handleCancelCostConfirmation}
        onConfirm={handleConfirmCostConfirmation}
      />
    </>
  );
};

export default ImportQueue;
