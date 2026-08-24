import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  Divider,
  Dropdown,
  Icon,
  Menu,
  MenuItem,
  TextInput,
} from '@rbx/foundation-ui';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Controller, useForm } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { z } from 'zod';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import useAddPaymentMethodStyles from '@components/billing/AddPaymentMethod.styles';
import { openBuyAdCreditSuccessDialog } from '@components/billing/dialogs/BuyAdCreditSuccessDialog';
import AppTooltip from '@components/common/AppTooltip';
import { openImpersonationErrorDialog } from '@components/common/dialog/impersonationErrorDialog';
import { AdCreditBalanceScope } from '@constants/billing';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { purchaseAdCredit } from '@services/ads/paymentService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useToastStore } from '@stores/toastStoreProvider';
import { PURCHASE_RESPONSE_CODE_ENUM } from '@type/payment';
import { MicroUsdToUsdStringRoundedDown, UsdToMicroUsd } from '@utils/currency';
import { CaptureException, IsImpersonationError } from '@utils/error';
import { GetUrlWithParams } from '@utils/url';

export enum BuyAdCreditEnum {
  SUCCESS = 'BUY_AD_CREDIT_SUCCESS',
  SUCCESS_AND_FIRST_PAYMENT_METHOD = 'BUY_AD_CREDIT_SUCCESS_AND_FIRST_PAYMENT_METHOD',
}

export interface PaymentSetupCompletion {
  accountScope: 'group' | 'user';
  groupId?: number;
  paymentMethodType: 'adCredit' | 'card' | 'groupAdCredit';
}

export interface BuyAdCreditProps {
  actionsContainer?: HTMLElement | null;
  adCreditBalance: number;
  controlledBalanceScope?: AdCreditBalanceScope;
  groupAdCreditBalance?: number;
  groupId?: number;
  groupName?: string;
  groupRobuxBalance?: number;
  initialBalanceScope?: AdCreditBalanceScope;
  isGroupSpendPermissionDenied?: boolean;
  onBalanceScopeChange?: (balanceScope: AdCreditBalanceScope) => void;
  onCancel?: () => void;
  onComplete?: (completion: PaymentSetupCompletion) => void | Promise<void>;
  onPurchaseStateChange?: (isPurchasing: boolean) => void;
  robuxBalance: number;
  showBalanceScopeSelector?: boolean;
  showGroupBalanceOption?: boolean;
}

const AD_CREDIT_AMOUNT_FORM_FIELD = 'adCreditAmount';

interface FormValues {
  [AD_CREDIT_AMOUNT_FORM_FIELD]: number;
}

const resolveInitialBalanceScope = (
  showGroupBalanceOption: boolean,
  initialBalanceScope?: AdCreditBalanceScope,
): AdCreditBalanceScope => {
  if (initialBalanceScope === AdCreditBalanceScope.Group && showGroupBalanceOption) {
    return AdCreditBalanceScope.Group;
  }
  if (initialBalanceScope === AdCreditBalanceScope.Personal) {
    return AdCreditBalanceScope.Personal;
  }
  return showGroupBalanceOption ? AdCreditBalanceScope.Group : AdCreditBalanceScope.Personal;
};

