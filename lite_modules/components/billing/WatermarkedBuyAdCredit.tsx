import {
  Button,
  Divider,
  Dropdown,
  Icon,
  Link,
  Menu,
  MenuItem,
  TextInput,
} from '@rbx/foundation-ui';
import { useQuery } from '@tanstack/react-query';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { NumericFormat } from 'react-number-format';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import useAddPaymentMethodStyles from '@components/billing/AddPaymentMethod.styles';
import { BuyAdCreditEnum } from '@components/billing/BuyAdCredit';
import type { BuyAdCreditProps, PaymentSetupCompletion } from '@components/billing/BuyAdCredit';
import { openBuyAdCreditSuccessDialog } from '@components/billing/dialogs/BuyAdCreditSuccessDialog';
import AppTooltip from '@components/common/AppTooltip';
import { openImpersonationErrorDialog } from '@components/common/dialog/impersonationErrorDialog';
import FieldLabelOffset from '@components/common/form/FieldLabelOffset';
import Skeleton from '@components/common/Skeleton';
import { AdCreditBalanceScope, AdCreditConversionLearnMoreUrl } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import {
  AdCreditQuoteSourceField as AdCreditQuoteSourceFieldValues,
  AdCreditQuoteTier as AdCreditQuoteTierValues,
} from '@constants/payment';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { convertRobuxToAdCredit, getAdCreditQuotePreview } from '@services/ads/paymentService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useToastStore } from '@stores/toastStoreProvider';
import {
  AdCreditPurchaseQuoteResponse,
  AdCreditPurchaseQuoteTier,
  AdCreditQuoteSourceField,
  AdCreditQuoteTierType,
  PURCHASE_RESPONSE_CODE_ENUM,
} from '@type/payment';
import {
  AdCreditQuoteErrorDisplay,
  resolveAdCreditQuoteErrorDisplay,
} from '@utils/adCreditQuoteError';
import { MicroUsdToUsdString, MicroUsdToUsdStringRoundedDown } from '@utils/currency';
import { CaptureException, IsImpersonationError } from '@utils/error';
import { GetUrlWithParams } from '@utils/url';

const QUOTE_DEBOUNCE_MS = 350;
const INITIAL_QUOTE_VALUE = '--';
const INITIAL_TIER_BREAKDOWN: AdCreditPurchaseQuoteTier[] = [
  {
    ad_credit_micros: 0,
    ad_credit_per_robux: 0,
    robux_amount: 0,
    tier: AdCreditQuoteTierValues.O18,
  },
  {
    ad_credit_micros: 0,
    ad_credit_per_robux: 0,
    robux_amount: 0,
    tier: AdCreditQuoteTierValues.STANDARD,
  },
];

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

