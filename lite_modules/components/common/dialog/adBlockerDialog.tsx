import { Button } from '@rbx/foundation-ui';
import { type ReactElement } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

/** Session-scoped flag — resets on hard refresh, survives client-side navigation. */
let hasShownAdBlockerThisSession = false;

const AdBlockerDialog = ({ onClose }: BaseInjectedDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);

  return (
    <BaseDialog
      dialogDescription={translate('Description.TurnOffAdBlockerContent')}
      dialogFooter={
        <Button onClick={onClose} size='Medium' variant='Emphasis'>
          {translate('Action.ContinueUsingRobloxAds')}
        </Button>
      }
      dialogTitle={translate('Heading.TurnOffAdBlocker')}
    />
  );
};

export const openAdBlockerDialog = (): void => {
  if (hasShownAdBlockerThisSession) {
    return;
  }
  hasShownAdBlockerThisSession = true;
  openDialog({ component: AdBlockerDialog, props: {} });
};

/** Test-only reset for session flag. */
export const resetAdBlockerDialogSession = (): void => {
  hasShownAdBlockerThisSession = false;
};

export default AdBlockerDialog;
