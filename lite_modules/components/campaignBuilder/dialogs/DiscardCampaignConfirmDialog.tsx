import { Button } from '@rbx/foundation-ui';
import { type ReactElement } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface DiscardCampaignConfirmDialogProps extends BaseInjectedDialogProps {
  onDiscard: () => void;
}

const DiscardCampaignConfirmDialog = ({
  onClose,
  onDiscard,
}: DiscardCampaignConfirmDialogProps): ReactElement => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);

  return (
    <BaseDialog
      dialogDescription={translateCampaign('Description.LoseCampaignProgress')}
      dialogFooter={
        <>
          <Button
            onClick={() => {
              onClose();
              onDiscard();
            }}
            size='Medium'
            variant='Alert'>
            {translateCampaign('Action.GoBackToCampaigns')}
          </Button>
          <Button onClick={onClose} size='Medium' variant='Standard'>
            {translateMisc('Action.Cancel')}
          </Button>
        </>
      }
      dialogTitle={translateCampaign('Heading.AreYouSure')}
    />
  );
};

export const openDiscardCampaignConfirmDialog = (onDiscard: () => void): void => {
  openDialog({
    component: DiscardCampaignConfirmDialog,
    props: { onDiscard },
  });
};