export const WatermarkedBuyAdCredit = ({
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
  showBalanceScopeSelector = true,
  showGroupBalanceOption = false,
}: BuyAdCreditProps): ReactElement => {
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateBilling, translateHTML: translateBillingHTML } =
    useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateForecast } = useNamespacedTranslation(TranslationNamespace.Forecast);
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);

  const {
    adCreditActivated,
    adCreditMaximumPurchaseAmount,
    adCreditMinimumPurchaseAmount,
    adCreditO18UsdPerRobux,
    adCreditStandardUsdPerRobux,
    paymentProfiles,
  } = useAppStore((state: AppStoreType) => state.appData);
  const { setShowPurchaseAdCreditError } = useToastStore();

  const {
    classes: {
      buyButton,
      buyButtonRow,
      cancelButton,
      disclaimerHeaderContainer,
      disclaimerRow,
      disclaimerText,
      divider,
      fullWidth,
      robuxBalanceContainer,
      smallRobuxIcon,
      subtitleContainer,
      watermarkedAdCreditBalanceSegment,
      watermarkedBalanceAmount,
      watermarkedBalanceBand,
      watermarkedBalanceOr,
      watermarkedBalanceScopeSelector,
      watermarkedBalanceScopeSelectorContainer,
      watermarkedBalanceSegment,
      watermarkedBreakdownRobuxIcon,
      watermarkedDisclaimerContent,
      watermarkedDisclaimerHeader,
      watermarkedDualInputRow,
      watermarkedInfoAlert,
      watermarkedInfoAlertClose,
      watermarkedInfoAlertContent,
      watermarkedInfoAlertIcon,
      watermarkedInputOr,
      watermarkedStrikethroughRobux,
      watermarkedTierCard,
      watermarkedTierLabelGroup,
      watermarkedTierRow,
      watermarkedTierRowValues,
      watermarkedTierValues,
      watermarkedTooltipIcon,
      watermarkedTotalRow,
    },
  } = useAddPaymentMethodStyles();

  const [balanceScope, setBalanceScope] = useState<AdCreditBalanceScope>(() =>
    resolveInitialBalanceScope(showGroupBalanceOption, initialBalanceScope),
  );
  const [sourceField, setSourceField] = useState<AdCreditQuoteSourceField>(
    AdCreditQuoteSourceFieldValues.AD_CREDIT_AMOUNT,
  );
  const [robuxAmount, setRobuxAmount] = useState<number | undefined>(undefined);
  const [adCreditAmount, setAdCreditAmount] = useState<number | undefined>(undefined);
  const [adCreditInputValue, setAdCreditInputValue] = useState<string>('');
  const [debouncedInput, setDebouncedInput] = useState<
    { sourceField: AdCreditQuoteSourceField; value: number } | undefined
  >(undefined);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [isInfoAlertDismissed, setIsInfoAlertDismissed] = useState<boolean>(false);
  const [isConvertRobuxFocused, setIsConvertRobuxFocused] = useState<boolean>(false);

  const hasVerifiedPaymentProfiles = paymentProfiles.some(
    (paymentProfile) => paymentProfile?.is_verified,
  );

  const selectedAdCreditBalance =
    balanceScope === AdCreditBalanceScope.Group ? groupAdCreditBalance : adCreditBalance;
  const selectedRobuxBalance =
    balanceScope === AdCreditBalanceScope.Group ? groupRobuxBalance : robuxBalance;
  const selectedGroupId = balanceScope === AdCreditBalanceScope.Group ? groupId : undefined;

  const sourceValue =
    sourceField === AdCreditQuoteSourceFieldValues.ROBUX_AMOUNT ? robuxAmount : adCreditAmount;

  const isBelowMinAdCredit =
    sourceField === AdCreditQuoteSourceFieldValues.AD_CREDIT_AMOUNT &&
    adCreditAmount !== undefined &&
    adCreditAmount > 0 &&
    adCreditAmount < adCreditMinimumPurchaseAmount;

  const exceedsRobuxBalance =
    sourceField === AdCreditQuoteSourceFieldValues.ROBUX_AMOUNT &&
    robuxAmount !== undefined &&
    robuxAmount > selectedRobuxBalance;

  const exceedsMaximumAdCredit =
    sourceField === AdCreditQuoteSourceFieldValues.AD_CREDIT_AMOUNT &&
    adCreditAmount !== undefined &&
    adCreditAmount > adCreditMaximumPurchaseAmount;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedInput(
        sourceValue !== undefined &&
          sourceValue > 0 &&
          !isBelowMinAdCredit &&
          !exceedsMaximumAdCredit &&
          !exceedsRobuxBalance
          ? { sourceField, value: sourceValue }
          : undefined,
      );
    }, QUOTE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [sourceField, sourceValue, isBelowMinAdCredit, exceedsMaximumAdCredit, exceedsRobuxBalance]);

  const quoteQuery = useQuery<AdCreditPurchaseQuoteResponse>({
    enabled: debouncedInput !== undefined,
    queryFn: () =>
      getAdCreditQuotePreview({
        source_field: debouncedInput!.sourceField,
        ...(debouncedInput!.sourceField === AdCreditQuoteSourceFieldValues.ROBUX_AMOUNT
          ? { robux_amount: debouncedInput!.value }
          : { ad_credit_amount: debouncedInput!.value }),
        ...(selectedGroupId !== undefined ? { groupId: selectedGroupId } : {}),
      }),
    queryKey: [
      'adCreditQuotePreview',
      debouncedInput?.sourceField,
      debouncedInput?.value,
      selectedGroupId,
    ],
  });

  const quote = quoteQuery.data;
  const isQuoteLoading = quoteQuery.isFetching;

  const effectiveRobuxCharge = exceedsRobuxBalance ? robuxAmount : quote?.robux_charge;

  const quoteErrorBounds = useMemo(
    () => ({
      maxAmount: adCreditMaximumPurchaseAmount.toLocaleString(),
      minAmount: adCreditMinimumPurchaseAmount.toLocaleString(),
    }),
    [adCreditMaximumPurchaseAmount, adCreditMinimumPurchaseAmount],
  );

  const quoteErrorDisplay = useMemo<AdCreditQuoteErrorDisplay | undefined>(() => {
    if (quote === undefined || quote.is_valid) {
      return undefined;
    }
    return resolveAdCreditQuoteErrorDisplay(quote.error_code, quoteErrorBounds, {
      minAdCreditAmount: quoteErrorBounds.minAmount,
      minRobuxAmount: quote.robux_charge.toLocaleString(),
    });
  }, [quote, quoteErrorBounds]);

  const clientSideErrorDisplay = useMemo<AdCreditQuoteErrorDisplay | undefined>(() => {
    if (exceedsMaximumAdCredit) {
      const maximumError: AdCreditQuoteErrorDisplay = {
        args: { maxAmount: quoteErrorBounds.maxAmount },
        translationKey: 'Validation.MaximumAdCredit',
        type: 'message',
      };
      return maximumError;
    }
    if (!isBelowMinAdCredit) {
      return undefined;
    }
    const minimumError: AdCreditQuoteErrorDisplay = {
      args: { minAmount: quoteErrorBounds.minAmount },
      translationKey: 'Description.MinimumAdCreditHint',
      type: 'message',
    };
    return minimumError;
  }, [
    exceedsMaximumAdCredit,
    isBelowMinAdCredit,
    quoteErrorBounds.maxAmount,
    quoteErrorBounds.minAmount,
  ]);

  const activeErrorDisplay = clientSideErrorDisplay ?? quoteErrorDisplay;

  const showInsufficientRobuxPanel =
    exceedsRobuxBalance || activeErrorDisplay?.type === 'insufficient_robux';

  const showErrorPanel =
    showInsufficientRobuxPanel || activeErrorDisplay !== undefined || quoteQuery.isError;

  const hasRobuxInputError =
    showErrorPanel &&
    (exceedsRobuxBalance || sourceField === AdCreditQuoteSourceFieldValues.ROBUX_AMOUNT);

  const hasAdCreditInputError =
    showErrorPanel &&
    !exceedsRobuxBalance &&
    sourceField === AdCreditQuoteSourceFieldValues.AD_CREDIT_AMOUNT;

  // Only the field the user is actively editing is populated. The value derived
  // from the server quote is shown in the breakdown/total display area only, not
  // back-filled into the other input box.
  const robuxFieldValue =
    sourceField === AdCreditQuoteSourceFieldValues.ROBUX_AMOUNT ? robuxAmount : undefined;
  const adCreditFieldValue =
    sourceField === AdCreditQuoteSourceFieldValues.AD_CREDIT_AMOUNT ? adCreditInputValue : '';

  const isRobuxAdjustedDown =
    quote !== undefined &&
    sourceField === AdCreditQuoteSourceFieldValues.ROBUX_AMOUNT &&
    robuxAmount !== undefined &&
    quote.robux_charge < robuxAmount;

  const insufficientRobuxCharge =
    exceedsRobuxBalance && robuxAmount !== undefined
      ? robuxAmount
      : (effectiveRobuxCharge ?? quote?.robux_charge);

  const robuxNeededForPurchase =
    showInsufficientRobuxPanel && insufficientRobuxCharge !== undefined
      ? Math.max(0, insufficientRobuxCharge - selectedRobuxBalance)
      : undefined;

  const maxConvertibleAdCreditAmount =
    showInsufficientRobuxPanel &&
    sourceField === AdCreditQuoteSourceFieldValues.AD_CREDIT_AMOUNT &&
    quote !== undefined &&
    quote.ad_credit_quantity_micros > 0
      ? MicroUsdToUsdStringRoundedDown(quote.ad_credit_quantity_micros)
      : undefined;

  const errorPanelMessage =
    activeErrorDisplay?.type === 'message'
      ? translateBilling(activeErrorDisplay.translationKey, activeErrorDisplay.args)
      : undefined;

  let inputErrorMessage: string | undefined;
  if (activeErrorDisplay?.type === 'message') {
    inputErrorMessage = errorPanelMessage;
  } else if (quoteQuery.isError) {
    inputErrorMessage = translateMisc('Message.GenericError');
  } else if (showInsufficientRobuxPanel && maxConvertibleAdCreditAmount !== undefined) {
    inputErrorMessage = translateBilling('Message.MaximumConvertibleAdCredit', {
      amount: maxConvertibleAdCreditAmount,
    });
  } else if (showInsufficientRobuxPanel) {
    inputErrorMessage = translateBilling('Message.NeedMoreRobux', {
      robuxNeeded: (robuxNeededForPurchase ?? 0).toLocaleString(),
    });
  } else {
    inputErrorMessage = errorPanelMessage;
  }
  const robuxInputHelperText = hasRobuxInputError ? inputErrorMessage : undefined;
  const adCreditInputHelperText = hasAdCreditInputError ? inputErrorMessage : undefined;

  const showTierBreakdown = !quoteQuery.isError && !(isQuoteLoading && quote === undefined);
  const displayedTierBreakdown =
    quote?.is_valid && quote.tier_breakdown.length > 0
      ? quote.tier_breakdown
      : INITIAL_TIER_BREAKDOWN;
  const hasQuoteValues = quote?.is_valid === true;

  const navigateToPaymentSettingsPage = (state?: BuyAdCreditEnum) => {
    if (state === BuyAdCreditEnum.SUCCESS && !hasVerifiedPaymentProfiles && !adCreditActivated) {
      window.location.href = GetUrlWithParams(
        `${process.env.siteBasePath}${Routes.PAYMENT_SETTINGS}`,
        { state: BuyAdCreditEnum.SUCCESS_AND_FIRST_PAYMENT_METHOD },
      );
    } else {
      window.location.href = GetUrlWithParams(
        `${process.env.siteBasePath}${Routes.PAYMENT_SETTINGS}`,
        { state },
      );
    }
  };

  const paymentSetupCompletion: PaymentSetupCompletion =
    selectedGroupId !== undefined
      ? { accountScope: 'group', groupId: selectedGroupId, paymentMethodType: 'groupAdCredit' }
      : { accountScope: 'user', paymentMethodType: 'adCredit' };

  const canBuy =
    !isPurchasing && !isQuoteLoading && quote !== undefined && quote.is_valid && !showErrorPanel;

  const handleBuy = async (showSuccessDialog = true): Promise<void> => {
    if (isPurchasing || quote === undefined || !canBuy) {
      return;
    }
    setIsPurchasing(true);
    logNativeClickEvent(EventName.BuyAdCreditAttempted, {});
    try {
      const { purchase_status: purchaseStatus } = await convertRobuxToAdCredit({
        ad_credit_quantity_micros: quote.ad_credit_quantity_micros,
        robux_amount: quote.robux_charge,
        ...(selectedGroupId !== undefined ? { groupId: selectedGroupId } : {}),
      });
      if (
        purchaseStatus ===
          PURCHASE_RESPONSE_CODE_ENUM.AdCreditPurchaseStatus_AD_CREDIT_PURCHASE_STATUS_SUCCESS ||
        purchaseStatus ===
          PURCHASE_RESPONSE_CODE_ENUM.AdCreditPurchaseStatus_AD_CREDIT_PURCHASE_STATUS_GRANT_PENDING
      ) {
        logNativeClickEvent(EventName.BuyAdCreditSuccess, {
          adCreditActivated: adCreditActivated.toString(),
          adCreditAmount: MicroUsdToUsdString(quote.ad_credit_quantity_micros),
        });
        if (showSuccessDialog) {
          setIsPurchasing(false);
          openBuyAdCreditSuccessDialog(
            MicroUsdToUsdString(quote.ad_credit_quantity_micros),
            quote.robux_charge.toLocaleString(),
            onComplete
              ? async () => {
                  await onComplete(paymentSetupCompletion);
                }
              : () => {
                  navigateToPaymentSettingsPage(
                    !hasVerifiedPaymentProfiles && !adCreditActivated
                      ? BuyAdCreditEnum.SUCCESS
                      : undefined,
                  );
                },
          );
        } else if (onComplete) {
          await onComplete(paymentSetupCompletion);
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
      } else {
        // Any other backend/purchase error we don't have specific handling for
        // surfaces the generic purchase-error toast instead of failing silently.
        errorMessage = (error as Error)?.message || 'Unknown Error';
        setShowPurchaseAdCreditError(true);
        CaptureException(error as Error);
      }
      logNativeImpressionEvent(EventName.BuyAdCreditFailed, { errorMessage });
      setIsPurchasing(false);
    }
  };

  const handleBalanceScopeChange = (value: AdCreditBalanceScope): void => {
    if (value === balanceScope) {
      return;
    }
    // Switching accounts resets the form so the previous account's amounts are
    // never reused to fire a quote request against the newly selected account.
    setBalanceScope(value);
    setSourceField(AdCreditQuoteSourceFieldValues.AD_CREDIT_AMOUNT);
    setRobuxAmount(undefined);
    setAdCreditAmount(undefined);
    setAdCreditInputValue('');
    setDebouncedInput(undefined);
  };

  const tierLabelKey = (tier: AdCreditQuoteTierType): string =>
    tier === AdCreditQuoteTierValues.O18 ? 'Label.Us18Rate' : 'Label.StandardRate';

  const balanceScopeSelectorComponent =
    showGroupBalanceOption && showBalanceScopeSelector ? (
      <div className={watermarkedBalanceScopeSelectorContainer}>
        <Dropdown
          className={watermarkedBalanceScopeSelector}
          label={translateBilling('Label.PurchasingFor')}
          onValueChange={(value) => handleBalanceScopeChange(value as AdCreditBalanceScope)}
          placeholder={translateBilling('Label.PurchasingFor')}
          size='Medium'
          value={balanceScope}>
          <Menu>
            <MenuItem
              title={groupName || translateBilling('Label.RobloxAdCredit')}
              value={AdCreditBalanceScope.Group}
            />
            <MenuItem
              title={translateAccount('Heading.PersonalAccount')}
              value={AdCreditBalanceScope.Personal}
            />
          </Menu>
        </Dropdown>
      </div>
    ) : null;

  const balanceContainer = (
    <div className={watermarkedBalanceBand} data-testid='watermarkedBalanceBand'>
      <span className={`text-body-medium content-default ${watermarkedBalanceSegment}`}>
        {translateBillingHTML('Label.RobuxBalanceWithAmount', null, {
          amount: (
            <span className={watermarkedBalanceAmount}>
              {selectedRobuxBalance.toLocaleString()}
            </span>
          ),
          robuxIcon: (
            <span className={watermarkedBalanceAmount}>
              <Icon className={smallRobuxIcon} name='icon-filled-robux' size='Small' />
            </span>
          ),
        })}
      </span>
      <span aria-hidden='true' className={`text-body-large ${watermarkedBalanceOr}`}>
        {translateMisc('Label.Or')}
      </span>
      <span className={`text-body-medium content-default ${watermarkedAdCreditBalanceSegment}`}>
        {translateBillingHTML('Label.AdCreditBalanceWithAmount', null, {
          amount: (
            <span className={watermarkedBalanceAmount}>
              {MicroUsdToUsdStringRoundedDown(selectedAdCreditBalance)}
            </span>
          ),
        })}
      </span>
    </div>
  );

  const dualInput = (
    <div className={watermarkedDualInputRow} data-testid='watermarkedDualInputRow'>
      <NumericFormat
        allowNegative={false}
        className={fullWidth}
        customInput={TextInput}
        data-testid='convertRobuxInput'
        decimalScale={0}
        error={robuxInputHelperText}
        hasError={hasRobuxInputError}
        id='watermarkedConvertRobux'
        label={translateBilling('Label.RobuxAmount')}
        leadingIconNode={
          isConvertRobuxFocused || robuxFieldValue != null ? (
            <Icon className={smallRobuxIcon} name='icon-filled-robux' size='Small' />
          ) : undefined
        }
        onBlur={() => setIsConvertRobuxFocused(false)}
        onFocus={() => setIsConvertRobuxFocused(true)}
        onValueChange={({ floatValue }, sourceInfo) => {
          if (sourceInfo.source !== 'event') {
            return;
          }
          setSourceField(AdCreditQuoteSourceFieldValues.ROBUX_AMOUNT);
          setRobuxAmount(floatValue);
        }}
        size='Medium'
        thousandSeparator
        value={robuxFieldValue ?? ''}
      />
      <FieldLabelOffset className={watermarkedInputOr}>
        <span className='flex height-1000 items-center text-body-large content-default'>
          {translateMisc('Label.Or')}
        </span>
      </FieldLabelOffset>
      <NumericFormat
        allowNegative={false}
        className={fullWidth}
        customInput={TextInput}
        data-testid='adCreditAmountInput'
        decimalScale={2}
        error={adCreditInputHelperText}
        hasError={hasAdCreditInputError}
        id='watermarkedAdCreditAmount'
        label={translateBilling('Title.AdCreditAmount')}
        onValueChange={({ floatValue, value }, sourceInfo) => {
          if (sourceInfo.source !== 'event') {
            return;
          }
          setSourceField(AdCreditQuoteSourceFieldValues.AD_CREDIT_AMOUNT);
          setAdCreditAmount(floatValue);
          setAdCreditInputValue(value);
        }}
        size='Medium'
        thousandSeparator
        value={adCreditFieldValue ?? ''}
      />
    </div>
  );

  const infoAlert = isInfoAlertDismissed ? null : (
    <div className={watermarkedInfoAlert} data-testid='watermarkedInfoAlert'>
      <Icon className={watermarkedInfoAlertIcon} name='icon-filled-circle-i' size='Small' />
      <div className={watermarkedInfoAlertContent}>
        <span className='text-body-medium'>
          {translateBilling('Message.WatermarkedConversionInfo')}
        </span>
        <Link
          className='shrink-0'
          href={AdCreditConversionLearnMoreUrl}
          size='Small'
          target='_blank'
          underline='always'>
          {translateReport('Action.LearnMoreManage')}
        </Link>
      </div>
      <span
        className={watermarkedInfoAlertClose}
        data-testid='dismissInfoAlert'
        onClick={() => setIsInfoAlertDismissed(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            setIsInfoAlertDismissed(true);
          }
        }}
        role='button'
        tabIndex={0}>
        <Icon name='icon-regular-x' size='Small' />
      </span>
    </div>
  );

  const quoteLoadingSkeleton =
    !showErrorPanel && quoteQuery.isFetching && quote === undefined ? (
      <div
        aria-label={translateBilling('Description.LoadingQuote')}
        className={watermarkedTierCard}
        data-testid='quoteLoading'
        role='status'>
        {['firstTier', 'secondTier'].map((row) => (
          <div className={watermarkedTierRow} key={row}>
            <div className={watermarkedTierLabelGroup}>
              <Skeleton
                animate
                className='height-[20px] width-[112px]'
                data-testid='quoteLoadingSkeletonBlock'
                variant='rectangular'
              />
              <Skeleton
                animate
                className='height-[14px] width-[152px]'
                data-testid='quoteLoadingSkeletonBlock'
                variant='rectangular'
              />
            </div>
            <div className={watermarkedTierValues}>
              <Skeleton
                animate
                className='height-[20px] width-[96px]'
                data-testid='quoteLoadingSkeletonBlock'
                variant='rectangular'
              />
              <Skeleton
                animate
                className='height-[14px] width-[72px]'
                data-testid='quoteLoadingSkeletonBlock'
                variant='rectangular'
              />
            </div>
          </div>
        ))}
        <Divider className={divider} />
        <div className={watermarkedTotalRow}>
          <Skeleton
            animate
            className='height-[20px] width-[64px]'
            data-testid='quoteLoadingSkeletonBlock'
            variant='rectangular'
          />
          <div className={watermarkedTierValues}>
            <Skeleton
              animate
              className='height-[20px] width-[104px]'
              data-testid='quoteLoadingSkeletonBlock'
              variant='rectangular'
            />
            <Skeleton
              animate
              className='height-[14px] width-[80px]'
              data-testid='quoteLoadingSkeletonBlock'
              variant='rectangular'
            />
          </div>
        </div>
        {infoAlert}
      </div>
    ) : null;

  const tierBreakdown = showTierBreakdown ? (
    <div className={watermarkedTierCard} data-testid='watermarkedTierBreakdown'>
      {displayedTierBreakdown.map((tier: AdCreditPurchaseQuoteTier) => (
        <div className={watermarkedTierRow} key={tier.tier}>
          <div className={watermarkedTierLabelGroup}>
            <span className='text-title-large content-emphasis'>
              {translateBilling(tierLabelKey(tier.tier))}
            </span>
            <span className='text-body-medium content-default'>
              {translateBilling('Description.EarnedAtRate', {
                rate: hasQuoteValues
                  ? String(tier.ad_credit_per_robux)
                  : String(
                      tier.tier === AdCreditQuoteTierValues.O18
                        ? adCreditO18UsdPerRobux || INITIAL_QUOTE_VALUE
                        : adCreditStandardUsdPerRobux || INITIAL_QUOTE_VALUE,
                    ),
              })}
            </span>
          </div>
          <div className={watermarkedTierValues}>
            <span className='text-body-medium content-default'>
              {translateBilling('Label.AdCreditWithAmount', {
                amount: hasQuoteValues
                  ? MicroUsdToUsdString(tier.ad_credit_micros)
                  : INITIAL_QUOTE_VALUE,
              })}
            </span>
            <div className={robuxBalanceContainer}>
              <Icon
                className={watermarkedBreakdownRobuxIcon}
                name='icon-filled-robux'
                size='Small'
              />
              <span
                className='text-body-medium content-default'
                data-testid='watermarkedBreakdownRobuxValue'>
                {hasQuoteValues ? tier.robux_amount.toLocaleString() : INITIAL_QUOTE_VALUE}
              </span>
            </div>
          </div>
        </div>
      ))}
      <Divider className={divider} />
      <div className={watermarkedTotalRow}>
        <div className='flex items-center gap-xsmall'>
          <span className='text-title-large content-emphasis'>
            {translateForecast('Label.PeriodTotal')}
          </span>
          {isRobuxAdjustedDown && hasQuoteValues && (
            <AppTooltip
              position='right-center'
              title={translateBilling('Description.AdjustedForConversion')}>
              <span className={watermarkedTooltipIcon} data-testid='adjustedForConversionTooltip'>
                <Icon name='icon-regular-circle-i' size='Small' />
              </span>
            </AppTooltip>
          )}
        </div>
        <div className={watermarkedTierRowValues}>
          <span className='text-title-large content-emphasis'>
            {translateBilling('Label.AdCreditWithAmount', {
              amount: hasQuoteValues
                ? MicroUsdToUsdString(quote?.ad_credit_quantity_micros ?? 0)
                : INITIAL_QUOTE_VALUE,
            })}
          </span>
          <div className={robuxBalanceContainer}>
            {isRobuxAdjustedDown && hasQuoteValues && (
              <Icon
                className={`${watermarkedBreakdownRobuxIcon} content-default`}
                name='icon-filled-robux'
                size='Small'
              />
            )}
            {isRobuxAdjustedDown && hasQuoteValues && (
              <span
                className={`text-body-medium content-default ${watermarkedStrikethroughRobux}`}
                data-testid='adjustedRobuxInput'>
                {robuxAmount.toLocaleString()}
              </span>
            )}
            <Icon className={smallRobuxIcon} name='icon-filled-robux' size='Small' />
            <span
              className='text-title-large content-emphasis'
              data-testid='watermarkedTotalRobuxValue'>
              {hasQuoteValues ? (quote?.robux_charge ?? 0).toLocaleString() : INITIAL_QUOTE_VALUE}
            </span>
          </div>
        </div>
      </div>
      {infoAlert}
    </div>
  ) : null;

  const disclaimer = (
    <>
      <Divider className={divider} />
      <div className={disclaimerRow}>
        <div className={disclaimerHeaderContainer}>
          <span className={`${disclaimerText} ${watermarkedDisclaimerHeader}`}>
            {translateBilling('Description.PurchaseAdCreditDisclaimerHeader')}
          </span>
        </div>
        <div>
          <span className={`${disclaimerText} ${watermarkedDisclaimerContent}`}>
            {translateBilling('Description.PurchaseAdCreditDisclaimerContent')}
          </span>
        </div>
      </div>
    </>
  );

  const buyButtonComponent = (className: string) => (
    <Button
      className={className}
      data-testid='buyButton'
      isDisabled={!canBuy}
      isLoading={isPurchasing}
      onClick={() => handleBuy(true)}
      size='Medium'
      variant='Emphasis'>
      {translateBilling('Action.Buy')}
    </Button>
  );

  const cancelButtonComponent = (className: string) => (
    <Button
      className={className}
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
  );

  const footer = actionsContainer ? (
    createPortal(
      <>
        {buyButtonComponent('grow')}
        {cancelButtonComponent('grow')}
      </>,
      actionsContainer,
    )
  ) : (
    <div className={buyButtonRow}>
      {buyButtonComponent(buyButton)}
      {cancelButtonComponent(cancelButton)}
    </div>
  );

  return (
    <div>
      <div className={subtitleContainer}>
        <span className='text-heading-small'>
          {translateBilling('Heading.ConvertRobuxToAdCredit')}
        </span>
      </div>
      {balanceScopeSelectorComponent}
      {balanceContainer}
      {dualInput}
      {quoteLoadingSkeleton}
      {tierBreakdown}
      {disclaimer}
      {footer}
    </div>
  );
};
