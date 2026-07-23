import { Button } from '@rbx/foundation-ui';
import { type ReactElement, useEffect } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { GetSitetestBaseUrl } from '@utils/url';

const AgeRestrictionDialog = ({ setDismissible }: BaseInjectedDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);

  useEffect(() => {
    setDismissible(false);
    return () => {
      setDismissible(true);
    };
    // Injected by the outlet; omit from deps to avoid re-running when the
    // outlet recreates the callback after dismissible state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BaseDialog
      dialogDescription={translate('Description.AgeNotEligibleContent')}
      dialogFooter={
        <Button
          onClick={() => {
            window.location.href = `https://www.${GetSitetestBaseUrl()}`;
          }}
          size='Medium'
          variant='Emphasis'>
          {translate('Action.VisitRoblox')}
        </Button>
      }
      dialogTitle={translate('Heading.AgeNotEligible')}
    />
  );
};

export const openAgeRestrictionDialog = (): void => {
  openDialog({ component: AgeRestrictionDialog, props: {} });
};

export default AgeRestrictionDialog;
