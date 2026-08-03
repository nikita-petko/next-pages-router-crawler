import type { FunctionComponent } from 'react';
import { useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, Grid, Link, Typography } from '@rbx/ui';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useCollaborationStatus from '../hooks/useCollaborationStatus';
import useCollaborators from '../hooks/useCollaborators';

const AgeRestrictedOverviewBanner: FunctionComponent = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const { id } = router.query;
  const experienceId = typeof id === 'string' ? id : undefined;
  const universeId = Number(experienceId);
  const { response: collaborationStatus } = useCollaborationStatus(universeId);
  const isAdmin = collaborationStatus?.IsAdmin ?? false;
  const editorEntries = !isAdmin
    ? collaborationStatus?.EditView?.RequiresTrustedConnection
    : undefined;
  const { collaborators, isLoading } = useCollaborators(editorEntries);

  const bannerRef = useRef<HTMLDivElement>(null);
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const sendImpressionEvent = useCallback(() => {
    if (isLoading || collaborators.length === 0) {
      return;
    }
    unifiedLogger.logImpressionEvent({
      eventName: CreatorDashboardEventType.ImpactedExperiencesBanner,
      parameters: {
        page: 'experienceOverview',
        universeId: universeId.toString(),
      },
    });
  }, [unifiedLogger, isLoading, collaborators.length, universeId]);

  useImpressionObserver(bannerRef, sendImpressionEvent);

  const handleViewCollaborators = useCallback(() => {
    if (experienceId) {
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.ImpactedExperiencesBannerClick,
        parameters: {
          page: 'experienceOverview',
          action: 'viewCollaborators',
          universeId: universeId.toString(),
        },
      });
      void router.push(`/dashboard/creations/experiences/${experienceId}/safety/collaborators`);
    }
  }, [unifiedLogger, experienceId, universeId, router]);

  const handleViewDetailsClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.ImpactedExperiencesBannerClick,
      parameters: {
        page: 'experienceOverview',
        action: 'viewDetails',
        universeId: universeId.toString(),
      },
    });
  }, [unifiedLogger, universeId]);

  if (isLoading || collaborators.length === 0) {
    return null;
  }

  return (
    <div ref={bannerRef}>
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
              href={settings.impactedExperiencesDevForumUrl}
              target='_blank'
              rel='noopener noreferrer'
              onClick={handleViewDetailsClick}
              sx={{ color: 'inherit !important', textDecoration: 'underline' }}>
              {translate('Action.ViewDetails')}
            </Link>
          </Typography>
        </Alert>
      </Grid>
    </div>
  );
};

export default withTranslation(AgeRestrictedOverviewBanner, [TranslationNamespace.Creations]);
