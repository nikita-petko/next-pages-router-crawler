import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Divider, Dropdown, Icon, Menu, MenuItem } from '@rbx/foundation-ui';
import { Card, TextField, Typography } from '@rbx/ui';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Controller, useForm } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';
import { z } from 'zod';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import useAddPaymentMethodStyles from '@components/billing/AddPaymentMethod.styles';
import { openBuyAdCreditSuccessDialog } from '@components/billing/dialogs/BuyAdCreditSuccessDialog';
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
  groupAdCreditBalance?: number;
  groupId?: number;
  groupName?: string;
  groupRobuxBalance?: number;
  initialBalanceScope?: AdCreditBalanceScope;
  onCancel?: () => void;
  onComplete?: (completion: PaymentSetupCompletion) => void | Promise<void>;
  robuxBalance: number;
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
  groupAdCreditBalance = 0,
  groupId,
  groupName,
  groupRobuxBalance = 0,
  initialBalanceScope,
  onCancel,
  onComplete,
  robuxBalance,
  showGroupBalanceOption = false,
}: BuyAdCreditProps): ReactElement => {
  const { translate: translateBilling, translateHTML: translateBillingHTML } =
    useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [balanceScope, setBalanceScope] = useState<AdCreditBalanceScope>(() =>
    resolveInitialBalanceScope(showGroupBalanceOption, initialBalanceScope),
  );
  const userSelectedBalanceScope = useRef<AdCreditBalanceScope | undefined>(undefined);
  const previousInitialBalanceScope = useRef<AdCreditBalanceScope | undefined>(initialBalanceScope);
  const { setShowPurchaseAdCreditError } = useToastStore();

  useEffect(() => {
    const initialBalanceScopeChanged = previousInitialBalanceScope.current !== initialBalanceScope;
    previousInitialBalanceScope.current = initialBalanceScope;
    if (initialBalanceScopeChanged) {
      userSelectedBalanceScope.current = undefined;
    }

    setBalanceScope((currentBalanceScope) => {
      if (initialBalanceScopeChanged) {
        return resolveInitialBalanceScope(showGroupBalanceOption, initialBalanceScope);
      }
      if (!showGroupBalanceOption) {
        return currentBalanceScope === AdCreditBalanceScope.Group
          ? AdCreditBalanceScope.Personal
          : currentBalanceScope;
      }
      if (userSelectedBalanceScope.current) {
        return userSelectedBalanceScope.current;
      }
      return resolveInitialBalanceScope(showGroupBalanceOption, initialBalanceScope);
    });
  }, [initialBalanceScope, showGroupBalanceOption]);

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
    setIsPurchasing(true);
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
            setIsPurchasing(false);
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
      setIsPurchasing(false);
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
      <Typography variant='h5'>{translateBilling('Heading.ConvertRobuxToAdCredit')}</Typography>
    </div>
  );

  const balanceScopeSelectorComponent = showGroupBalanceOption ? (
    <div className={balanceScopeSelectorContainer}>
      <Dropdown
        className={balanceScopeSelector}
        label={translateBilling('Label.BalanceScope')}
        onValueChange={(value) => {
          const selectedBalanceScope = value as AdCreditBalanceScope;
          userSelectedBalanceScope.current = selectedBalanceScope;
          setBalanceScope(selectedBalanceScope);
        }}
        placeholder={translateBilling('Label.BalanceScope')}
        size='Medium'
        value={balanceScope}>
        <Menu>
          <MenuItem
            title={groupName || translateBilling('Label.RobloxAdCredit')}
            value={AdCreditBalanceScope.Group}
          />
          <MenuItem
            title={translateBilling('Heading.PersonalFunds')}
            value={AdCreditBalanceScope.Personal}
          />
        </Menu>
      </Dropdown>
    </div>
  ) : null;

  const purchaseRate = (
    <Typography
      className={purchaseRateRow}
      color='secondary'
      data-testid='purchaseRateRow'
      variant='body1'>
      {translateBillingHTML('Label.PurchaseRate', null, {
        rate: String(adCreditFromRobuxPurchaseRate),
        robuxIcon: <Icon className={smallRobuxIcon} name='icon-filled-robux' size='Small' />,
      })}
    </Typography>
  );

  const balanceContainer = (
    <Card className={balanceCard}>
      <div>
        <Typography variant='h6'>{translateBilling('Heading.CurrentBalance')}</Typography>
      </div>
      <div className={balanceInfoRow}>
        <Typography className={balanceTypography} color='secondary' variant='body1'>
          {translateBilling('Label.AdCredit')}
        </Typography>
        <Typography variant='body1'>
          {MicroUsdToUsdStringRoundedDown(selectedAdCreditBalance)}
        </Typography>
      </div>
      <div className={balanceInfoRow}>
        <Typography className={balanceTypography} color='secondary' variant='body1'>
          {translateBilling('Label.Robux')}
        </Typography>
        <div className={robuxBalanceContainer}>
          <Icon
            className={cx(
              smallRobuxIcon,
              calculateRemainingRobuxBalance() < 0 && 'content-system-alert',
            )}
            name='icon-filled-robux'
            size='Small'
          />
          <Typography
            color={calculateRemainingRobuxBalance() < 0 ? 'error' : 'primary'}
            variant='body1'>
            {selectedRobuxBalance.toLocaleString()}
          </Typography>
        </div>
      </div>
      {calculateRemainingRobuxBalance() < 0 && (
        <Typography
          className={needMoreRobuxDescription}
          color='error'
          data-testid='needMoreRobuxDescription'>
          {translateBilling('Message.NeedMoreRobux', {
            robuxNeeded: (0 - calculateRemainingRobuxBalance()).toLocaleString(),
          })}
        </Typography>
      )}
    </Card>
  );

  const maybeRenderDivider = () => <Divider className={divider} />;

  const disclaimer = (
    <>
      {maybeRenderDivider()}
      <div className={disclaimerRow}>
        <div className={disclaimerHeaderContainer}>
          <Typography className={disclaimerHeader} variant='body1'>
            {translateBilling('Description.PurchaseAdCreditDisclaimerHeader')}
          </Typography>
        </div>
        <div>
          <Typography color='secondary' variant='body1'>
            {translateBilling('Description.PurchaseAdCreditDisclaimerContent')}
          </Typography>
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
                color='primary'
                customInput={TextField}
                decimalScale={0}
                error={!!errors[AD_CREDIT_AMOUNT_FORM_FIELD]}
                helperText={errors[AD_CREDIT_AMOUNT_FORM_FIELD]?.message || minAdCreditError}
                id={AD_CREDIT_AMOUNT_FORM_FIELD}
                inputProps={{ 'data-testid': AD_CREDIT_AMOUNT_FORM_FIELD }}
                isAllowed={({ floatValue }) => {
                  if (floatValue === undefined) {
                    return true;
                  }
                  return floatValue >= 0 && floatValue <= adCreditMaximumPurchaseAmount;
                }}
                label={translateBilling('Title.AdCreditAmount')}
                margin='none'
                onValueChange={({ floatValue = NaN }) => {
                  onChange(floatValue);
                }}
                variant='outlined'
              />
            )}
          />
        </div>
      </div>
      <div className={costInRobuxRow} data-testid='costInRobuxRow'>
        <div className={costInRobuxContainer}>
          <Typography className={costInRobuxDescription} color='secondary' variant='body1'>
            {translateBilling('Label.CostInRobux')}
          </Typography>
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
          <Typography
            className={costInRobuxAmount}
            color={calculateRemainingRobuxBalance() < 0 ? 'error' : 'inherit'}
            variant='body1'>
            {errors[AD_CREDIT_AMOUNT_FORM_FIELD]
              ? UNAVAILABLE_VALUE_DISPLAY
              : costInRobux().toLocaleString()}
          </Typography>
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

  const externalFooter = actionsContainer
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
    : null;
  const defaultFooter = actionsContainer ? null : <>{buttons}</>;
  return (
    <div>
      <div>
        {balanceContainerSectionComponent}
        <div>{disclaimer}</div>
      </div>
      {externalFooter}
      {!actionsContainer && defaultFooter}
    </div>
  );
};
