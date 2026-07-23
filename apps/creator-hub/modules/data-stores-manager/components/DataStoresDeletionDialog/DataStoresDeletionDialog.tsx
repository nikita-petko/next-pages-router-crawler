import type { FunctionComponent } from 'react';
import React from 'react';
import { Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@rbx/ui';
import { parseEntryIdAndScopeFromObjectKey } from '../../common';
import {
  deleteDataStore,
  undeleteDataStore,
  deleteEntry,
} from '../../openCloudStandardDataStoresRequests';

interface DataStoresDeletionDialogProps {
  universeId: number;
  dataStore: string;
  objectKey?: string;
  deletion: boolean;
  closeDialog: () => void;
  showSuccessToast: (success: boolean) => void;
}

interface DialogConfig {
  title: string;
  message: React.ReactNode;
  confirmText: string;
  confirmColor?: 'error';
  testIdPrefix: string;
  targetName: string;
  onConfirm: () => void;
}

interface DialogButtonProps {
  onClick: () => void;
  color?: 'secondary';
  variant: 'contained';
  testId: string;
  children: React.ReactNode;
}

const DialogButton: FunctionComponent<DialogButtonProps> = ({
  onClick,
  color,
  variant,
  testId,
  children,
}) => (
  <Button onClick={onClick} color={color} variant={variant} data-testid={testId} fullWidth>
    {children}
  </Button>
);

const DataStoresDeletionDialog: FunctionComponent<DataStoresDeletionDialogProps> = ({
  universeId,
  dataStore,
  objectKey,
  deletion,
  closeDialog,
  showSuccessToast,
}) => {
  const handleDataStoreAction = async (
    actionFn: (universeId: number, dataStore: string) => Promise<boolean>,
  ) => {
    try {
      const success = await actionFn(universeId, dataStore);
      showSuccessToast(success);
    } catch {
      showSuccessToast(false);
    }
  };

  const handleEntryAction = async () => {
    if (objectKey) {
      const { scope, entryId: key } = parseEntryIdAndScopeFromObjectKey(objectKey);
      try {
        await deleteEntry(universeId, dataStore, scope, key);
        showSuccessToast(true);
      } catch {
        showSuccessToast(false);
      }
    }
  };

  // Configuration based on dialog type
  const getDialogConfig = (): DialogConfig => {
    if (objectKey) {
      // Entry deletion
      return {
        title: 'Mark Key for Deletion',
        message: (
          <>
            <span>Are you sure you want to mark the key &quot;</span>
            <strong>{objectKey}</strong>
            <span>
              &quot; for deletion? Once marked, the key and its data will be permanently deleted
              after 30 days.
            </span>
          </>
        ),
        confirmText: 'Mark for Deletion',
        confirmColor: 'error',
        testIdPrefix: 'delete',
        targetName: objectKey,
        onConfirm: handleEntryAction,
      };
    }

    if (deletion) {
      // Data store deletion
      return {
        title: 'Mark Data Store for Deletion',
        message: (
          <>
            <span>Are you sure you want to mark the data store &quot;</span>
            <strong>{dataStore}</strong>
            <span>
              &quot; for deletion? Once marked, the data store and its data will be permanently
              deleted after 30 days.
            </span>
          </>
        ),
        confirmText: 'Mark for Deletion',
        confirmColor: 'error',
        testIdPrefix: 'delete',
        targetName: dataStore,
        onConfirm: () => handleDataStoreAction(deleteDataStore),
      };
    }

    // Data store restoration
    return {
      title: 'Restore Data Store',
      message: (
        <>
          <span>Are you sure you want to restore the data store &quot;</span>
          <strong>{dataStore}</strong>
          <span>&quot;?</span>
        </>
      ),
      confirmText: 'Restore',
      testIdPrefix: 'restore',
      targetName: dataStore,
      onConfirm: () => handleDataStoreAction(undeleteDataStore),
    };
  };

  const config = getDialogConfig();

  return (
    <Dialog open>
      <DialogTitle>
        <Typography variant='h2'>{config.title}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography>{config.message}</Typography>
      </DialogContent>
      <DialogActions>
        <DialogButton
          onClick={config.onConfirm}
          color={config.confirmColor ? 'secondary' : undefined}
          variant='contained'
          testId={`${config.targetName}-confirm-${config.testIdPrefix}`}>
          <Typography variant='h6' color={config.confirmColor}>
            {config.confirmText}
          </Typography>
        </DialogButton>
        <DialogButton
          onClick={closeDialog}
          color='secondary'
          variant='contained'
          testId={`${config.targetName}-cancel-${config.testIdPrefix}`}>
          <Typography variant='h6'>Cancel</Typography>
        </DialogButton>
      </DialogActions>
    </Dialog>
  );
};

export default DataStoresDeletionDialog;
