import type { FunctionComponent } from 'react';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import { LicenseManagerClickEvent } from '@modules/ip/license-manager/utils/logger';
import { Link } from '@modules/miscellaneous/components';
import { AGREEMENT_MANAGER_CREATOR_REQUESTS_HREF, EXPLORE_LICENSES_HREF } from '../urls';

interface ApplicationSubmissionModalProps {
  isOpen: boolean;
  logClickEvent?: (eventName: LicenseManagerClickEvent) => void;
}

function noopLogClickEvent(): void {}

const ApplicationSubmissionModal: FunctionComponent<ApplicationSubmissionModalProps> = ({
  isOpen,
  logClickEvent = noopLogClickEvent,
}) => {
  const { translate } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      size='Medium'
      isModal
      hasCloseAffordance={false}
      data-testid='application-submission-modal'>
      <DialogContent>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {translate('Heading.LicenseApplicationSubmitted')}
          </DialogTitle>
          <span className='text-body-medium content-default margin-none'>
            {translate('Description.LicenseApplicationSubmitted')}
          </span>
        </DialogBody>
        <DialogFooter className='flex flex-col gap-small small:flex-row small:justify-end'>
          <Link href={EXPLORE_LICENSES_HREF}>
            <Button
              variant='contained'
              color='secondary'
              data-testid='application-submission-modal-back-to-licenses'
              onClick={() =>
                logClickEvent(
                  LicenseManagerClickEvent.SuccessfulLicenseRequestBackToLicensesClickEvent,
                )
              }>
              {translate('Button.BackToLicenses')}
            </Button>
          </Link>
          <Link href={AGREEMENT_MANAGER_CREATOR_REQUESTS_HREF}>
            <Button
              variant='contained'
              color='primaryBrand'
              data-testid='application-submission-modal-view-requests'
              onClick={() =>
                logClickEvent(
                  LicenseManagerClickEvent.SuccessfulLicenseRequestViewRequestsClickEvent,
                )
              }>
              {translate('Button.ViewRequests')}
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationSubmissionModal;
