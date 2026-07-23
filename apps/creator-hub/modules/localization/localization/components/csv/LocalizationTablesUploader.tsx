import { useTranslation } from '@rbx/intl';
import { Dialog, DialogTemplate, Divider, Grid, Link, Typography, useMediaQuery } from '@rbx/ui';
import React, { Fragment, FunctionComponent, useEffect, useMemo, useState } from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import LocalizationTableUploaderStyles from './LocalizationTablesUploader.styles';
import LocalizationTableProgress from './LocalizationTableProgress';
import CsvUploader from './CsvUploader';
import CsvProgressType from '../../enums/CsvProgressType';
import { CsvParsingErrorInfo } from '../../types/CsvParsingErrorInfo';
import CsvUploadFailureStatus from '../../enums/CsvUploadFailureStatus';
import useLocalizationTableCsvParser from '../../hooks/useLocalizationTableCsvParser';
import {
  CsvUploadProgressTypeToDescription,
  CsvUploadProgressTypeToDialogTitle,
  maxCsvFileSizeMB,
} from '../../constants/CsvParsingConstants';
import useCsvEntriesMap from '../../hooks/useCsvEntriesMap';
import { getErrorMessages } from '../../utils/CsvErrorParser';

export interface LocalizationTablesUploaderProps {
  isLoadingCurrentTable: boolean;
  tableLoadProgress: number;
  uploadProgress: number;
  loadTableError: CsvParsingErrorInfo | null;
}

const LocalizationTablesUploader: FunctionComponent<
  React.PropsWithChildren<LocalizationTablesUploaderProps>
