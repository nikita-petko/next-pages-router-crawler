import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { Badge, Button, Icon, IconButton } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useServerSummary from '../../hooks/useServerSummary';
import { joinGameInstance, shutdownGameInstance } from '../../utils/ServerActions';
import { getStatusDescriptionKey } from '../../utils/serverStatus';
import useToast from '../../utils/useToast';
import ServerStatusIndicator from '../ServerStatusIndicator';

const ServerDetailsHeader: FunctionComponent = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const showToast = useToast();
  const [isRestarting, setIsRestarting] = useState(false);

  const {
    id: queryUniverseId,
    placeId: queryPlaceId,
    jobId: queryJobId,
    shutdown: queryShutdown,
  } = router.query;
  const rawUniverseId = Array.isArray(queryUniverseId) ? queryUniverseId[0] : queryUniverseId;
  const rawPlaceId = Array.isArray(queryPlaceId) ? queryPlaceId[0] : queryPlaceId;
  const rawJobId = Array.isArray(queryJobId) ? queryJobId[0] : queryJobId;
  const rawShutdown = Array.isArray(queryShutdown) ? queryShutdown[0] : queryShutdown;
  const placeId = rawPlaceId != null && rawPlaceId !== '' ? parseInt(rawPlaceId, 10) : undefined;
  const jobId = rawJobId != null && rawJobId !== '' ? rawJobId : '';
  const { data: serverSummary } = useServerSummary({
    universeId: rawUniverseId ?? '',
    placeId: placeId ?? 0,
    jobId,
  });
  const isShutdown = rawShutdown === '1' || serverSummary?.isShutdown === true;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleJoinServer = useCallback(() => {
    if (jobId && placeId) {
      joinGameInstance(jobId, placeId);
    }
  }, [jobId, placeId]);

  const handleRestartServer = useCallback(async () => {
    if (placeId === undefined || !jobId || isRestarting) {
      return;
    }
    setIsRestarting(true);
    try {
      const response = await shutdownGameInstance(placeId, jobId);
      if (!response.ok) {
        showToast(translate('ServerDetailsPage.Snackbar.ErrorLaunchingRestart'));
      }
    } catch {
      showToast(translate('ServerDetailsPage.Snackbar.ErrorLaunchingRestart'));
    } finally {
      setIsRestarting(false);
    }
  }, [placeId, jobId, isRestarting, showToast, translate]);

  const canRestart = !isShutdown && placeId !== undefined && jobId !== '' && !isRestarting;
  const jobIdSubtitle = translate('ServerDetailsPage.Label.JobId', { jobId });

  return (
    <div className='flex items-center width-full gap-medium wrap'>
      <div>
        <IconButton
          icon='icon-regular-chevron-large-left'
          variant='Utility'
          size='Small'
          ariaLabel={translate('ServerDetailsPage.Actions.BackToServerList')}
          onClick={handleBack}
        />
      </div>
      <div className='grow-1 min-width-0 flex flex-col gap-xsmall'>
        <header>
          <Typography variant='h3'>{translate('Heading.ServerDetails')}</Typography>
        </header>
        <Typography>{jobIdSubtitle}</Typography>
        <div className='flex items-center gap-small wrap min-height-600'>
          {serverSummary?.status && (
            <ServerStatusIndicator
              status={serverSummary.status}
              label={translate(serverSummary.status)}
              description={translate(
                getStatusDescriptionKey(serverSummary.status) ?? serverSummary.status,
              )}
            />
          )}
          {serverSummary?.serverType && (
            <Badge label={translate(serverSummary.serverType)} variant='Neutral' />
          )}
        </div>
      </div>
      {!isShutdown && (
        <div className='flex gap-small shrink-0'>
          <Button
            variant='Standard'
            size='Medium'
            onClick={handleJoinServer}
            isDisabled={!jobId || serverSummary?.serverType !== 'ServerType.Public'}>
            <div className='flex items-center gap-small'>
              {translate('ServerDetailsPage.Actions.JoinServer')}
              <Icon name='icon-filled-arrow-up-right-from-square' />
            </div>
          </Button>
          <Button
            variant='Standard'
            size='Medium'
            onClick={handleRestartServer}
            isDisabled={!canRestart}
            isLoading={isRestarting}>
            {translate('ServerDetailsPage.Actions.RestartServer')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default withTranslation(ServerDetailsHeader, [TranslationNamespace.ServerManagement]);
