import { useWorkspaces } from '@rbx/creator-hub-navigation';
import {
  SheetActions,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetRoot,
  SheetTitle,
  VisuallyHidden,
} from '@rbx/foundation-ui';
import { useEffect, useRef, useState } from 'react';

import { EventName, logNativeImpressionEvent } from '@clients/unifiedLogger';
import PaymentStep from '@components/account/PaymentStep';
import { type PaymentSetupCompletion } from '@components/billing/BuyAdCredit';
import { ADD_PAYMENT_TABS } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getGroupRobuxBalance, getRobuxBalance } from '@services/economy/robuxService';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { usePaymentStore } from '@stores/paymentStoreProvider';
import { CaptureException } from '@utils/error';
import { getSelectedGroupId } from '@utils/groupScopedAccount';

const PaymentMethodDrawer = () => {
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspaces();
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const groupId = getSelectedGroupId(currentWorkspace, isAdAccountAutoCreateEnabled);
  const isOpen = useCampaignBuilderStore((state) => state.paymentMethodDrawerOpen);
  const initialPaymentTab = useCampaignBuilderStore(
    (state) => state.paymentMethodDrawerInitialPaymentTab,
  );
  const initialBalanceScope = useCampaignBuilderStore(
    (state) => state.paymentMethodDrawerInitialBalanceScope,
  );
  const setOpen = useCampaignBuilderStore((state) => state.setPaymentMethodDrawerOpen);
  const refreshPaymentProfiles = usePaymentStore((state) => state.getPaymentProfiles);
  const refreshAppPaymentProfiles = useAppStore((state) => state.getPaymentProfiles);
  const refreshAdCredit = useAppStore((state) => state.getAdCredit);
  const refreshAdCreditAndRobuxBalances = useAppStore(
    (state) => state.refreshAdCreditAndRobuxBalances,
  );
  const userOver18 = useAppStore((state) => state.appData.userOver18);

  const [adCreditBalance, setAdCreditBalance] = useState<number>(0);
  const [actionsContainer, setActionsContainer] = useState<HTMLDivElement | null>(null);
  const [groupAdCreditBalance, setGroupAdCreditBalance] = useState<number>(0);
  const [groupBalanceError, setGroupBalanceError] = useState<boolean>(false);
  const [groupRobuxBalance, setGroupRobuxBalance] = useState<number>(0);
  const [robuxBalance, setRobuxBalance] = useState<number>(0);
  const [paymentDataLoading, setPaymentDataLoading] = useState<boolean>(true);
  const [paymentTab, setPaymentTab] = useState<ADD_PAYMENT_TABS>(
    userOver18 ? (initialPaymentTab ?? ADD_PAYMENT_TABS.CREDIT_CARD) : ADD_PAYMENT_TABS.ADS_CREDIT,
  );
  const hasLoggedStepStarted = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      hasLoggedStepStarted.current = false;
      return undefined;
    }

    if (isWorkspaceLoading) {
      return undefined;
    }

    if (!hasLoggedStepStarted.current) {
      logNativeImpressionEvent(EventName.NewUserFlowSetupStepStarted, {
        step: '3',
        stepName: 'paymentMethod',
      });
      hasLoggedStepStarted.current = true;
    }

    let ignoreResponse = false;
    const fetchPaymentData = async () => {
      setPaymentDataLoading(true);
      try {
        setGroupBalanceError(false);
        const balancePromises = [
          refreshAdCredit(),
          getRobuxBalance(),
          groupId ? refreshAdCredit(groupId) : Promise.resolve(undefined),
          groupId ? getGroupRobuxBalance(groupId) : Promise.resolve(undefined),
        ] as const;
        const [adCreditResult, robuxResult, groupAdCreditResult, groupRobuxResult] =
          await Promise.allSettled(balancePromises);
        if (ignoreResponse) {
          return;
        }
        if (adCreditResult.status === 'fulfilled') {
          setAdCreditBalance(adCreditResult.value?.ad_credit_balance_in_micro || 0);
        }
        if (robuxResult.status === 'fulfilled') {
          setRobuxBalance(robuxResult.value?.robux || 0);
        }
        if (groupId) {
          if (groupAdCreditResult.status === 'fulfilled') {
            setGroupAdCreditBalance(groupAdCreditResult.value?.ad_credit_balance_in_micro || 0);
          } else {
            CaptureException(groupAdCreditResult.reason as Error);
            setGroupBalanceError(true);
            setGroupAdCreditBalance(0);
          }
          if (groupRobuxResult.status === 'fulfilled') {
            setGroupRobuxBalance(groupRobuxResult.value?.robux || 0);
          } else {
            CaptureException(groupRobuxResult.reason as Error);
            setGroupBalanceError(true);
            setGroupRobuxBalance(0);
          }
        } else {
          setGroupAdCreditBalance(0);
          setGroupRobuxBalance(0);
        }
      } finally {
        if (!ignoreResponse) {
          setPaymentDataLoading(false);
        }
      }
    };

    fetchPaymentData();
    setPaymentTab(
      userOver18
        ? (initialPaymentTab ?? ADD_PAYMENT_TABS.CREDIT_CARD)
        : ADD_PAYMENT_TABS.ADS_CREDIT,
    );

    return () => {
      ignoreResponse = true;
    };
  }, [groupId, initialPaymentTab, isOpen, isWorkspaceLoading, refreshAdCredit, userOver18]);

  useEffect(() => {
    if (!userOver18) {
      setPaymentTab(ADD_PAYMENT_TABS.ADS_CREDIT);
    }
  }, [userOver18]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleComplete = async (completion?: PaymentSetupCompletion) => {
    logNativeImpressionEvent(EventName.NewUserFlowSetupDrawerCompleted, {
      accountScope: completion?.accountScope ?? 'user',
      groupId: completion?.groupId !== undefined ? String(completion.groupId) : undefined,
      paymentMethodType: completion?.paymentMethodType,
    });
    const refreshGroupBalances = groupId
      ? Promise.allSettled([refreshAdCredit(groupId), getGroupRobuxBalance(groupId)]).then(
          ([groupAdCreditResult, groupRobuxResult]) => {
            setGroupBalanceError(false);
            if (groupAdCreditResult.status === 'fulfilled') {
              setGroupAdCreditBalance(groupAdCreditResult.value?.ad_credit_balance_in_micro || 0);
            } else {
              CaptureException(groupAdCreditResult.reason as Error);
              setGroupBalanceError(true);
            }
            if (groupRobuxResult.status === 'fulfilled') {
              setGroupRobuxBalance(groupRobuxResult.value?.robux || 0);
            } else {
              CaptureException(groupRobuxResult.reason as Error);
              setGroupBalanceError(true);
            }
          },
        )
      : Promise.resolve();
    await Promise.all([
      refreshPaymentProfiles(true),
      refreshAppPaymentProfiles(true),
      refreshAdCreditAndRobuxBalances(),
      refreshGroupBalances,
    ]);
    setOpen(false);
  };

  return (
    <SheetRoot
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      open={isOpen}>
      <SheetContent
        closeLabel={translateAccount('Action.Close')}
        largeScreenClassName='!max-width-[50vw] width-full'
        largeScreenVariant='side'>
        <SheetTitle>{translateBilling('Heading.PaymentMethod')}</SheetTitle>
        <SheetBody className='padding-bottom-xlarge'>
          <SheetDescription>
            <VisuallyHidden>{translateBilling('Heading.PaymentMethod')}</VisuallyHidden>
          </SheetDescription>
          <PaymentStep
            actionsContainer={actionsContainer}
            adCreditBalance={adCreditBalance}
            groupAdCreditBalance={groupAdCreditBalance}
            groupId={groupId}
            groupName={currentWorkspace?.creatorName}
            groupRobuxBalance={groupRobuxBalance}
            initialBalanceScope={initialBalanceScope ?? undefined}
            isUnlocked
            onCancel={handleClose}
            onComplete={handleComplete}
            onPaymentTabChange={setPaymentTab}
            paymentDataLoading={paymentDataLoading}
            paymentTab={paymentTab}
            robuxBalance={robuxBalance}
            showGroupBalanceOption={Boolean(groupId) && !groupBalanceError}
            userOver18={!!userOver18}
          />
        </SheetBody>
        <SheetActions>
          <div className='flex flex-row gap-medium width-full' ref={setActionsContainer} />
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default PaymentMethodDrawer;
