import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { HubMeta, buildBreadcrumb, buildTitle } from '@rbx/creator-hub-history';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useSnackbar } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import behaviorInterventionClient from '@modules/clients/behaviorIntervention';
import type { DevexRequest } from '@modules/clients/billing';
import billingClient from '@modules/clients/billing';
import type { GetDevExInfoResponse } from '@modules/clients/economy';
import economyClient from '@modules/clients/economy';
import type { DevExInterventionDetail } from '@modules/clients/userModerationTypes';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CashoutForm from '../../cashOut/components/Form';
import DevexLanding from '../../devex/components/Devex';
import DevExModerationDialogs from '../../devex/components/DevExModerationDialogs';
import {
  applyAtRiskNudgeAcknowledged,
  isCashOutBlockedBySuspension,
} from '../../devex/utils/devexEligibility';

/** Delay before a second economy refetch so AMP suspension flags can propagate. */
const MODERATION_REFETCH_PROPAGATION_DELAY_MS = 750;

const DevexContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { reload: reloadPage } = useRouter();

  const [showCashoutForm, setShowCashoutForm] = useState<boolean>(false);

  const { user } = useAuthentication();
  const [userRobux, setUserRobux] = useState<number>();
  const [cashoutInfo, setCashoutInfo] = useState<GetDevExInfoResponse | undefined>();
  const [errorLoading, setErrorLoading] = useState<boolean>(false);
  const [cashoutSuccess, setCashoutSuccess] = useState<boolean>(false);
  const [pageLoadIntervention, setPageLoadIntervention] = useState<
    DevExInterventionDetail | null | undefined
  >(undefined);

  const { enqueue: addSnackbar } = useSnackbar();

  const { translate, ready } = useTranslation();

  const submitCashoutRequest = async (request: DevexRequest) => {
    unifiedLoggerClient.logClickEvent({ eventName: 'clickSubmitCashoutRequest' });
    await billingClient.DevexAPI.v1DeveloperExchangeRequestPost(request);

    setShowCashoutForm(false);
    setCashoutInfo(undefined);
    setPageLoadIntervention(undefined);
    setCashoutSuccess(true);
  };

  const onCashoutClick = () => {
    if (cashoutInfo && isCashOutBlockedBySuspension(cashoutInfo)) {
      return;
    }
    unifiedLoggerClient.logClickEvent({ eventName: 'clickCashoutBox' });
    setShowCashoutForm(true);
  };

  const onCancelCashout = () => {
    setShowCashoutForm(false);
  };

  const fetchCashoutInfoSnapshot = useCallback(async (): Promise<
    GetDevExInfoResponse | undefined
  > => {
    if (!user?.id) {
      return undefined;
    }

    try {
      return await economyClient.getDeveloperExchangeInfo(true);
    } catch {
      return undefined;
    }
  }, [user?.id]);

  const onModerationDismissed = useCallback(
    async (context: 'at-risk' | 'suspension') => {
      if (context === 'at-risk') {
        setCashoutInfo((current) => (current ? applyAtRiskNudgeAcknowledged(current) : current));
      }

      let info = await fetchCashoutInfoSnapshot();

      if (context === 'at-risk') {
        if (info?.isAtRiskOfSuspension === true) {
          await new Promise((resolve) => {
            setTimeout(resolve, MODERATION_REFETCH_PROPAGATION_DELAY_MS);
          });
          info = await fetchCashoutInfoSnapshot();
        }

        // Reconcile once AMP clears at-risk; keep optimistic state if economy is still stale.
        if (info && info.isAtRiskOfSuspension !== true) {
          setCashoutInfo(info);
        }
        return;
      }

      if (info) {
        setCashoutInfo(info);
      }
    },
    [fetchCashoutInfoSnapshot],
  );

  useEffect(() => {
    if (!user?.id || cashoutInfo) {
      return undefined;
    }

    let isActive = true;

    void behaviorInterventionClient
      .getDevExIntervention()
      .then((intervention) => {
        if (!isActive) {
          return;
        }
        setPageLoadIntervention(intervention);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setPageLoadIntervention(null);
      });

    void (async () => {
      try {
        const [{ robux }, info] = await Promise.all([
          economyClient.getUserCurrency(user.id),
          economyClient.getDeveloperExchangeInfo(true),
        ]);

        if (!isActive) {
          return;
        }

        setUserRobux(robux);
        setCashoutInfo(info);
      } catch {
        if (!isActive) {
          return;
        }

        setErrorLoading(true);
        setPageLoadIntervention(null);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [user, cashoutInfo]);

  useEffect(() => {
    if (cashoutSuccess && !!cashoutInfo && ready) {
      addSnackbar({
        message: translate('Message.RequestSubmitted'),
        autoHide: true,
        autoHideDuration: toastDurationTime,
      });
    }
  }, [cashoutSuccess, ready, cashoutInfo, addSnackbar, translate]);

  if (errorLoading) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={reloadPage}
      />
    );
  }

  if (!cashoutInfo || !ready) {
    return <PageLoading />;
  }

  return (
    <>
      <HubMeta
        title={buildTitle(translate('Heading.DevEx'))}
        breadcrumb={buildBreadcrumb(translate('Heading.Finances'), translate('Heading.DevEx'))}
      />
      <DevExModerationDialogs
        cashoutInfo={cashoutInfo}
        onModerationDismissed={onModerationDismissed}
        pageLoadIntervention={pageLoadIntervention}
        isPageLoadInterventionReady={pageLoadIntervention !== undefined || Boolean(cashoutInfo)}
      />
      {showCashoutForm ? (
        <CashoutForm
          cashoutInfo={cashoutInfo}
          submitRequest={submitCashoutRequest}
          onCancelCashout={onCancelCashout}
        />
      ) : (
        <DevexLanding
          cashoutInfo={cashoutInfo}
          userRobux={userRobux}
          onCashoutClick={onCashoutClick}
        />
      )}
    </>
  );
};

export default withTranslation(DevexContainer, [
  TranslationNamespace.DevEx,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
  TranslationNamespace.TaxDocumentation,
]);
