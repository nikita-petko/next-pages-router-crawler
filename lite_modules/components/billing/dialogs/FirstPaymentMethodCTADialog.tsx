import { Button } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { type ReactElement } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface FirstPaymentMethodCTADialogProps extends BaseInjectedDialogProps {
  /** Pre-translated description text shown below the title. */
  description: string;
}

const FirstPaymentMethodCTADialog = ({
  description,
  onClose,
}: FirstPaymentMethodCTADialogProps): ReactElement => {
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const router = useRouter();

  const handleCreateCampaign = (): void => {
    unifiedLogger.logClickEvent({
      eventName: EventName.CreateCampaignFromPaymentSettingsClicked,
    });
    onClose();
    router.push(Routes.HOME);
  };

  return (
    <BaseDialog
      dialogDescription={description}
      dialogFooter={
        <>
          <Button
            data-testid='createCampaignFromFirstPayment'
            onClick={handleCreateCampaign}
            size='Medium'
            variant='Emphasis'>
            {translateBilling('Action.CreateCampaign')}
          </Button>
          <Button onClick={onClose} size='Medium' variant='Standard'>
            {translateMisc('Action.Close')}
          </Button>
        </>
      }
      dialogTitle={translateBilling('Heading.PaymentMethodAdded')}
    />
  );
};

/**
 * Imperative opener for the "first payment method added" CTA dialog. The
 * description text is pre-translated by the caller because it varies by the
 * trigger (ad-credit purchase vs. card verification).
 */
export const openFirstPaymentMethodCTADialog = (description: string): void => {
  openDialog({ component: FirstPaymentMethodCTADialog, props: { description } });
};

export default FirstPaymentMethodCTADialog;
