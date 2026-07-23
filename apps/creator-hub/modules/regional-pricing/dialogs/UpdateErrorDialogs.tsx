/* istanbul ignore file */
import { Fragment, useCallback } from 'react';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useDialog as useDialogContext,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const useErrorDialog = () => {
  const { open, close, configure } = useDialogContext();

  const openErrorDialog = useCallback(
    (...args: Parameters<typeof configure>) => {
      configure(...args);
      open();
    },
    [open, configure],
  );

  return {
    openErrorDialog,
    closeErrorDialog: close,
  } as const;
};

type ErrorDialogProps = {
  onClose: () => void;
};

/** Generic error modal for bulk update */
export const GeneralErrorDialog = withTranslation(
  ({ onClose }: ErrorDialogProps) => {
    const { translate } = useTranslation();

    return (
      <Fragment>
        <DialogTitle>{translate('Heading.ErrorOccurred')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{translate('Message.ErrorProcessingRequest')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color='primaryBrand' variant='contained'>
            {translate('Action.Continue')}
          </Button>
        </DialogActions>
      </Fragment>
    );
  },
  [TranslationNamespace.Creations],
);

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

/** Partial failure error modal for bulk update */
export const PartialFailuresDialog = withTranslation(
  ({ count, onClose }: ErrorDialogProps & { count: number }) => {
    const { translate } = useTranslation();

    return (
      <Fragment>
        <DialogTitle>{translate('Heading.ErrorOccurred')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pluralize(
              count,
              translate('Message.ErrorCountSingleUpdateFailure'),
              translate('Message.ErrorCountMultipleUpdateFailure', {
                count: count.toString(),
              }),
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color='primaryBrand' variant='contained'>
            {translate('Action.Continue')}
          </Button>
        </DialogActions>
      </Fragment>
    );
  },
  [TranslationNamespace.Creations],
);

/** Error modal when selecting too many products to update */
export const TooManyProductsToUpdateDialog = withTranslation(
  ({ onClose }: ErrorDialogProps) => {
    const { translate } = useTranslation();

    return (
      <Fragment>
        <DialogTitle>{translate('Heading.ErrorOccurred')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {translate('Message.ErrorTooManySelectedForUpdate')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color='primaryBrand' variant='contained'>
            {translate('Action.Continue')}
          </Button>
        </DialogActions>
      </Fragment>
    );
  },
  [TranslationNamespace.Creations],
);
