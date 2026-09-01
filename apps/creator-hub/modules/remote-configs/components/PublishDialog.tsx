import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeStyles,
  TextField,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ErrorType } from '../api/universeConfigsClientEnums';
import useConfigDescriptionField from '../hooks/useConfigDescriptionField';
import type { ConfigActionError } from '../hooks/useConfigsMutation';

type PublishDialogProps = {
  open: boolean;
  stagedCount: number;
  hasRuleOrderingChanges?: boolean;
  onPublish: ({
    description,
    onSuccess,
    onError,
  }: {
    description: string;
    onSuccess: (data: { draftHash?: string }) => void;
    onError: (error: ConfigActionError) => void;
  }) => Promise<void>;
  onPublishSucceed: () => void;
  onCancel: () => void;
};

const useStyles = makeStyles()((theme) => {
  return {
    fields: {
      // TODO: theme.spacing is not recommended per foundation's request
      margin: theme.spacing(2, 0, 0),
    },
  };
});

const PublishDialog = ({
  open,
  stagedCount,
  hasRuleOrderingChanges = false,
  onPublish,
  onCancel,
  onPublishSucceed,
}: PublishDialogProps) => {
  const {
    classes: { fields },
  } = useStyles();
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());

  const title = translate(
    translationKey('Dialog.Publish.Title', TranslationNamespace.UniverseConfigAndExperimentation),
  );
  const stagedCountArgs = useMemo(() => ({ stagedCount: `${stagedCount}` }), [stagedCount]);
  const subheader = useMemo(() => {
    if (hasRuleOrderingChanges && stagedCount > 0) {
      return tPendingTranslation(
        'You are publishing {stagedCount} staged configs and staged rule ordering changes.',
        'Subheader shown in publish dialog when both staged configs and rule ordering changes are being published.',
        translationKey(
          'Dialog.Publish.Subheader.ConfigsAndRuleOrdering',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
        stagedCountArgs,
      );
    }

    if (hasRuleOrderingChanges) {
      return tPendingTranslation(
        'You are publishing staged rule ordering changes.',
        'Subheader shown in publish dialog when only rule ordering changes are being published.',
        translationKey(
          'Dialog.Publish.Subheader.RuleOrderingOnly',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    }

    return translate(
      translationKey(
        'Dialog.Publish.Subheader',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
      stagedCountArgs,
    );
  }, [hasRuleOrderingChanges, stagedCount, stagedCountArgs, tPendingTranslation, translate]);
  const label = translate(
    translationKey(
      'Dialog.Publish.Label.Message',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const confirmText = translate(
    translationKey(
      'Dialog.Publish.Button.Confirm',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const cancelText = translate(
    translationKey(
      'Dialog.Publish.Button.Cancel',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const [description, setDescription] = useState('');
  const [publishError, setPublishError] = useState<ConfigActionError | null>(null);

  const { isError: isDescriptionError, helperText: descriptionHelperText } =
    useConfigDescriptionField(description, {
      optionalHelperTextKey: 'Dialog.Publish.Helper.OptionalWithCharCount',
    });

  const onConfirm = useCallback(() => {
    void onPublish({
      description,
      onSuccess: onPublishSucceed,
      onError: (error) => {
        setPublishError(error);
      },
    });
  }, [description, onPublish, onPublishSucceed]);

  const possibleErrorMessage: string | null = useMemo(() => {
    if (!publishError) {
      return null;
    }

    switch (publishError.type) {
      case ErrorType.DraftMismatch:
        return translate(
          translationKey(
            'Error.DraftMismatch',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      case 'unknown':
        logAnalyticsError(`${publishError.name}: ${publishError.message}`);
        return translate(
          translationKey('Error.Publishing', TranslationNamespace.UniverseConfigAndExperimentation),
        );
      case ErrorType.CreateKeyHasOverride:
      case ErrorType.UpdateFailed:
      case ErrorType.ReachedMaxEntries:
      case ErrorType.DeploymentInProgress:
      case ErrorType.ConfigLockedByExperiment:
      default: {
        const message = translate(
          translationKey(
            'Error.PublishingUnhandled',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
        logAnalyticsError(`${message}: ${publishError.message}`);
        return message;
      }
    }
  }, [publishError, translate]);

  const possibleErrorEl = useMemo(() => {
    if (!possibleErrorMessage) {
      return null;
    }
    return (
      <Alert data-testid='publish-dialog-error' severity='error'>
        {possibleErrorMessage}
      </Alert>
    );
  }, [possibleErrorMessage]);

  return (
    <Dialog open={open} fullWidth maxWidth='Medium' onClose={onCancel}>
      <DialogTitle id='publish-dialog' data-testid='dialog-title'>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{subheader}</DialogContentText>
        <TextField
          id='descriptionInput'
          data-testid='dialog-description-input'
          className={fields}
          variant='outlined'
          value={description}
          fullWidth
          InputLabelProps={{ shrink: true }}
          onChange={({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
            setDescription(value);
          }}
          label={label}
          placeholder={translate(
            translationKey(
              'Dialog.Publish.Placeholder.Message',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
          error={isDescriptionError}
          helperText={descriptionHelperText}
          multiline
          maxRows={12}
        />
        {possibleErrorEl}
      </DialogContent>
      <DialogActions>
        <Button
          size='large'
          variant='outlined'
          aria-label={cancelText}
          data-testid='dialog-cancel-button'
          color='secondary'
          onClick={onCancel}
          disabled={false}>
          {cancelText}
        </Button>
        <Button
          size='large'
          variant='contained'
          aria-label={confirmText}
          data-testid='dialog-submit-button'
          color='primaryBrand'
          onClick={onConfirm}
          disabled={isDescriptionError}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default PublishDialog;
