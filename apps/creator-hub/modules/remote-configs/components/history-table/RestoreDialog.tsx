import {
  DialogTitle,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  makeStyles,
} from '@rbx/ui';
import React, { FC, useCallback, useMemo } from 'react';
import { logAnalyticsError, useLocale } from '@modules/charts-generic';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { dateTimeFormatter } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { useRestoreChangelogEntryMutation } from '../../hooks/useConfigsActionMutations';
import { ErrorType } from '../../api/universeConfigsClientEnums';
import { ValidChangelogEntry } from '../../api/validTypes';

export type RestoreDialogResult = null | {
  data: { draftHash?: string };
};

const useStyles = makeStyles()(() => ({
  dialogContent: {
    marginTop: '8px',
  },
}));

type RestoreDialogProps = {
  pendingEntryToRestore: null | ValidChangelogEntry;
  onClose: (result: RestoreDialogResult) => void;
};

const RestoreDialog: FC<RestoreDialogProps> = ({ pendingEntryToRestore, onClose }) => {
  const {
    classes: { dialogContent },
  } = useStyles();
  const locale = useLocale();
  const { id: universeId } = useUniverseResource();
  const { translate } = useTranslationWrapper(useTranslation());

  const confirmText = translate(
    translationKey(
      'Dialog.Restore.Button.Save',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const cancelText = translate(
    translationKey(
      'Dialog.CreateOrEdit.Button.Cancel',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const onCancel = useCallback(() => {
    onClose(null);
  }, [onClose]);

  const { restoreChangelogEntry, isRestoringChangelogEntry, restoreChangelogEntryError } =
    useRestoreChangelogEntryMutation();

  const onSave = useCallback(() => {
    if (pendingEntryToRestore === null) {
      return;
    }

    restoreChangelogEntry(
      {
        universeId,
        changelogEntryId: pendingEntryToRestore.changelogEntryId,
      },
      {
        onSuccess: (data) => {
          onClose({ data });
        },
        onError: (error) => {
          if (error.type !== ErrorType.UpdateFailed) {
            logAnalyticsError(`Error restoring changelog entry: ${error.message}`);
          }
        },
      },
    );
  }, [pendingEntryToRestore, restoreChangelogEntry, universeId, onClose]);

  const open = pendingEntryToRestore !== null;

  const dialogErrorMessage = useMemo(() => {
    switch (restoreChangelogEntryError?.type) {
      case undefined:
        return null;
      case ErrorType.UpdateFailed:
        return (
          <Typography variant='h6' color='error' sx={{ marginRight: 1 }}>
            {translate(
              translationKey(
                'Error.UpdateFailed',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </Typography>
        );
      default:
        return (
          <Typography variant='h6' color='error' sx={{ marginRight: 1 }}>
            {translate(
              translationKey(
                'Error.Unknown',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </Typography>
        );
    }
  }, [restoreChangelogEntryError?.type, translate]);

  return (
    <Dialog open={open} fullWidth maxWidth='Medium' onClose={onCancel}>
      <DialogTitle data-testid='dialog-title' data-isopen={open}>
        {translate(
          translationKey(
            'Dialog.Restore.Title',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          {
            versionNumber: pendingEntryToRestore?.version.toString() ?? '',
          },
        )}
      </DialogTitle>
      <DialogContent classes={{ root: dialogContent }}>
        {translate(
          translationKey(
            'Dialog.Restore.Message',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          {
            versionNumber: pendingEntryToRestore?.version.toString() ?? '',
            versionTimestamp: pendingEntryToRestore?.time
              ? dateTimeFormatter(locale).getCustomDateTime(new Date(pendingEntryToRestore.time), {
                  dateStyle: 'medium',
                  timeStyle: 'medium',
                })
              : '',
          },
        )}
      </DialogContent>
      <DialogActions>
        {dialogErrorMessage}
        <Button
          size='large'
          variant='outlined'
          aria-label={cancelText}
          data-testid='dialog-cancel-button'
          color='secondary'
          onClick={onCancel}
          loading={isRestoringChangelogEntry}>
          {cancelText}
        </Button>
        <Button
          size='large'
          variant='contained'
          aria-label={confirmText}
          data-testid='dialog-submit-button'
          color='primaryBrand'
          onClick={onSave}
          loading={isRestoringChangelogEntry}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestoreDialog;
