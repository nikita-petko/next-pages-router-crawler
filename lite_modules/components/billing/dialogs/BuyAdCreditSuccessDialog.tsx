import { Button, Icon } from '@rbx/foundation-ui';
import { type ReactElement, useEffect } from 'react';

import styles from '@components/billing/dialogs/BuyAdCreditSuccessDialog.module.css';
import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { CaptureException } from '@utils/error';

interface BuyAdCreditSuccessDialogProps extends BaseInjectedDialogProps {
  adCreditAmount: string;
  onAcknowledge?: () => void | Promise<void>;
  robuxAmount: string;
}

const BuyAdCreditSuccessDialog = ({
  adCreditAmount,
  onAcknowledge,
  onClose,
  robuxAmount,
  setDismissible,
}: BuyAdCreditSuccessDialogProps): ReactElement => {
  const { translate: translateBilling, translateHTML: translateBillingHTML } =
    useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );

  useEffect(() => {
    setDismissible(false);
    return () => {
      setDismissible(true);
    };
    // Injected by the outlet; omit from deps to avoid re-running when the
    // outlet recreates the callback after dismissible state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = (): void => {
    const acknowledgeResult = onAcknowledge?.();
    if (acknowledgeResult instanceof Promise) {
      acknowledgeResult.catch((error: unknown) => {
        CaptureException(error as Error);
      });
    }
    onClose();
  };

  return (
    <BaseDialog
      dialogBody={
        <div className='flex flex-col gap-y-large content-muted'>
          <p className='margin-none text-body-large'>
            {translateBillingHTML('Description.AdCreditPurchaseSuccessSummary', null, {
              adCreditAmount,
              robuxAmount,
              robuxIcon: (
                <span className={styles.inlineRobuxIcon}>
                  <Icon name='icon-filled-robux' size='Medium' />
                </span>
              ),
            })}
          </p>
          <p className='margin-none text-body-small'>
            {translateBilling('Description.AdCreditPurchaseFinalUse')}
          </p>
        </div>
      }
      dialogFooter={
        <Button
          className='padding-x-xlarge'
          data-testid='dialogCloseButton'
          onClick={handleClose}
          size='Medium'
          variant='Emphasis'>
          {translateCreativeLibrary('Action.OK')}
        </Button>
      }
      dialogTitle={translateBilling('Heading.BuyAdCreditSuccess')}
    />
  );
};

export const openBuyAdCreditSuccessDialog = (
  adCreditAmount: string,
  robuxAmount: string,
  onAcknowledge?: () => void | Promise<void>,
): void => {
  openDialog({
    component: BuyAdCreditSuccessDialog,
    props: { adCreditAmount, onAcknowledge, robuxAmount },
  });
};
