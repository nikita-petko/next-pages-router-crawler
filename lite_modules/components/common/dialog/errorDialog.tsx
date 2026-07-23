import { Button } from '@rbx/foundation-ui';
import { type ReactElement } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import type { AMAErrorResponseType, AMAErrorType } from '@type/errorResponse';

interface ErrorDialogProps extends BaseInjectedDialogProps {
  /**
   * Optional AMA error payload. When supplied, the dialog shows the
   * backend-provided `message` plus the `code` for support diagnostics.
   * When omitted, falls back to the generic translated copy.
   */
  errorResponse?: AMAErrorResponseType;
  /**
   * Optional custom message to display instead of the generic copy. Takes
   * precedence over `errorResponse` when both are supplied (unlikely in
   * practice). Pass a pre-translated string.
   */
  message?: string;
}

const ErrorDetails = ({ error }: { error: AMAErrorType }): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Error);
  return (
    <div className='flex flex-col gap-y-small'>
      <span>{error.message}</span>
      {error.code !== undefined ? (
        <span className='content-muted'>
          {translate('Label.ErrorCode', { errorCode: String(error.code) })}
        </span>
      ) : null}
    </div>
  );
};

export const ErrorDialog = ({
  errorResponse,
  message,
  onClose,
}: ErrorDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);

  const description =
    message ?? (errorResponse?.error ? undefined : translate('Message.GenericError'));

  return (
    <BaseDialog
      dialogBody={
        errorResponse?.error && !message ? <ErrorDetails error={errorResponse.error} /> : undefined
      }
      dialogDescription={description}
      dialogFooter={
        <Button onClick={onClose} size='Medium' variant='Standard'>
          {translate('Action.Close')}
        </Button>
      }
      dialogTitle={translate('Label.Error')}
    />
  );
};

/**
 * Imperative trigger for the generic error dialog. Replaces every
 * `setModalConfigDataToErrorModal()` call in `lite_modules/`. Pass an
 * `AMAErrorResponseType` to surface the backend `message` + `code`; pass
 * nothing to show the generic localized copy.
 *
 * Safe to call from non-React contexts (axios interceptors, Zustand
 * actions, error handlers).
 */
export const openErrorDialog = (errorResponse?: AMAErrorResponseType): void => {
  openDialog({ component: ErrorDialog, props: { errorResponse } });
};

/**
 * Open an error dialog with a custom pre-translated message. Useful when
 * the error copy is not from an AMA error payload (e.g. validation errors,
 * business-rule violations).
 */
export const openErrorDialogWithMessage = (message: string): void => {
  openDialog({ component: ErrorDialog, props: { message } });
};
