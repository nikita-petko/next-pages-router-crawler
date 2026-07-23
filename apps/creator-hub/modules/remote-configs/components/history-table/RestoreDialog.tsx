import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { dateTimeFormatter } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import {
  DialogTitle,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  makeStyles,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useLocale from '@modules/charts-generic/context/useLocale';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ErrorType } from '../../api/universeConfigsClientEnums';
import type { ValidChangelogEntry } from '../../api/validTypes';
import { useRestoreChangelogEntryMutation } from '../../hooks/useConfigsActionMutations';

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
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());

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

    void restoreChangelogEntry(
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
    const messageToShow: string | undefined =
      restoreChangelogEntryError?.getTranslatedErrorMessage(tPendingTranslation);
    return messageToShow ? (
      <Typography variant='h6' color='error' sx={{ marginRight: 1 }}>
        {messageToShow}
      </Typography>
    ) : null;
  }, [restoreChangelogEntryError, tPendingTranslation]);

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
