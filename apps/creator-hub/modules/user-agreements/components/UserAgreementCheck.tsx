import Router, { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ClientType } from '@rbx/client-user-agreements-service/v1';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Typography, Dialog, DialogTemplate, Link } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { userAgreementsClient } from '@modules/clients/userAgreements';
import type { AgreementResolutionResponse } from '@modules/clients/userAgreements';
import { getResponseFromError } from '@modules/clients/utils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { dontShowAgreementPaths, maxUpdateRetryCount } from '../constants';
import { getAgreementName } from '../utils';

const UserAgreementCheck: FunctionComponent<React.PropsWithChildren> = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const { user, logout } = useAuthentication();
  const isAgreementFetched = useRef(false);
  const { captureError, error, info } = useMetricsMonitoring();
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [updatingAgreements, setUpdatingAgreements] = useState<boolean>(false);
  const [updateAgreements, setUpdateAgreements] = useState<AgreementResolutionResponse[]>([]);
  const tryUpdateAgreements = useCallback(
    async (agreementIds: string[]) => {
      async function updateAcceptanceWithRetry(ids: string[], retryTimes: number) {
        if (retryTimes <= 0) {
          error(`User Agreement accept failed after retried ${maxUpdateRetryCount} times`);
          return;
        }
        try {
          const response = await userAgreementsClient.acceptUserAgreements(ids);
          const failedAgreementIds = response.results?.reduce((prevValue, currentItem) => {
            if (currentItem.errorCode !== 0) {
              return [...prevValue, currentItem.agreementId];
            }
            return prevValue;
          }, [] as string[]);
          if (failedAgreementIds && failedAgreementIds.length > 0) {
            await updateAcceptanceWithRetry(failedAgreementIds, retryTimes - 1);
          }
        } catch (e) {
          const response = getResponseFromError(e);
          if (response?.status === StatusCodes.UNAUTHORIZED) {
            info('User Agreement accept failed with 401 from backend');
            await Router.push('/login');
          } else {
            error(`User Agreement accept failed with status code ${response?.status}`);
            await updateAcceptanceWithRetry(ids, retryTimes - 1);
          }
        }
      }
      await updateAcceptanceWithRetry(agreementIds, maxUpdateRetryCount);
    },
    [error, info],
  );

  const handleClose = useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      if (e instanceof Error) {
        captureError(e);
      }
      error('Logout after user reject update agreements failed');
    } finally {
      setShowDialog(false);
    }
  }, [captureError, error, logout]);

  const handleConfirm = useCallback(async () => {
    const agreementIdsNeedsUpdate = updateAgreements.map((agreements) => agreements.id);
    setUpdatingAgreements(true);
    await tryUpdateAgreements(agreementIdsNeedsUpdate);
    setUpdatingAgreements(false);
    setShowDialog(false);
  }, [tryUpdateAgreements, updateAgreements]);

  const fetchUpdateUserAgreements = useCallback(async () => {
    try {
      const promise =
        process.env.buildTarget === 'global'
          ? userAgreementsClient.getUserAgreements({
              clientType: ClientType.Studio,
            })
          : userAgreementsClient.getLuobuUserAgreement({
              clientType: ClientType.Studio,
            });
      const response = await promise;
      if (response.length > 0) {
        setUpdateAgreements([...response]);
        setShowDialog(true);
      }
    } catch (e) {
      error('Fetch update user-agreements failed');
      if (e instanceof Error) {
        captureError(e);
      }
    }
  }, [captureError, error]);

  useEffect(() => {
    if (
      user?.id !== undefined &&
      !isAgreementFetched.current &&
      router.isReady &&
      !dontShowAgreementPaths.some((path) => router.pathname.startsWith(path))
    ) {
      fetchUpdateUserAgreements();
      isAgreementFetched.current = true;
    }
  }, [user, fetchUpdateUserAgreements, router.isReady, router.pathname]);

  return (
    <Dialog open={showDialog}>
      <DialogTemplate
        onConfirm={handleConfirm}
        onCancel={handleClose}
        title={translate('Heading.AgreementsUpdate')}
        content={
          <>
            <Typography component='p' variant='body1'>
              {translate('Description.AgreementsUpdate')}
            </Typography>
            <ul>
              {updateAgreements.map((agreement) => (
                <li key={agreement.id}>
                  <Link href={agreement.displayUrl} target='__blank'>
                    {getAgreementName(agreement.agreementType, translate)}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        }
        confirmText={translate('Button.Accept')}
        cancelText={translate('Button.Reject')}
        loading={updatingAgreements}
      />
    </Dialog>
  );
};

export default withTranslation(UserAgreementCheck, [TranslationNamespace.AgreementsUpdate]);