> = ({ isLoadingCurrentTable, tableLoadProgress, uploadProgress, loadTableError }) => {
  const { translate, translateHTML } = useTranslation();
  const {
    classes: { divider, button, list },
  } = LocalizationTableUploaderStyles();
  const {
    handleConfirmCsvUpload,
    handleRejectedFile,
    parseCsvFile,
    parsingPercentage,
    newSupportedLanguagesCount,
    addedEntriesCount,
    deletedTranslationsCount,
    modifiedTranslationsCount,
    csvParsingErrors,
  } = useLocalizationTableCsvParser();
  const { failedUpdateErrors } = useCsvEntriesMap();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [shouldParseFile, setShouldParseFile] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

  useEffect(() => {
    if (isLoadingCurrentTable) {
      setProgressPercentage(tableLoadProgress);
    } else if (uploadedFile !== null && !isUploading) {
      setProgressPercentage(parsingPercentage);
    } else if (isUploading) {
      setProgressPercentage(uploadProgress);
    }
  }, [
    isLoadingCurrentTable,
    tableLoadProgress,
    parsingPercentage,
    uploadedFile,
    isUploading,
    uploadProgress,
  ]);

  const uploadDescription = (
    <Grid>
      <Typography variant='captionBody'>{translate('Description.UploadCsv')}</Typography>
      {translateHTML('Description.LearnMoreHere', [
        {
          opening: 'csvManagementLinkStart',
          closing: 'csvManagementLinkEnd',
          content(chunks) {
            return (
              <Link
                target='_blank'
                href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/localization/manual-translations#adding-translations-with-file-upload`}>
                {chunks}
              </Link>
            );
          },
        },
      ])}
    </Grid>
  );

  const uploadProgressType = useMemo(() => {
    if (isLoadingCurrentTable) {
      return CsvProgressType.AnalyzingTable;
    }
    if (isUploading) {
      return CsvProgressType.Uploading;
    }
    return CsvProgressType.Parsing;
  }, [isLoadingCurrentTable, isUploading]);

  const uploadProgressTitle = useMemo(() => {
    return translate(CsvUploadProgressTypeToDescription[uploadProgressType]);
  }, [translate, uploadProgressType]);

  const parseSuccessDialogContent = useMemo(() => {
    return (
      <Fragment>
        <Typography variant='captionBody' style={{ whiteSpace: 'pre-line' }}>
          {`${translate('Description.UploadChanges')} \n\n`}
        </Typography>
        <Typography variant='captionBody' style={{ whiteSpace: 'pre-line' }}>
          {`${translate('Label.AddedEntries')} ${addedEntriesCount}
        ${translate('Label.ModifiedTranslations')} ${modifiedTranslationsCount}
        ${translate('Label.NewlyAddedLanguages')} ${newSupportedLanguagesCount}
        ${translate('Label.DeletedEntries')} ${deletedTranslationsCount} \n\n`}
        </Typography>
        <Typography variant='captionBody'>{translate('Description.ConfirmUpload')}</Typography>
      </Fragment>
    );
  }, [
    translate,
    addedEntriesCount,
    modifiedTranslationsCount,
    newSupportedLanguagesCount,
    deletedTranslationsCount,
  ]);

  const handleFileRejected = (error: CsvUploadFailureStatus | null) => {
    if (error) {
      handleRejectedFile(error);
      setUploadedFile(null);
    }
  };

  const handleConfirmUpload = () => {
    setIsUploadDialogOpen(false);
    setIsUploading(true);
    handleConfirmCsvUpload();
  };

  const uploadErrors = useMemo(() => {
    if (loadTableError) {
      return [loadTableError];
    }
    if (csvParsingErrors.length > 0) {
      return csvParsingErrors;
    }
    if (failedUpdateErrors && isUploading) {
      return failedUpdateErrors;
    }
    return [];
  }, [loadTableError, failedUpdateErrors, csvParsingErrors, isUploading]);

  const uploadErrorDialogTitle = useMemo(() => {
    return translate(CsvUploadProgressTypeToDialogTitle[uploadProgressType]);
  }, [translate, uploadProgressType]);

  useEffect(() => {
    if (parsingPercentage === 100 && csvParsingErrors.length === 0) {
      setIsUploadDialogOpen(true);
    }
  }, [parsingPercentage, csvParsingErrors]);

  const showUploadConfirmDialogue = useMemo(() => {
    return parsingPercentage >= 100 && isUploadDialogOpen;
  }, [parsingPercentage, isUploadDialogOpen]);

  const updateDialogContent = useMemo(() => {
    return (
      <Fragment>
        <Typography variant='captionBody' style={{ whiteSpace: 'pre-line' }}>
          {`${translate(
            uploadProgressType === CsvProgressType.Parsing
              ? 'Description.UploadFailure'
              : 'Description.UpdateFailure',
          )} \n`}
        </Typography>
        <Typography variant='captionBody' color='error' style={{ whiteSpace: 'pre-line' }}>
          {`${getErrorMessages(uploadErrors, translate)} \n`}
        </Typography>
        <Typography variant='captionBody'>
          {translateHTML('Description.LearnMoreHere', [
            {
              opening: 'csvManagementLinkStart',
              closing: 'csvManagementLinkEnd',
              content(chunks) {
                return (
                  <Link
                    target='_blank'
                    href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/production/localization/translating-in-experience-content#adding-source-content`}>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        </Typography>
        <Typography variant='captionBody' style={{ whiteSpace: 'pre-line' }}>
          {` ${translate('Description.MakeChanges')}`}
        </Typography>
      </Fragment>
    );
  }, [translate, translateHTML, uploadErrors, uploadProgressType]);

  const onFileUpload = (file: File | null) => {
    setUploadedFile(file);
  };

  useEffect(() => {
    // only parse and upload files if there are no errors
    if (
      uploadedFile !== null &&
      !isLoadingCurrentTable &&
      uploadErrors.length === 0 &&
      shouldParseFile
    ) {
      parseCsvFile(uploadedFile);
      setShouldParseFile(false);
    }
  }, [isLoadingCurrentTable, uploadedFile, shouldParseFile, parseCsvFile, uploadErrors.length]);

  return (
    <Grid>
      <Grid container direction='column'>
        <Grid container item direction='row' justifyContent='space-between'>
          <Grid item XSmall={isCompactView ? 4 : 9} className={list} justifyContent='flex-end'>
            {uploadDescription}
          </Grid>
          <Grid item className={button} XSmall={3}>
            <CsvUploader
              uploadedFile={uploadedFile}
              maxSizeMB={maxCsvFileSizeMB}
              onUpload={onFileUpload}
              onRejected={handleFileRejected}
            />
          </Grid>
        </Grid>
        {(uploadedFile || uploadErrors.length > 0) && (
          <LocalizationTableProgress
            progress={progressPercentage}
            progressType={uploadProgressType}
            progressTitle={uploadProgressTitle}
            errorDialogTitle={uploadErrorDialogTitle}
            errorDialogContent={updateDialogContent}
            shouldShowErrors={uploadErrors.length > 0}
          />
        )}
        <Divider className={divider} />
      </Grid>
      <Dialog maxWidth='Medium' open={showUploadConfirmDialogue}>
        <DialogTemplate
          color='primaryBrand'
          cancelText={translate('Label.Cancel')}
          confirmText={translate('Label.Confirm')}
          onCancel={() => setIsUploadDialogOpen(false)}
          onConfirm={handleConfirmUpload}
          title={translate('Title.ConfirmUpload')}
          content={parseSuccessDialogContent}
        />
      </Dialog>
    </Grid>
  );
};

export default LocalizationTablesUploader;
