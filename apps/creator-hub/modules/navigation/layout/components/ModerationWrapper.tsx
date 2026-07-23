import { useAuthentication } from '@modules/authentication/providers';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { useRouter } from 'next/router';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ModerationModal } from '@rbx/creator-hub-error';
import { withTranslation } from '@rbx/intl';
import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { getAuthorizationEndpoint } from '../../applicationAuthorization/services/appAuthDataService';

const ModerationModalWithTranslation = withTranslation(ModerationModal, [
  TranslationNamespace.Error,
  TranslationNamespace.NotApproved,
  TranslationNamespace.AppealsPortal,
  TranslationNamespace.Moderation,
  TranslationNamespace.DashboardModeration,
]);

const REACTIVATION_WAIT_TIME = 2000;

const ModerationWrapper: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { status, logout } = useAuthentication();
  const [isUserModerated, setIsUserModerated] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    setIsUserModerated(status === 'moderated');
  }, [status]);

  useEffect(() => {
    let isMounted = true;

    const getLoginUrl = async () => {
      try {
        const authUrl = await getAuthorizationEndpoint({ redirectUri: process.env.baseUrl });
        if (isMounted) {
          setLoginUrl(authUrl);
        }
      } catch (e) {
        unifiedLoggerClient.logErrorEvent({
          eventName: 'moderationModalGetLoginUrlError',
          parameters: {
            error: e instanceof Error ? e.message : 'Unknown error',
          },
        });
      }
    };

    getLoginUrl();

    return () => {
      isMounted = false;
    };
  }, []);

  const onLogout = useCallback(
    async (setIsLogoutLoading: (isLogoutLoading: boolean) => void) => {
      try {
        await logout();
        router.push(loginUrl);
      } catch (e) {
        setIsLogoutLoading(false);
        unifiedLoggerClient.logErrorEvent({
          eventName: 'moderationModalLogoutError',
          parameters: {
            error: e instanceof Error ? e.message : 'Unknown error',
          },
        });
      }
    },
    [logout, router, loginUrl],
  );

  const onReactivate = useCallback(() => {
    setTimeout(() => {
      router.reload();
    }, REACTIVATION_WAIT_TIME);
  }, [router]);

  return (
    <React.Fragment>
      {children}
      {isUserModerated && (
        <ModerationModalWithTranslation
          onLogout={onLogout}
          onReactivate={onReactivate}
          isOpen={isUserModerated}
          unifiedLoggerClient={unifiedLoggerClient}
        />
      )}
    </React.Fragment>
  );
};

export default ModerationWrapper;
