import { FunctionComponent } from 'react';
import {
  Button,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@rbx/ui';
import { Link } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import { LicenseManagerClickEvent } from '@modules/ip/license-manager/utils/logger';

import { AGREEMENT_MANAGER_CREATOR_REQUESTS_HREF, EXPLORE_LICENSES_HREF } from '../urls';

interface ApplicationSubmissionModalProps {
  isOpen: boolean;
  logClickEvent?: (eventName: LicenseManagerClickEvent) => void;
}

const ApplicationSubmissionModal: FunctionComponent<ApplicationSubmissionModalProps> = ({
  isOpen,
  logClickEvent = () => null,
}) => {
  const { translate } = useTranslation();

  return (
    <Dialog fullWidth maxWidth='Medium' open={isOpen} data-testid='application-submission-modal'>
      <DialogTitle>
        <Grid container paddingLeft={1.5} paddingRight={1.5} paddingTop={1.5}>
          <Typography variant='h4' data-testid='application-submission-modal-title'>
            {translate('Heading.LicenseApplicationSubmitted')}
          </Typography>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Grid container paddingLeft={1.5} paddingRight={1.5} paddingTop={1.5}>
          <Typography
            variant='body1'
            color='secondary'
            data-testid='application-submission-modal-description'>
            {translate('Description.LicenseApplicationSubmitted')}
          </Typography>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Grid container justifyContent='flex-end' spacing={1.5}>
          <Grid item>
            <Link href={EXPLORE_LICENSES_HREF}>
              <Button
                size='large'
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
          </Grid>
          <Grid item>
            <Link href={AGREEMENT_MANAGER_CREATOR_REQUESTS_HREF}>
              <Button
                size='large'
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
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationSubmissionModal;
