import React, { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useSettings } from '@modules/settings';
import { Alert, AlertTitle, Button, Grid, Link, Typography } from '@rbx/ui';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useCollaborators from '../hooks/useCollaborators';

const AgeRestrictedOverviewBanner: FunctionComponent = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const {
    params: { enableImpactedExperiencesView },
  } = useIXPParameters(IXPLayers.CreatorDashboard);
  const experienceId = router.query.id as string | undefined;
  const universeId = Number(experienceId);
  const { collaborators, isLoading } = useCollaborators(universeId);

  if (!enableImpactedExperiencesView || isLoading || collaborators.length === 0) {
    return null;
  }

  const handleViewCollaborators = () => {
    if (experienceId) {
      router.push(`/dashboard/creations/experiences/${experienceId}/safety/collaborators`);
    }
  };

  return (
    <Grid container wrap='nowrap' direction='column' sx={{ marginBottom: '24px' }}>
      <Alert
        severity='warning'
        action={
          <Button
            color='inherit'
            size='small'
            onClick={handleViewCollaborators}
            variant='outlined'
            sx={{ whiteSpace: 'nowrap' }}>
            {translate('Action.ViewCollaborators')}
          </Button>
        }>
        <Grid sx={{ marginBottom: '4px' }}>
          <AlertTitle>{translate('Title.TrustedRelationshipRequired')}</AlertTitle>
        </Grid>
        <Typography variant='body2'>{translate('Label.CollaboratorsListCanChange')}</Typography>{' '}
        <Typography variant='body2'>
          <Link
            href={settings.impactedExperiencesTrustedLearnMoreUrl}
            target='_blank'
            rel='noopener noreferrer'
            sx={{ color: 'inherit !important', textDecoration: 'underline' }}>
            {translate('Action.ViewDetails')}
          </Link>
        </Typography>
      </Alert>
    </Grid>
  );
};

export default withTranslation(AgeRestrictedOverviewBanner, [TranslationNamespace.Creations]);
