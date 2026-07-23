import React, { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  PublicOutlinedIcon,
  VerifiedUserOutlinedIcon,
  CheckCircleIcon,
} from '@rbx/ui';
import {
  useGetActivationEligibilityForUniverse,
  useGetActivationEligibilityForUser,
} from '@modules/react-query/develop';
import { useSettings } from '@modules/settings';

export interface StepsToGoPublicModalProps {
  open: boolean;
  onClose: () => void;
  universeId?: number;
}

const StepsToGoPublicModal: FunctionComponent<
  React.PropsWithChildren<StepsToGoPublicModalProps>
> = ({ open, onClose, universeId }) => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const enablePublishingPermissions = settings.enableCoreContentStatusLabelLink;

  const { data: activationEligibility } = useGetActivationEligibilityForUniverse(universeId);
  const { data: userActivationEligibility } = useGetActivationEligibilityForUser();

  const isPublicPublishEligible = userActivationEligibility?.isEligible ?? false;

  const isMaturityLabelComplete = activationEligibility?.maturityRated ?? false;

  const handlePublicPublishManage = () => {
    router.push(
      enablePublishingPermissions
        ? '/settings/eligibility/publishing-permissions'
        : '/settings/eligibility/public-publish',
    );
    onClose();
  };

  const handleMaturityLabelManage = () => {
    if (universeId) {
      router.push(`/dashboard/creations/experiences/${universeId}/experience-questionnaire`);
    } else {
      router.push('/dashboard/creations');
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='Medium' fullWidth>
      <DialogTitle>
        <Typography variant='h3'>{translate('Heading.StepsToGoPublic')}</Typography>
      </DialogTitle>
      <DialogContent>
        <Grid item container alignItems='top' flexWrap='nowrap' mt={2} mb={2}>
          <Grid item flex='0 0 auto' m={1} mr={2}>
            <PublicOutlinedIcon fontSize='large' />
          </Grid>
          <Grid item flex='1 1 auto'>
            <Typography component='p' variant='h5' mb={1} mt={enablePublishingPermissions ? 1 : 0}>
              {translate('Heading.PublicPublishEligibility')}
            </Typography>
            {!enablePublishingPermissions && (
              <Typography component='p' variant='body1'>
                {translate('Description.PublicPublishEligibility')}
              </Typography>
            )}
          </Grid>
          <Grid item flex='0 0 auto' m={1}>
            {isPublicPublishEligible ? (
              <CheckCircleIcon fontSize='large' />
            ) : (
              <Button variant='contained' color='secondary' onClick={handlePublicPublishManage}>
                {translate('Action.Manage')}
              </Button>
            )}
          </Grid>
        </Grid>
        <Divider />
        <Grid item container alignItems='top' flexWrap='nowrap' mt={2} mb={2}>
          <Grid item flex='0 0 auto' m={1} mr={2}>
            <VerifiedUserOutlinedIcon fontSize='large' />
          </Grid>
          <Grid item flex='1 1 auto'>
            <Typography component='p' variant='h5' mb={1}>
              {translate('Heading.MaturityLabel')}
            </Typography>
            <Typography component='p' variant='body1'>
              {translate('Description.MaturityLabel')}
            </Typography>
          </Grid>
          <Grid item flex='0 0 auto' m={1}>
            {isMaturityLabelComplete ? (
              <CheckCircleIcon fontSize='large' />
            ) : (
              <Button variant='contained' color='secondary' onClick={handleMaturityLabelManage}>
                {translate('Action.Manage')}
              </Button>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' color='secondary' onClick={onClose} fullWidth>
          {translate('Action.Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(StepsToGoPublicModal, [TranslationNamespace.PublicPublish]);
