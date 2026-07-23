import { Button } from '@rbx/foundation-ui';
import { type ReactElement } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';

/**
 * Dialog shown when an action is attempted in impersonation mode but the
 * backend forbids it.
 *
 * NOTE: copy here is still hard-coded English (matches the legacy hook).
 * Localization of the impersonation message is tracked separately — it
 * was not localized in the original hook either, so we preserve behaviour
 * during the dialog-store migration and avoid scope creep.
 */
const ImpersonationErrorDialog = ({ onClose }: BaseInjectedDialogProps): ReactElement => (
  <BaseDialog
    dialogDescription='You are not allowed to perform this action in impersonation.'
    dialogFooter={
      <Button onClick={onClose} size='Medium' variant='Standard'>
        Close
      </Button>
    }
    dialogTitle='Error'
  />
);

/**
 * Imperative trigger for the impersonation error dialog. Replaces every
 * `useImpersonationErrorModal().openImpersonationErrorModal()` call.
 */
export const openImpersonationErrorDialog = (): void => {
  openDialog({ component: ImpersonationErrorDialog, props: {} });
};

export default ImpersonationErrorDialog;
