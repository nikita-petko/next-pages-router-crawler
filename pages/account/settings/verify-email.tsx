import { Button } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { ParsedUrlQueryInput } from 'querystring';
import { ReactNode, useCallback, useEffect, useState } from 'react';

import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { sendEmailVerifyRequestWithTicket } from '@services/ads/emailVerificationService';
import { useModalStore } from '@stores/modalStoreProvider';
import { CaptureException } from '@utils/error';

const getPageLayout = (page: ReactNode) => page;

const VerifyEmail = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
  const router = useRouter();
  const { ticket } = router.query;
  const { setModalConfigData, setModalOpen } = useModalStore();
  const [verifyPageIsLoading, setVerifyPageIsLoading] = useState<boolean>(false);

  const navigateToLandingPage = useCallback(
    (verificationSucceeded: boolean) => {
      const query: ParsedUrlQueryInput = {};
      if (verificationSucceeded) {
        query.isFromSuccessfulEmailVerification = verificationSucceeded;
      }
      router.push({
        pathname: Routes.LANDING,
        query,
      });
    },
    [router],
  );

  const showErrorModal = useCallback(() => {
    setModalConfigData({
      // @ts-ignore
      dialogActions: (
        <Button
          onClick={() => {
            setModalOpen(false);
            navigateToLandingPage(false);
          }}
          size='Medium'
          variant='Standard'>
          {translate('Action.Close')}
        </Button>
      ),
      // @ts-ignore
      dialogContent: translate('Message.GenericError'),
      handleClose: () => {
        setModalOpen(false);
      },
      // @ts-ignore
      title: translate('Label.Error'),
    });
    setModalOpen(true);
  }, [setModalOpen, setModalConfigData, navigateToLandingPage, translate]);

  useEffect(() => {
    if (!router.isReady || !ticket) {
      return;
    }
    sendEmailVerifyRequestWithTicket({ ticket })
      .then(() => {
        navigateToLandingPage(true);
      })
      .catch((err: Error) => {
        CaptureException(err);
        navigateToLandingPage(false);
      })
      .finally(() => {
        setVerifyPageIsLoading(false);
      });
  }, [router.isReady, ticket, showErrorModal, navigateToLandingPage]);

  return verifyPageIsLoading ? <CenteredCircularProgress /> : null;
};

VerifyEmail.getPageLayout = getPageLayout;

export default VerifyEmail;