export const BuyAdCredit = ({
  actionsContainer,
  adCreditBalance,
  controlledBalanceScope,
  groupAdCreditBalance = 0,
  groupId,
  groupName,
  groupRobuxBalance = 0,
  initialBalanceScope,
  isGroupSpendPermissionDenied = false,
  onBalanceScopeChange,
  onCancel,
  onComplete,
  onPurchaseStateChange,
  robuxBalance,
  showBalanceScopeSelector = true,
  showGroupBalanceOption = false,
}: BuyAdCreditProps): ReactElement => {
  const { translate: translateBilling, translateHTML: translateBillingHTML } =
    useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const updatePurchaseState = (nextIsPurchasing: boolean): void => {
    setIsPurchasing(nextIsPurchasing);
    onPurchaseStateChange?.(nextIsPurchasing);
  };
  const canUseGroupBalance = showGroupBalanceOption && !isGroupSpendPermissionDenied;
  const [internalBalanceScope, setInternalBalanceScope] = useState<AdCreditBalanceScope>(() =>
    resolveInitialBalanceScope(canUseGroupBalance, initialBalanceScope),
  );
  const balanceScope = controlledBalanceScope ?? internalBalanceScope;
  const userSelectedBalanceScope = useRef<AdCreditBalanceScope | undefined>(undefined);
  const previousInitialBalanceScope = useRef<AdCreditBalanceScope | undefined>(initialBalanceScope);
  const { setShowPurchaseAdCreditError } = useToastStore();

  useEffect(() => {
    if (controlledBalanceScope !== undefined) {
      return;
    }

    const initialBalanceScopeChanged = previousInitialBalanceScope.current !== initialBalanceScope;
    previousInitialBalanceScope.current = initialBalanceScope;
    if (initialBalanceScopeChanged) {
      userSelectedBalanceScope.current = undefined;
    }

    setInternalBalanceScope((currentBalanceScope) => {
      if (initialBalanceScopeChanged) {
        return resolveInitialBalanceScope(canUseGroupBalance, initialBalanceScope);
      }
      if (!canUseGroupBalance) {
        return currentBalanceScope === AdCreditBalanceScope.Group
          ? AdCreditBalanceScope.Personal
          : currentBalanceScope;
      }
      if (userSelectedBalanceScope.current) {
        return userSelectedBalanceScope.current;
      }
      return resolveInitialBalanceScope(canUseGroupBalance, initialBalanceScope);
    });
  }, [canUseGroupBalance, controlledBalanceScope, initialBalanceScope]);

  const {
    adCreditActivated,
    adCreditFromRobuxPurchaseRate,
    adCreditMaximumPurchaseAmount,
    adCreditMinimumPurchaseAmount,
    paymentProfiles,
  } = useAppStore((state: AppStoreType) => state.appData);
  const minAdCreditError = translateBilling('Validation.MinimumAdCredit', {
    minAmount: adCreditMinimumPurchaseAmount.toLocaleString(),
  });
  const maxAdCreditError = translateBilling('Validation.MaximumAdCredit', {
    maxAmount: adCreditMaximumPurchaseAmount.toLocaleString(),
  });

  const hasVerifiedPaymentProfiles = paymentProfiles.some(
    (paymentProfile) => paymentProfile?.is_verified,
  );

  const {
    classes: {
      adCreditPurchaseBorderBulbBottom,
      adCreditPurchaseBorderBulbTop,
      adCreditPurchaseContainer,
      balanceCard,
      balanceContainerSection,
      balanceContainerSectionItem,
      balanceInfoRow,
      balanceInfoRows,
      balanceScopeSelector,
      balanceScopeSelectorContainer,
      balanceTypography,
      buyAdCreditRow,
      buyButton,
      buyButtonRow,
      cancelButton,
      costInRobuxAmount,
      costInRobuxContainer,
      costInRobuxDescription,
      costInRobuxRow,
      disclaimerHeader,
      disclaimerHeaderContainer,
      disclaimerRow,
      disclaimerText,
      divider,
      fullWidth,
      needMoreRobuxDescription,
      purchaseRateRow,
      robuxBalanceContainer,
      smallRobuxIcon,
      subtitleContainer,
    },
    cx,
  } = useAddPaymentMethodStyles();

  const validationSchema = z.object({
    [AD_CREDIT_AMOUNT_FORM_FIELD]: z
      .int(minAdCreditError)
      .min(adCreditMinimumPurchaseAmount, minAdCreditError)
      .max(adCreditMaximumPurchaseAmount, maxAdCreditError),
  });

  const {
    control,
    formState: { errors, isDirty, isValid },
    handleSubmit,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      [AD_CREDIT_AMOUNT_FORM_FIELD]: 0,
    },
    mode: 'onChange',
    resolver: zodResolver(validationSchema),
  });

  const adCreditAmount = watch(AD_CREDIT_AMOUNT_FORM_FIELD);
  const selectedAdCreditBalance =
    balanceScope === AdCreditBalanceScope.Group ? groupAdCreditBalance : adCreditBalance;
  const selectedRobuxBalance =
    balanceScope === AdCreditBalanceScope.Group ? groupRobuxBalance : robuxBalance;
  const selectedGroupId = balanceScope === AdCreditBalanceScope.Group ? groupId : undefined;
  const paymentSetupCompletion: PaymentSetupCompletion =
    selectedGroupId !== undefined
      ? {
          accountScope: 'group',
          groupId: selectedGroupId,
          paymentMethodType: 'groupAdCredit',
        }
      : {
          accountScope: 'user',
          paymentMethodType: 'adCredit',
        };
  const costInRobux = () => adCreditAmount * adCreditFromRobuxPurchaseRate;
  const calculateRemainingRobuxBalance = () => selectedRobuxBalance - costInRobux();

  const navigateToPaymentSettingsPage = (state?: BuyAdCreditEnum) => {
    // Do hard refresh (instead of using the next router) to make sure most up to date data is displayed
    if (state === BuyAdCreditEnum.SUCCESS && !hasVerifiedPaymentProfiles && !adCreditActivated) {
      window.location.href = GetUrlWithParams(
        `${process.env.siteBasePath}${Routes.PAYMENT_SETTINGS}`,
        {
          state: BuyAdCreditEnum.SUCCESS_AND_FIRST_PAYMENT_METHOD,
        },
      );
    } else {
      window.location.href = GetUrlWithParams(
        `${process.env.siteBasePath}${Routes.PAYMENT_SETTINGS}`,
        {
          state,
        },
      );
    }
  };

  const handleBuy = async (data: FormValues, showSuccessDialog = false): Promise<void> => {
    if (isPurchasing) {
      return;
    }
    updatePurchaseState(true);
    logNativeClickEvent(EventName.BuyAdCreditAttempted, {});
    try {
      const { purchaseStatus } = await purchaseAdCredit(
        UsdToMicroUsd(data[AD_CREDIT_AMOUNT_FORM_FIELD]),
        selectedGroupId,
      );
      if (
        purchaseStatus ===
          PURCHASE_RESPONSE_CODE_ENUM.AdCreditPurchaseStatus_AD_CREDIT_PURCHASE_STATUS_SUCCESS ||
        purchaseStatus ===
          PURCHASE_RESPONSE_CODE_ENUM.AdCreditPurchaseStatus_AD_CREDIT_PURCHASE_STATUS_GRANT_PENDING
      ) {
        logNativeClickEvent(EventName.BuyAdCreditSuccess, {
          adCreditActivated: adCreditActivated.toString(),
          adCreditAmount: data[AD_CREDIT_AMOUNT_FORM_FIELD].toString(),
        });
        if (onComplete) {
          if (showSuccessDialog) {
            openBuyAdCreditSuccessDialog(
              data[AD_CREDIT_AMOUNT_FORM_FIELD].toLocaleString(),
              costInRobux().toLocaleString(),
              async () => {
                await onComplete(paymentSetupCompletion);
              },
            );
          } else {
            await onComplete(paymentSetupCompletion);
          }
        } else {
          navigateToPaymentSettingsPage(BuyAdCreditEnum.SUCCESS);
        }
      } else {
        throw new Error('PURCHASE_FAILED');
      }
    } catch (error: unknown) {
      let errorMessage = '';

      if (IsImpersonationError(error)) {
        errorMessage = 'Impersonation Error';
        openImpersonationErrorDialog();
      } else if (error && (error as Error).message) {
        errorMessage = (error as Error).message;
        setShowPurchaseAdCreditError(true);
        CaptureException(error as Error);
      }

      logNativeImpressionEvent(EventName.BuyAdCreditFailed, { errorMessage });
    } finally {
      updatePurchaseState(false);
    }
  };

  const disableSubmitButton = (): boolean => {
    if (isPurchasing || !isDirty || !isValid) {
      return true;
    }
    return calculateRemainingRobuxBalance() < 0;
  };

  const subtitle = (
    <div className={subtitleContainer}>
      <span className='text-heading-small'>
        {translateBilling('Heading.ConvertRobuxToAdCredit')}
      </span>
    </div>
  );

  const balanceScopeSelectorComponent =
    showGroupBalanceOption && showBalanceScopeSelector ? (
      <div className={balanceScopeSelectorContainer}>
        <Dropdown
          className={balanceScopeSelector}
          isDisabled={isPurchasing}
          label={translateBilling('Label.BalanceScope')}
          onValueChange={(value) => {
            const selectedBalanceScope = value as AdCreditBalanceScope;
            if (
              isPurchasing ||
              (selectedBalanceScope === AdCreditBalanceScope.Group && isGroupSpendPermissionDenied)
            ) {
              return;
            }
            userSelectedBalanceScope.current = selectedBalanceScope;
            onBalanceScopeChange?.(selectedBalanceScope);
            if (onBalanceScopeChange == null) {
              setInternalBalanceScope(selectedBalanceScope);
            }
          }}
          placeholder={translateBilling('Label.BalanceScope')}
          size='Medium'
          value={balanceScope}>
          <Menu>
            {isGroupSpendPermissionDenied ? (
              <AppTooltip
                delayDurationMs={0}
                position='right-center'
                title={translateMisc('Description.GroupSpendPermissionDenied')}>
                <span className='block width-full'>
                  <MenuItem
                    disabled
                    title={groupName || translateBilling('Label.RobloxAdCredit')}
                    value={AdCreditBalanceScope.Group}
                  />
                </span>
              </AppTooltip>
            ) : (
              <MenuItem
                title={groupName || translateBilling('Label.RobloxAdCredit')}
                value={AdCreditBalanceScope.Group}
              />
            )}
            <MenuItem
              title={translateBilling('Heading.PersonalFunds')}
              value={AdCreditBalanceScope.Personal}
            />
          </Menu>
        </Dropdown>
      </div>
    ) : null;

  const purchaseRate = (
    <span
      className={`text-body-large content-default ${purchaseRateRow}`}
      data-testid='purchaseRateRow'>
      {translateBillingHTML('Label.PurchaseRate', null, {
        rate: String(adCreditFromRobuxPurchaseRate),
        robuxIcon: <Icon className={smallRobuxIcon} name='icon-filled-robux' size='Small' />,
      })}
    </span>
  );

  const balanceContainer = (
    <Card className={balanceCard} density='Default' variant='Emphasis'>
      <div>
        <span className='text-title-large'>{translateBilling('Heading.CurrentBalance')}</span>
      </div>
      <div className={balanceInfoRows} data-testid='balance-info-rows'>
        <div className={balanceInfoRow}>
          <span className={`text-body-large content-default min-width-[72px] ${balanceTypography}`}>
            {translateBilling('Label.AdCredit')}
          </span>
          <span className='text-body-large'>
            {MicroUsdToUsdStringRoundedDown(selectedAdCreditBalance)}
          </span>
        </div>
        <div className={balanceInfoRow}>
          <span className={`text-body-large content-default min-width-[72px] ${balanceTypography}`}>
            {translateBilling('Label.Robux')}
          </span>
          <div className={robuxBalanceContainer}>
            <Icon
              className={cx(
                smallRobuxIcon,
                calculateRemainingRobuxBalance() < 0 && 'content-system-alert',
              )}
              name='icon-filled-robux'
              size='Small'
            />
            <span
              className={`text-body-large ${calculateRemainingRobuxBalance() < 0 ? 'content-system-alert' : 'content-emphasis'}`}>
              {selectedRobuxBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      {calculateRemainingRobuxBalance() < 0 && (
        <span
          className={`text-body-large content-system-alert ${needMoreRobuxDescription}`}
          data-testid='needMoreRobuxDescription'>
          {translateBilling('Message.NeedMoreRobux', {
            robuxNeeded: (0 - calculateRemainingRobuxBalance()).toLocaleString(),
          })}
        </span>
      )}
    </Card>
  );

  const maybeRenderDivider = () => <Divider className={divider} />;

  const disclaimer = (
    <>
      {maybeRenderDivider()}
      <div className={disclaimerRow}>
        <div className={disclaimerHeaderContainer}>
          <span className={`text-body-large ${disclaimerHeader} ${disclaimerText}`}>
            {translateBilling('Description.PurchaseAdCreditDisclaimerHeader')}
          </span>
        </div>
        <div>
          <span className={`text-body-large content-default ${disclaimerText}`}>
            {translateBilling('Description.PurchaseAdCreditDisclaimerContent')}
          </span>
        </div>
      </div>
    </>
  );

  const form = (
    <div className={adCreditPurchaseContainer} data-testid='adCreditPurchaseContainer'>
      <div className={buyAdCreditRow} data-testid='buyAdCreditRow'>
        <div>
          <Controller
            control={control}
            name={AD_CREDIT_AMOUNT_FORM_FIELD}
            render={({ field: { onChange, value, ...field } }) => (
              <NumericFormat
                {...field}
                allowNegative={false}
                className={fullWidth}
                customInput={TextInput}
                data-testid={AD_CREDIT_AMOUNT_FORM_FIELD}
                decimalScale={0}
                error={errors[AD_CREDIT_AMOUNT_FORM_FIELD]?.message}
                helperText={minAdCreditError}
                id={AD_CREDIT_AMOUNT_FORM_FIELD}
                isAllowed={({ floatValue }) => {
                  if (floatValue === undefined) {
                    return true;
                  }
                  return floatValue >= 0 && floatValue <= adCreditMaximumPurchaseAmount;
                }}
                label={translateBilling('Title.AdCreditAmount')}
                onValueChange={({ floatValue = NaN }) => {
                  onChange(floatValue);
                }}
                size='Medium'
              />
            )}
          />
        </div>
      </div>
      <div className={costInRobuxRow} data-testid='costInRobuxRow'>
        <div className={costInRobuxContainer}>
          <span className={`text-body-large content-default ${costInRobuxDescription}`}>
            {translateBilling('Label.CostInRobux')}
          </span>
        </div>
        <div className={robuxBalanceContainer}>
          <Icon
            className={cx(
              smallRobuxIcon,
              calculateRemainingRobuxBalance() < 0 && 'content-system-alert',
            )}
            name='icon-filled-robux'
            size='Small'
          />
          <span
            className={`text-body-large ${calculateRemainingRobuxBalance() < 0 ? 'content-system-alert' : 'content-inherit'} ${costInRobuxAmount}`}>
            {errors[AD_CREDIT_AMOUNT_FORM_FIELD]
              ? UNAVAILABLE_VALUE_DISPLAY
              : costInRobux().toLocaleString()}
          </span>
        </div>
      </div>
      <div className={adCreditPurchaseBorderBulbTop} />
      <div className={adCreditPurchaseBorderBulbBottom} />
    </div>
  );

  const balanceContainerSectionComponent = showGroupBalanceOption ? (
    <div className={balanceContainerSection}>
      <div className={balanceContainerSectionItem}>
        {subtitle}
        {purchaseRate}
        {form}
      </div>
      <div className={balanceContainerSectionItem}>
        {balanceScopeSelectorComponent}
        {balanceContainer}
      </div>
    </div>
  ) : (
    <>
      {subtitle}
      {purchaseRate}
      <div className={balanceContainerSection}>
        <div className={balanceContainerSectionItem}>{form}</div>
        <div className={balanceContainerSectionItem}>{balanceContainer}</div>
      </div>
    </>
  );
  const buttons = (
    <div className={buyButtonRow}>
      <Button
        className={buyButton}
        data-testid='buyButton'
        isDisabled={disableSubmitButton()}
        isLoading={isPurchasing}
        onClick={handleSubmit((data) => handleBuy(data, true))}
        size='Medium'
        variant='Emphasis'>
        {translateBilling('Action.Buy')}
      </Button>
      <Button
        className={cancelButton}
        onClick={() => {
          if (onCancel) {
            onCancel();
            return;
          }
          navigateToPaymentSettingsPage();
        }}
        size='Medium'
        variant='Standard'>
        {translateMisc('Action.Cancel')}
      </Button>
    </div>
  );

  const footer = actionsContainer
    ? createPortal(
        <>
          <Button
            className='grow'
            data-testid='buyButton'
            isDisabled={disableSubmitButton()}
            isLoading={isPurchasing}
            onClick={handleSubmit((data) => handleBuy(data, true))}
            size='Medium'
            variant='Emphasis'>
            {translateBilling('Action.Buy')}
          </Button>
          <Button
            className='grow'
            onClick={() => {
              if (onCancel) {
                onCancel();
                return;
              }
              navigateToPaymentSettingsPage();
            }}
            size='Medium'
            variant='Standard'>
            {translateMisc('Action.Cancel')}
          </Button>
        </>,
        actionsContainer,
      )
    : buttons;
  return (
    <div>
      <div>
        {balanceContainerSectionComponent}
        <div>{disclaimer}</div>
      </div>
      {footer}
    </div>
  );
};
