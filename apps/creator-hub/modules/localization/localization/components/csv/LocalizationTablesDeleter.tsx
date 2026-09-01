import type { FunctionComponent } from 'react';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Dialog, DialogTemplate, Grid, Typography } from '@rbx/ui';
import {
  CsvUploadProgressTypeToDescription,
  CsvUploadProgressTypeToDialogTitle,
} from '../../constants/CsvParsingConstants';
import CsvProgressType from '../../enums/CsvProgressType';
import useCsvEntriesMap from '../../hooks/useCsvEntriesMap';
import type { CsvParsingErrorInfo } from '../../types/CsvParsingErrorInfo';
import { getErrorMessages } from '../../utils/CsvErrorParser';
import LocalizationTableManagementItem from './LocalizationTableManagementItem';
import LocalizationTableProgress from './LocalizationTableProgress';

export interface LocalizationTablesDeleterProps {
  isLoadingCurrentTable: boolean;
  tableLoadProgress: number;
  deleteProgress: number;
  loadTableError: CsvParsingErrorInfo | null;
}

const LocalizationTablesDeleter: FunctionComponent<
  React.PropsWithChildren<LocalizationTablesDeleterProps>
> = ({ isLoadingCurrentTable, tableLoadProgress, deleteProgress, loadTableError }) => {
  const { translate } = useTranslation();
  const { failedUpdateErrors, deleteFullLocalizationTable } = useCsvEntriesMap();
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState<boolean>(false);
  const [isDeleteTableDialogOpen, setIsDeleteTableDialogOpen] = useState<boolean>(false);
  const [showDeleteProgressBar, setShowDeleteProgressBar] = useState<boolean>(false);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

  useEffect(() => {
    if (isDeleteConfirmed) {
      if (isLoadingCurrentTable) {
        setProgressPercentage(tableLoadProgress);
      } else {
        setProgressPercentage(deleteProgress);
      }
    }
  }, [isLoadingCurrentTable, tableLoadProgress, deleteProgress, isDeleteConfirmed]);

  const deleteProgressType = useMemo(() => {
    return isLoadingCurrentTable ? CsvProgressType.AnalyzingTable : CsvProgressType.Deleting;
  }, [isLoadingCurrentTable]);

  const deleteProgressTitle = useMemo(() => {
    return translate(CsvUploadProgressTypeToDescription[deleteProgressType]);
  }, [deleteProgressType, translate]);

  const deleteConfirmDialogContent = (
    <Typography variant='captionBody' style={{ whiteSpace: 'pre-line' }}>
      {`${translate('Description.DeleteWarning')}\n\n${translate('Description.DeleteConfirm')}`}
    </Typography>
  );

  const deleteErrors = useMemo(() => {
    if (loadTableError) {
      return [loadTableError];
    }
    if (failedUpdateErrors && isDeleteConfirmed) {
      return failedUpdateErrors;
    }
    return [];
  }, [loadTableError, failedUpdateErrors, isDeleteConfirmed]);

  const deleteErrorMessages = useMemo(() => {
    return `${getErrorMessages(deleteErrors, translate)} \n`;
  }, [deleteErrors, translate]);

  const deleteErrorDialogTitle = useMemo(() => {
    return translate(CsvUploadProgressTypeToDialogTitle[deleteProgressType]);
  }, [deleteProgressType, translate]);

  const deleteErrorDialogContent = useMemo(() => {
    return (
      <>
        <Typography variant='captionBody' style={{ whiteSpace: 'pre-line' }}>
          {`${translate('Description.DeleteFailed')} \n`}
        </Typography>
        <Typography variant='captionBody' color='error' style={{ whiteSpace: 'pre-line' }}>
          {deleteErrorMessages}
        </Typography>
        <Typography variant='captionBody' style={{ whiteSpace: 'pre-line' }}>
          {`${translate('Description.TryAgainLater')}`}
        </Typography>
      </>
    );
  }, [deleteErrorMessages, translate]);

  const deleteText = (
    <Typography variant='captionBody'>{translate('Description.DeleteTable')}</Typography>
  );

  const handleClickDeleteButton = () => {
    setIsDeleteTableDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    setIsDeleteTableDialogOpen(false);
    setShowDeleteProgressBar(true);
    setIsDeleteConfirmed(true);
  };

  useEffect(() => {
    if (!isLoadingCurrentTable && isDeleteConfirmed) {
      deleteFullLocalizationTable();
    }
  }, [isLoadingCurrentTable, isDeleteConfirmed, deleteFullLocalizationTable]);

  return (
    <Grid>
      <LocalizationTableManagementItem
        buttonText={translate('Label.DeleteTable')}
        infoText={deleteText}
        ariaLabel='delete-table'
        isButtonDestructive
        onClick={handleClickDeleteButton}
      />
      {showDeleteProgressBar && (
        <LocalizationTableProgress
          progress={progressPercentage}
          progressType={deleteProgressType}
          progressTitle={deleteProgressTitle}
          errorDialogTitle={deleteErrorDialogTitle}
          errorDialogContent={deleteErrorDialogContent}
          shouldShowErrors={deleteErrors.length > 0}
        />
      )}
      <Dialog maxWidth='Medium' open={isDeleteTableDialogOpen}>
        <DialogTemplate
          color='destructive'
          cancelText={translate('Label.Cancel')}
          confirmText={translate('Label.Delete')}
          onCancel={() => setIsDeleteTableDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          title={translate('Label.DeleteTableTitle')}
          content={deleteConfirmDialogContent}
        />
      </Dialog>
    </Grid>
  );
};

export default LocalizationTablesDeleter;
