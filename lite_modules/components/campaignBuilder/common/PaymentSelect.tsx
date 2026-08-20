import { useWorkspaces } from '@rbx/creator-hub-navigation';
import {
  Dropdown,
  Icon,
  Menu,
  MenuItem,
  MenuLabel,
  MenuSection,
  MenuSeparator,
} from '@rbx/foundation-ui';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import type { core } from 'zod';

import { PaymentMethodDrawerBroadcastChannel } from '@clients/paymentMethodDrawerBroadcastChannel';
import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import { openGroupAdAccountSetupDialog } from '@components/billing/dialogs/GroupAdAccountSetupDialog';
import useCampaignBuilderCommonStyles from '@components/campaignBuilder/common/CampaignBuilderCommon.styles';
import useFormLayoutStyles from '@components/campaignBuilder/common/FormLayout.styles';
import AppTooltip from '@components/common/AppTooltip';
import PaymentMethodIcon from '@components/common/PaymentMethodIcon';
import Skeleton from '@components/common/Skeleton';
import { AdAccountType } from '@constants/app';
import { AdCreditBalanceScope, ADD_PAYMENT_TABS } from '@constants/billing';
import { isAdCreditPaymentType, ServerBudgetType, ServerPaymentType } from '@constants/campaign';
import {
  CONTINUOUS_VALUE,
  DefaultDuration,
  FAILED_TO_FETCH_PAYMENT_METHOD_COPY,
  FlowTypes,
  FormField,
  NO_PAYMENT_METHOD_COPY,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useGroupSpendPermission from '@hooks/useGroupSpendPermission';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { usePaymentStore } from '@stores/paymentStoreProvider';
import { GetEditTooltipTitle } from '@utils/campaignBuilder';
import { MicroUsdToUsdStringRoundedDown, MicroUsdToUsdStringRoundedUp } from '@utils/currency';
import { getSelectedGroupId } from '@utils/groupScopedAccount';

interface ZodFormIssue {
  message: string;
  type: core.$ZodIssueCode;
}

const ADD_CREDIT_CARD_OPTION_VALUE = 'add-credit-card';

interface PaymentTypeSelectOption {
  disabled?: boolean;
  /** Optional accessory rendered before the title inside the open menu only. */
  leading?: ReactNode;
  shouldShow: boolean;
  /** Foundation derives the collapsed trigger text from this string. */
  title: string;
  value: ServerPaymentType;
}

const PaymentSelect = () => {
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { currentWorkspace } = useWorkspaces();
  const { control, getValues, setValue } = useFormContext<FormType>();
  const isAutoReloadEnabled = useWatch<FormType, typeof FormField.IS_AUTO_RELOAD_ENABLED>({
    name: FormField.IS_AUTO_RELOAD_ENABLED,
  });
  const paymentType = useWatch<FormType, typeof FormField.PAYMENT_TYPE>({
    name: FormField.PAYMENT_TYPE,
  });

  const isExtendToOffPlatformEnabled = useWatch<
    FormType,
    typeof FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED
  >({
    name: FormField.IS_EXTEND_TO_OFF_PLATFORM_ENABLED,
  });

  const {
    card_network: cardNetwork,
    exp_month: expMonth,
    exp_year: expYear,
    last_four_digits: lastFourDigits,
  } = usePaymentStore((state) => state.paymentProfiles?.data?.[0] || {});
  const rawAdCreditBalance = useAppStore(
    (state) => state.adCreditState.data?.ad_credit_balance_in_micro || 0,
  );
  const formattedAdCreditBalance = MicroUsdToUsdStringRoundedDown(rawAdCreditBalance);
  const adCreditActivated = useAppStore((state) => state.adCreditState.data?.is_account_activated);
  const paymentFailure = useAppStore((state) => state.appData?.paymentFailure);
  const currentUser = useAppStore((state) => state.appData?.currentUser);
  const hasPaymentProfile = usePaymentStore((state) => state.paymentProfiles?.data?.length > 0);
  const shouldShowCreditCard =
    hasPaymentProfile && !paymentFailure && !isExtendToOffPlatformEnabled;

  const shouldShowInvoice =
    useAppStore((state) =>
      [AdAccountType.AD_ACCOUNT_TYPE_INTERNAL, AdAccountType.AD_ACCOUNT_TYPE_MANAGED].includes(
        state.advertiserState.data?.ad_account?.type ?? AdAccountType.AD_ACCOUNT_TYPE_SELF_SERVICE,
      ),
    ) || isExtendToOffPlatformEnabled;
  const flowType = useCampaignBuilderStore((state) => state.flowType);
  const editMode = flowType === FlowTypes.EDIT;
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );
  const durationOptions = useCampaignBuilderStore(
    (state) => state.recommendation?.duration_options_in_days || [],
  );
  const setPaymentMethodDrawerOpen = useCampaignBuilderStore(
    (state) => state.setPaymentMethodDrawerOpen,
  );
  const refreshAdCreditAndRobuxBalances = useAppStore(
    (state) => state.refreshAdCreditAndRobuxBalances,
  );
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const selectedGroupId = getSelectedGroupId(currentWorkspace, isAdAccountAutoCreateEnabled);
  const { isGroupSpendPermissionDenied, isLoading: groupSpendPermissionLoading } =
    useGroupSpendPermission(selectedGroupId);
  const groupAdvertiserState = useAppStore((state) =>
    selectedGroupId
      ? state.groupScopedAccountStateByGroupId[selectedGroupId]?.advertiserState
      : undefined,
  );
  const groupAdCreditState = useAppStore((state) =>
    selectedGroupId
      ? state.groupScopedAccountStateByGroupId[selectedGroupId]?.adCreditState
      : undefined,
  );
  const groupAdAccountId = groupAdvertiserState?.data?.ad_account?.id;
  const shouldShowGroupAdCredit = Boolean(selectedGroupId);
  const adCreditIsLoading = useAppStore((state) => state.adCreditState.isLoading);
  const groupAdCreditIsLoading = Boolean(
    selectedGroupId &&
    !isGroupSpendPermissionDenied &&
    groupAdAccountId &&
    (groupAdCreditState?.isLoading ?? true),
  );
  const paymentProfilesIsLoading = usePaymentStore((state) => state.paymentProfiles.isLoading);
  const adCreditIsError = useAppStore((state) => state.adCreditState.isError);
  const groupAdCreditIsError = Boolean(
    selectedGroupId &&
    !isGroupSpendPermissionDenied &&
    groupAdAccountId &&
    groupAdCreditState?.isError,
  );
  const paymentProfilesIsError = usePaymentStore((state) => state.paymentProfiles.isError);
  const rawGroupAdCreditBalance = groupAdCreditState?.data?.ad_credit_balance_in_micro || 0;
  const formattedGroupAdCreditBalance = MicroUsdToUsdStringRoundedDown(rawGroupAdCreditBalance);
  const getAdCredit = useAppStore((state) => state.getAdCredit);
  const getAdvertiser = useAppStore((state) => state.getAdvertiser);
  const getPaymentProfiles = usePaymentStore((state) => state.getPaymentProfiles);
  const [creditCardAdded, setCreditCardAdded] = useState<boolean>(false);
  PaymentMethodDrawerBroadcastChannel.setOnMessage(() => {
    getPaymentProfiles(true);
    setCreditCardAdded(true);
  });

  useEffect(() => {
    if (!selectedGroupId || isGroupSpendPermissionDenied) {
      return;
    }

    Promise.all([getAdvertiser(false, selectedGroupId), getAdCredit(selectedGroupId)]).catch(
      () => undefined,
    );
  }, [getAdCredit, getAdvertiser, isGroupSpendPermissionDenied, selectedGroupId]);

  useEffect(() => {
    if (!shouldShowInvoice && creditCardAdded && shouldShowCreditCard) {
      setValue(FormField.PAYMENT_TYPE, ServerPaymentType.PAYMENT_TYPE_CARD);
      setCreditCardAdded(false);
    }
  }, [shouldShowCreditCard, creditCardAdded, shouldShowInvoice, setValue]);

  useEffect(() => {
    if (
      shouldShowGroupAdCredit &&
      !isGroupSpendPermissionDenied &&
      groupAdAccountId &&
      !shouldShowInvoice &&
      !editMode &&
      getValues(FormField.PAYMENT_TYPE) === ServerPaymentType.PAYMENT_TYPE_UNSPECIFIED
    ) {
      setValue(FormField.PAYMENT_TYPE, ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT, {
        shouldValidate: true,
      });
    }
  }, [
    shouldShowGroupAdCredit,
    isGroupSpendPermissionDenied,
    groupAdAccountId,
    shouldShowInvoice,
    editMode,
    setValue,
    getValues,
  ]);

  useEffect(() => {
    // Only auto-select the card when it is actually selectable (i.e. not a
    // declined card). Gating on `shouldShowCreditCard` instead of bare
    // `hasPaymentProfile` prevents this effect from claiming the UNSPECIFIED
    // value with a hidden, declined card — which would both leave the dropdown
    // empty and block the ad-credit fallback effect below from running.
    // Group workspace ad credit takes priority over personal card when available.
    if (
      isAdAccountAutoCreateEnabled &&
      !shouldShowInvoice &&
      shouldShowCreditCard &&
      (!groupAdAccountId || isGroupSpendPermissionDenied) &&
      !editMode &&
      getValues(FormField.PAYMENT_TYPE) === ServerPaymentType.PAYMENT_TYPE_UNSPECIFIED
    ) {
      setValue(FormField.PAYMENT_TYPE, ServerPaymentType.PAYMENT_TYPE_CARD);
    }
  }, [
    isAdAccountAutoCreateEnabled,
    shouldShowCreditCard,
    shouldShowInvoice,
    groupAdAccountId,
    isGroupSpendPermissionDenied,
    setValue,
    editMode,
    getValues,
  ]);

  // Ad credit is the base payment method even before the account has a balance.
  useEffect(() => {
    if (
      !shouldShowInvoice &&
      !shouldShowCreditCard &&
      (!groupAdAccountId || isGroupSpendPermissionDenied) &&
      !editMode &&
      getValues(FormField.PAYMENT_TYPE) === ServerPaymentType.PAYMENT_TYPE_UNSPECIFIED
    ) {
      setValue(FormField.PAYMENT_TYPE, ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT, {
        shouldValidate: true,
      });
    }
  }, [
    editMode,
    groupAdAccountId,
    isGroupSpendPermissionDenied,
    shouldShowCreditCard,
    shouldShowInvoice,
    setValue,
    getValues,
  ]);

  useEffect(() => {
    if (
      !isGroupSpendPermissionDenied ||
      editMode ||
      getValues(FormField.PAYMENT_TYPE) !== ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT
    ) {
      return;
    }

    // Invoice-billed advertisers never see the ad credit options, so falling
    // back to ad credit there would select a value with no matching menu item.
    let fallbackPaymentType = ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT;
    if (shouldShowInvoice) {
      fallbackPaymentType = ServerPaymentType.PAYMENT_TYPE_INVOICE;
    } else if (shouldShowCreditCard) {
      fallbackPaymentType = ServerPaymentType.PAYMENT_TYPE_CARD;
    }

    setValue(FormField.PAYMENT_TYPE, fallbackPaymentType, { shouldValidate: true });
  }, [
    editMode,
    getValues,
    isGroupSpendPermissionDenied,
    setValue,
    shouldShowCreditCard,
    shouldShowInvoice,
  ]);

  const {
    classes: { inputHelperText, linkInHelperText },
  } = useCampaignBuilderCommonStyles();
  const {
    classes: { fullWidth, halfWidth, halfWidthSkeleton },
  } = useFormLayoutStyles();

  const shouldShowAdCredit = !shouldShowInvoice && !isExtendToOffPlatformEnabled;
  const shouldShowAddCreditCardAction = !shouldShowCreditCard && !shouldShowInvoice;

  const isGroupAdCreditSelected = paymentType === ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT;
  const activeAdCreditBalance = isGroupAdCreditSelected
    ? rawGroupAdCreditBalance
    : rawAdCreditBalance;

  const formattedActiveAdCreditBalance = MicroUsdToUsdStringRoundedDown(activeAdCreditBalance);

  const groupSectionName = currentWorkspace?.creatorName ?? '';
  const individualSectionName = currentUser?.name ?? currentUser?.displayName ?? '';

  const openAdCreditDrawer = (linkText: string) => {
    const { budget, duration } = getValues();
    refreshAdCreditAndRobuxBalances();
    if (isGroupAdCreditSelected && selectedGroupId) {
      getAdCredit(selectedGroupId).catch(() => undefined);
    }
    setPaymentMethodDrawerOpen(
      true,
      ADD_PAYMENT_TABS.ADS_CREDIT,
      isGroupAdCreditSelected ? AdCreditBalanceScope.Group : AdCreditBalanceScope.Personal,
    );
    logNativeClickEvent(EventName.TogglePaymentMethodDrawer, {
      adCreditBalance: formattedActiveAdCreditBalance.toString() || '',
      budgetUSD: budget?.toString() || '',
      durationUSD: duration?.toString() || '',
      linkText,
      neededSpend: '',
    });
  };

  const groupPaymentTypeSelects: PaymentTypeSelectOption[] = [
    {
      disabled: isGroupSpendPermissionDenied,
      shouldShow: shouldShowAdCredit && (shouldShowGroupAdCredit || isGroupAdCreditSelected),
      // Without spend permission the group balance is never fetched, so showing
      // the amount would render a misleading zero.
      title: isGroupSpendPermissionDenied
        ? translateCampaign('Label.GroupAdCredit')
        : translateCampaign('Label.GroupAdCreditBalance', {
            balance: formattedGroupAdCreditBalance,
          }),
      value: ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT,
    },
  ];

  const personalPaymentTypeSelects: PaymentTypeSelectOption[] = [
    {
      shouldShow: shouldShowInvoice,
      title: translateCampaign('Label.Invoice'),
      value: ServerPaymentType.PAYMENT_TYPE_INVOICE,
    },
    {
      shouldShow: shouldShowAdCredit,
      title: translateCampaign('Label.PersonalAdCreditBalance', {
        balance: formattedAdCreditBalance,
      }),
      value: ServerPaymentType.PAYMENT_TYPE_ADS_CREDIT,
    },
    {
      leading: <PaymentMethodIcon largeIcon={false} paymentMethodType={cardNetwork} smallIcon />,
      shouldShow: shouldShowCreditCard && !shouldShowInvoice,
      title: translateCampaign('Label.CardEnding', {
        expMonth: String(expMonth),
        expYear: String(expYear),
        lastFour: lastFourDigits,
      }),
      value: ServerPaymentType.PAYMENT_TYPE_CARD,
    },
  ];
  const visibleGroupPaymentTypeSelects = groupPaymentTypeSelects.filter(
    ({ shouldShow }) => shouldShow,
  );
  const visiblePersonalPaymentTypeSelects = personalPaymentTypeSelects.filter(
    ({ shouldShow }) => shouldShow,
  );
  const shouldShowSectionHeaders = visibleGroupPaymentTypeSelects.length > 0;
  const shouldShowPaymentGroupDivider =
    visibleGroupPaymentTypeSelects.length > 0 &&
    (visiblePersonalPaymentTypeSelects.length > 0 || shouldShowAddCreditCardAction);
  const visiblePaymentTypeSelectCount =
    visibleGroupPaymentTypeSelects.length + visiblePersonalPaymentTypeSelects.length;

  const renderPaymentTypeMenuItem = ({
    disabled,
    leading,
    title,
    value: val,
  }: PaymentTypeSelectOption): ReactNode => {
    const item = (
      <MenuItem disabled={disabled} key={val} leading={leading} title={title} value={String(val)} />
    );
    return disabled ? (
      <AppTooltip
        delayDurationMs={0}
        key={val}
        position='right-center'
        title={translateMisc('Description.GroupSpendPermissionDenied')}>
        <span className='block width-full'>{item}</span>
      </AppTooltip>
    ) : (
      item
    );
  };

  const openAddCreditCardDrawer = () => {
    refreshAdCreditAndRobuxBalances();
    setPaymentMethodDrawerOpen(true, ADD_PAYMENT_TABS.CREDIT_CARD);
    logNativeClickEvent(EventName.TogglePaymentMethodDrawer, {
      adCreditBalance: formattedAdCreditBalance.toString() || '',
      flowType,
      linkText: translateCampaign('Action.AddCreditCard'),
    });
  };

  const getTooltipTitle = () => {
    if (!shouldShowInvoice && (adCreditIsError || groupAdCreditIsError || paymentProfilesIsError)) {
      return translateCampaign('Description.FailedFetchPaymentMethod');
    }
    if (!editMode) {
      if (paymentFailure && adCreditActivated) {
        return translateCampaign('Description.CardDeclinedDefaultedAdCredit');
      }
      if (paymentFailure && !adCreditActivated) {
        return translateCampaign('Description.CardDeclined');
      }
      return '';
    }
    const editTooltipKey = GetEditTooltipTitle({
      campaignStatus,
      editable: false,
      flowType,
    });
    return editTooltipKey ? translateCampaign(editTooltipKey) : '';
  };

  const getErrorHelperEl = (error: ZodFormIssue | undefined) => {
    let suffixForAdCreditTopUp = null;
    const { budget, budgetType, duration, paymentType: selectedPaymentType } = getValues();
    let neededSpend;
    if (budgetType === ServerBudgetType.BUDGET_TYPE_LIFETIME) {
      neededSpend = budget;
    } else {
      neededSpend = budget && duration !== CONTINUOUS_VALUE ? budget * duration : 0;
    }
    let helperText = error?.message || '';
    let helperSeverity: 'error' | 'warning' = 'error';

    const adCreditsNeededForFullDuration = neededSpend * 1e6 - activeAdCreditBalance;
    const formattedAdCreditsNeededForFullDuration = MicroUsdToUsdStringRoundedUp(
      adCreditsNeededForFullDuration,
    );

    const linkText =
      error?.message === NO_PAYMENT_METHOD_COPY
        ? translateCampaign('Action.AddPaymentMethod')
        : translateBilling('Description.PurchaseAdCredits');

    const paymentDrawerLink = (
      <>
        {' '}
        <span
          className={`text-body-medium ${linkInHelperText}`}
          data-testid='payment-method-drawer-link'
          onClick={() => {
            openAdCreditDrawer(linkText);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openAdCreditDrawer(linkText);
            }
          }}
          role='button'
          tabIndex={0}>
          {linkText}
        </span>
      </>
    );

    if (
      (error?.type === 'too_small' && error?.message !== FAILED_TO_FETCH_PAYMENT_METHOD_COPY) ||
      (error?.type === 'custom' && error?.message === NO_PAYMENT_METHOD_COPY)
    ) {
      suffixForAdCreditTopUp = paymentDrawerLink;
    } else if (
      !error &&
      !editMode &&
      isAdCreditPaymentType(selectedPaymentType) &&
      !isAutoReloadEnabled &&
      adCreditsNeededForFullDuration > 0
    ) {
      helperText = translateCampaign('Description.AdCreditNeededFull', {
        amount: formattedAdCreditsNeededForFullDuration,
      });
      helperSeverity = 'warning';
      suffixForAdCreditTopUp = paymentDrawerLink;
    }

    return (
      <div className={inputHelperText}>
        <span
          className={`text-body-medium ${helperSeverity === 'warning' ? 'content-system-warning' : 'content-system-alert'}`}>
          {helperText}
          {suffixForAdCreditTopUp}
        </span>
      </div>
    );
  };

  if (
    adCreditIsLoading ||
    groupAdCreditIsLoading ||
    groupSpendPermissionLoading ||
    paymentProfilesIsLoading
  ) {
    return <Skeleton className={halfWidthSkeleton} variant='rectangular' />;
  }

  return (
    <Controller
      control={control}
      name={FormField.PAYMENT_TYPE}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <AppTooltip title={getTooltipTitle()}>
          <div className={halfWidth}>
            <div data-testid='payment-select'>
              <Dropdown
                className={fullWidth}
                hasError={!!error}
                isDisabled={
                  editMode ||
                  (!shouldShowAddCreditCardAction && visiblePaymentTypeSelectCount === 1)
                }
                label={translateBilling('Heading.PaymentMethod')}
                onOpenChange={(isOpen) => {
                  if (!isOpen) {
                    return;
                  }
                  logNativeClickEvent(EventName.CreateCampaignPaymentMethodDropdownOpened, {
                    flowType,
                  });
                }}
                onValueChange={(nextValue: string) => {
                  if (nextValue === ADD_CREDIT_CARD_OPTION_VALUE) {
                    openAddCreditCardDrawer();
                    return;
                  }

                  const newPaymentType = parseInt(nextValue, 10);
                  if (
                    newPaymentType === ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT &&
                    !isGroupSpendPermissionDenied &&
                    selectedGroupId &&
                    !groupAdAccountId
                  ) {
                    openGroupAdAccountSetupDialog({
                      entryPoint: 'campaignPaymentSelect',
                      groupId: selectedGroupId,
                      groupName: currentWorkspace?.creatorName ?? '',
                      onComplete: () => {
                        setValue(
                          FormField.PAYMENT_TYPE,
                          ServerPaymentType.PAYMENT_TYPE_GROUP_AD_CREDIT,
                          {
                            shouldValidate: true,
                          },
                        );
                        setPaymentMethodDrawerOpen(
                          true,
                          ADD_PAYMENT_TABS.ADS_CREDIT,
                          AdCreditBalanceScope.Group,
                        );
                      },
                    });
                    return;
                  }

                  onChange(newPaymentType);
                  logNativeClickEvent(EventName.PaymentMethodChanged, {
                    flowType,
                    previousValue: value !== null ? value.toString() : '',
                    value: nextValue,
                  });
                  const recommendedDuration =
                    durationOptions.find(({ is_recommended }) => is_recommended)?.value ||
                    DefaultDuration;

                  // reset duration to recommended if changing to ad credit and duration is continuous
                  if (
                    getValues(FormField.DURATION) === CONTINUOUS_VALUE &&
                    isAdCreditPaymentType(newPaymentType as ServerPaymentType)
                  ) {
                    setValue(FormField.DURATION, recommendedDuration);
                    setValue(FormField.CUSTOM_DURATION, false);
                  }
                }}
                placeholder=''
                size='Medium'
                value={value === undefined || value === null ? '' : String(value)}>
                <Menu>
                  {/* MenuSection only accepts a single element or a flat array of
                      them, so each section wraps its heading + items in a fragment. */}
                  {visibleGroupPaymentTypeSelects.length > 0 && (
                    <MenuSection>
                      <>
                        {shouldShowSectionHeaders && <MenuLabel title={groupSectionName} />}
                        {visibleGroupPaymentTypeSelects.map(renderPaymentTypeMenuItem)}
                      </>
                    </MenuSection>
                  )}
                  {shouldShowPaymentGroupDivider && <MenuSeparator />}
                  <MenuSection>
                    <>
                      {shouldShowSectionHeaders &&
                        (visiblePersonalPaymentTypeSelects.length > 0 ||
                          shouldShowAddCreditCardAction) && (
                          <MenuLabel title={individualSectionName} />
                        )}
                      {visiblePersonalPaymentTypeSelects.map(renderPaymentTypeMenuItem)}
                      {shouldShowAddCreditCardAction && (
                        <MenuItem
                          leading={<Icon name='icon-regular-plus-large' size='Small' />}
                          title={translateCampaign('Action.AddCreditCard')}
                          value={ADD_CREDIT_CARD_OPTION_VALUE}
                        />
                      )}
                    </>
                  </MenuSection>
                </Menu>
              </Dropdown>
            </div>
            {getErrorHelperEl(error as ZodFormIssue)}
          </div>
        </AppTooltip>
      )}
    />
  );
};

export default PaymentSelect;
