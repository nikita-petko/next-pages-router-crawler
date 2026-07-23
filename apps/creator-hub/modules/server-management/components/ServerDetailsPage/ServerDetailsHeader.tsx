import React, { FunctionComponent, useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { Button, Icon, IconButton } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { joinGameInstance, shutdownGameInstance } from '../../utils/ServerActions';
import useToast from '../../utils/useToast';
import { useServerType } from '../../providers/ServerTypeContext';

const ServerDetailsHeader: FunctionComponent = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const showToast = useToast();
  const { serverType } = useServerType();
  const [isRestarting, setIsRestarting] = useState(false);

  const { placeId: queryPlaceId, jobId: queryJobId } = router.query;
  const rawPlaceId = Array.isArray(queryPlaceId) ? queryPlaceId[0] : queryPlaceId;
  const rawJobId = Array.isArray(queryJobId) ? queryJobId[0] : queryJobId;
  const placeId = rawPlaceId != null && rawPlaceId !== '' ? parseInt(rawPlaceId, 10) : undefined;
  const jobId = rawJobId != null && rawJobId !== '' ? rawJobId : '';

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleJoinServer = useCallback(() => {
    if (jobId && placeId) {
      joinGameInstance(jobId, placeId);
    }
  }, [jobId, placeId]);

  const handleRestartServer = useCallback(async () => {
    if (placeId === undefined || !jobId || isRestarting) return;
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

  const canRestart = placeId !== undefined && jobId !== '' && !isRestarting;

  return (
    <div className='flex items-center width-full gap-medium wrap'>
      <div>
        <IconButton
          icon='icon-regular-chevron-large-left'
          variant='Utility'
          size='Small'
          ariaLabel='Back to server list'
          onClick={handleBack}
        />
      </div>
      <div className='grow-1 min-width-0'>
        <header>
          <Typography variant='h3'>{translate('Heading.ServerDetails')}</Typography>
        </header>
      </div>
      <div className='flex gap-small shrink-0'>
        <Button
          variant='Standard'
          size='Medium'
          onClick={handleJoinServer}
          isDisabled={!jobId || serverType !== 'ServerType.Public'}>
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
    </div>
  );
};

export default ServerDetailsHeader;
