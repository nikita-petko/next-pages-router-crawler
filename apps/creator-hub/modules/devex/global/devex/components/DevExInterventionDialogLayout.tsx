import type { FunctionComponent, ReactNode } from 'react';
import React, { useCallback } from 'react';
import { Button, Dialog, DialogBody, DialogContent, DialogTitle, Link } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

const preventDialogOpenAutoFocus = (event: Event) => {
  event.preventDefault();
};

type DevExInterventionDialogLayoutProps = {
  testId: string;
  title: ReactNode;
  body: ReactNode;
  appealUrl: string;
  onClose: () => void | Promise<void>;
  detailsCard?: ReactNode;
  dsaMessage?: string;
  /** When false, hides the separate appeal prompt (body already includes an appeal link). */
  showAppealPrompt?: boolean;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
};

const DevExInterventionDialogLayout: FunctionComponent<DevExInterventionDialogLayoutProps> = ({
  testId,
  title,
  body,
  appealUrl,
  onClose,
  detailsCard,
  dsaMessage,
  showAppealPrompt = true,
  confirmDisabled = false,
  confirmLoading = false,
}) => {
  const { translate, translateHTML } = useTranslation();
  const confirmLabel = translate('Action.Continue');
  const automatedDisclosure = translate('Message.AutomatedModerationDisclosure');
  const disclosure =
    typeof dsaMessage === 'string' && dsaMessage.trim().length > 0
      ? dsaMessage
      : automatedDisclosure;

  const handleConfirmClick = useCallback(() => {
    if (confirmDisabled || confirmLoading) {
      return;
    }
    void onClose();
  }, [confirmDisabled, confirmLoading, onClose]);

  return (
    <Dialog open isModal size='Medium' hasCloseAffordance={false}>
      <DialogContent
        className='width-full'
        data-testid={testId}
        onOpenAutoFocus={preventDialogOpenAutoFocus}>
        <DialogBody className='flex flex-col gap-medium'>
          <DialogTitle className='text-heading-small margin-none padding-none'>{title}</DialogTitle>

          <p className='text-body-medium content-muted margin-none'>{body}</p>

          {detailsCard}

          {showAppealPrompt ? (
            <p className='text-body-small content-muted margin-none'>
              {translateHTML('Description.DidWeMakeAMistake', [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content(chunks) {
                    return (
                      <Link
                        href={appealUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        isExternal={false}>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </p>
          ) : null}

          <Button
            variant='Emphasis'
            size='Medium'
            className='width-full'
            isDisabled={confirmDisabled || confirmLoading}
            isLoading={confirmLoading}
            onClick={handleConfirmClick}>
            {confirmLabel}
          </Button>

          <p className='text-caption-medium content-muted margin-none'>{disclosure}</p>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default DevExInterventionDialogLayout;
