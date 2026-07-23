import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import formatDate from '../../agreements/utils/formatDate';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';

export enum CreatorConfirmationType {
  ChangeRequest = 'ChangeRequest',
  ConditionalChangeRequest = 'ConditionalChangeRequest',
  IpRemoval = 'IpRemoval',
}

interface ConfirmationContent {
  titleKey: string;
  descriptionKey: string;
  includeEndDateInDescription?: boolean;
}

const confirmationContent: Record<CreatorConfirmationType, ConfirmationContent> = {
  [CreatorConfirmationType.ConditionalChangeRequest]: {
    titleKey: 'Heading.CreatorConfirmConditionalChangeImplemented',
    descriptionKey: 'Description.CreatorConfirmConditionalChangeImplemented',
  },
  [CreatorConfirmationType.ChangeRequest]: {
    titleKey: 'Heading.CreatorConfirmChangeImplemented',
    descriptionKey: 'Description.CreatorConfirmChangeImplemented',
  },
  [CreatorConfirmationType.IpRemoval]: {
    titleKey: 'Heading.CreatorConfirmIpRemoved',
    descriptionKey: 'Description.CreatorConfirmIpRemoved',
    includeEndDateInDescription: true,
  },
};

interface CreatorConfirmCompleteActionModalProps {
  agreementId: string;
  isOpen: boolean;
  confirmationType: CreatorConfirmationType;
  endDate?: Date | null;
  closeModal: () => void;
  submitComplete: () => void;
}

const CreatorConfirmCompleteActionModal: FunctionComponent<
  CreatorConfirmCompleteActionModalProps
> = ({ agreementId, isOpen, confirmationType, endDate, closeModal, submitComplete }) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const isChangeRequest = confirmationType === CreatorConfirmationType.ChangeRequest;
  const { titleKey, descriptionKey, includeEndDateInDescription } =
    confirmationContent[confirmationType];

  const handleConfirm = useCallback(() => {
    submitComplete();
  }, [submitComplete]);

  const handleCancel = useCallback(() => {
    if (isChangeRequest) {
      logEvent(
        LicenseManagerClickEvent.CreatorAgreementDetailsPageCloseCompleteChangeRequestModalClickEvent,
        {
          agreementId,
        },
      );
    }

    closeModal();
  }, [agreementId, closeModal, isChangeRequest, logEvent]);

  return (
    <Dialog open={isOpen} size='Medium' isModal hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {translate(titleKey)}
          </DialogTitle>
          <span className='text-body-medium content-default margin-none'>
            {includeEndDateInDescription
              ? translate(descriptionKey, {
                  endDate: formatDate(endDate, locale ?? Locale.English),
                })
              : translate(descriptionKey)}
          </span>
        </DialogBody>
        <DialogFooter className='flex flex-col gap-small small:flex-row small:justify-end'>
          <Button variant='contained' color='secondary' onClick={handleCancel}>
            {translate('Action.Cancel')}
          </Button>
          <Button variant='contained' color='primaryBrand' onClick={handleConfirm}>
            {translate('Action.Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorConfirmCompleteActionModal;
