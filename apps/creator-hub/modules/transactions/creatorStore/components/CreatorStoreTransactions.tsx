import { useRouter } from 'next/router';
import type { ChangeEvent, FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import type { RobloxMarketplaceFiatSharedV1Beta1Money as Money } from '@rbx/client-marketplace-fiat-service/v1';
import { RobloxMarketplaceFiatSharedV1Beta1PurchasePriceFilter as PurchasePriceFilter } from '@rbx/client-marketplace-fiat-service/v1';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  Button,
  CircularProgress,
  DatePicker,
  Grid,
  MenuItem,
  PickersUtilsProvider,
  Select,
  TextField,
} from '@rbx/ui';
import OverviewInlineUrlTranslationLabel from '@modules/creations/common/components/OverviewInlineUrlTranslationLabel';
import {
  useFetchSellerAccountBalance,
  useFetchSellerPayoutsTotal,
  useFetchSellerStatus,
} from '@modules/marketplaceFiatService/MarketplaceFiatServiceQueries';
import { useFetchSellerRestrictions } from '@modules/marketplacePublishingRequirements/MarketplacePublishingRequirementsProvider';
import { creatorHub } from '@modules/miscellaneous/urls';
import { StoreTableType, StoreTableTypeToTranslationKey } from '../constants/StoreTableType';
import useCreatorMarketplaceTransactionsStyles from './CreatorStoreTransactions.styles';
import ExportReport from './ExportReport';
import OnboardingCard from './OnboardingCard';
import PayoutCard from './PayoutCard';
import StoreTransactionsTable from './StoreTransactionsTable';

// Formats zero balanced payout amounts to the same currencyCode as non-zero balances
const getConsistentZeroBalanceCurrencyCodes = (
  totalPayoutAmount: Money | undefined,
  pendingBalance: Money | undefined,
  availableBalance: Money | undefined,
) => {
  let updatedTotalPayoutAmount = totalPayoutAmount;
  let updatedPendingBalance = pendingBalance;
  let updatedAvailableBalance = availableBalance;

  let zeroAmountCurrencyCode;
  if (
    totalPayoutAmount?.quantity?.significand !== undefined &&
    totalPayoutAmount?.quantity?.significand !== null &&
    Number(totalPayoutAmount?.quantity?.significand) > 0
  ) {
    zeroAmountCurrencyCode = totalPayoutAmount.currencyCode;
  } else if (
    pendingBalance?.quantity?.significand !== undefined &&
    pendingBalance?.quantity?.significand !== null &&
    Number(pendingBalance?.quantity?.significand) > 0
  ) {
    zeroAmountCurrencyCode = pendingBalance.currencyCode;
  } else {
    zeroAmountCurrencyCode = availableBalance?.currencyCode;
  }
  if (
    zeroAmountCurrencyCode &&
    totalPayoutAmount?.quantity?.significand !== undefined &&
    totalPayoutAmount?.quantity?.significand === 0
  ) {
    updatedTotalPayoutAmount = { ...totalPayoutAmount, currencyCode: zeroAmountCurrencyCode };
  }
  if (
    zeroAmountCurrencyCode &&
    pendingBalance?.quantity?.significand !== undefined &&
    pendingBalance?.quantity?.significand === 0
  ) {
    updatedPendingBalance = { ...pendingBalance, currencyCode: zeroAmountCurrencyCode };
  }
  if (
    zeroAmountCurrencyCode &&
    availableBalance?.quantity?.significand !== undefined &&
    availableBalance?.quantity?.significand === 0
  ) {
    updatedAvailableBalance = { ...availableBalance, currencyCode: zeroAmountCurrencyCode };
  }

  return {
    totalPayoutAmount: updatedTotalPayoutAmount,
    pendingBalance: updatedPendingBalance,
    availableBalance: updatedAvailableBalance,
  };
};

const CreatorStoreTransactions: FunctionComponent<React.PropsWithChildren> = () => {
  const defaultTableType = StoreTableType.OutgoingPayments;
  const { translate } = useTranslation();
  const { classes: styles, cx } = useCreatorMarketplaceTransactionsStyles();

  const router = useRouter();
  const {
    query: { paymentType: urlQueryTab },
  } = router;

  const { dashboard } = creatorHub;

  const currentTableType =
    typeof urlQueryTab === 'string'
      ? StoreTableType[urlQueryTab as keyof typeof StoreTableType]
      : null;

  const { data: sellerStatusResponse, isPending: isSellerStatusLoading } = useFetchSellerStatus();
  const {
    data: pricingRestrictions,
    hasError: hasPricingRestrictionsError,
    isLoading: isPricingRestrictionsLoading,
  } = useFetchSellerRestrictions();

  const isPayoutsFrozen =
    !hasPricingRestrictionsError &&
    !isPricingRestrictionsLoading &&
    pricingRestrictions !== undefined &&
    !pricingRestrictions.canPrice;

  const isSetupCompleted = sellerStatusResponse && sellerStatusResponse.setupCompleted;
  const selectedTableType = currentTableType ?? defaultTableType;
  const isExportAvailable =
    selectedTableType === StoreTableType.IncomingPayments ||
    selectedTableType === StoreTableType.OutgoingPayments;

  const maxEndDate = useMemo(() => new Date(Date.now()), []);
  const minStartDate = useMemo(() => new Date('04/01/2024'), []);

  const [displayStartDate, setDisplayStartDate] = useState<Date | null>(null);
  const [displayEndDate, setDisplayEndDate] = useState<Date | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [priceFilter, setPriceFilter] = useState<PurchasePriceFilter>(PurchasePriceFilter.All);
  const onChangePriceFilter = useCallback((event: ChangeEvent<{ value: unknown }>) => {
    setPriceFilter(event.target.value as PurchasePriceFilter);
  }, []);

  const onChangeDisplayEndDate = useCallback(
    async (date: Date | null) => {
      date?.setHours(23, 59, 59);
      setDisplayEndDate(date);
      if (date === null) {
        setEndDate(date);
      } else if (
        (startDate === null && date >= minStartDate) ||
        (startDate !== null && date >= startDate)
      ) {
        if (date <= maxEndDate) {
          date?.setHours(23, 59, 59);
          setEndDate(date);
        }
      }
    },
    [startDate, maxEndDate, minStartDate],
  );

  const onChangeDisplayStartDate = useCallback(
    async (date: Date | null) => {
      setDisplayStartDate(date);
      if (date === null) {
        setStartDate(date);
      } else if (
        (endDate === null && date <= maxEndDate) ||
        (endDate !== null && date <= endDate)
      ) {
        if (date >= minStartDate) {
          setStartDate(date);
        }
      }
    },
    [endDate, maxEndDate, minStartDate],
  );

  const onClickReset = useCallback(async () => {
    onChangeDisplayStartDate(null);
    onChangeDisplayEndDate(null);
    setPriceFilter(PurchasePriceFilter.All);
  }, [onChangeDisplayEndDate, onChangeDisplayStartDate]);

  const showInsightCards = useMemo(() => {
    return (
      isSetupCompleted &&
      (selectedTableType === StoreTableType.Payouts ||
        selectedTableType === StoreTableType.IncomingPayments)
    );
  }, [selectedTableType, isSetupCompleted]);

  const { data: sellerAccountBalanceResponse, isPending: isSellerAccountBalanceLoading } =
    useFetchSellerAccountBalance(showInsightCards);

  const { data: sellerPayoutsTotalResponse, isPending: isSellerPayoutsTotalLoading } =
    useFetchSellerPayoutsTotal();

  const addTableTypeToURL = useCallback(
    // Set tableType into URL. This is used instead of state for the sake of pageview analytics.
    (tableType: StoreTableType) => {
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            paymentType: tableType,
          },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  const onChangePaymentType = useCallback(
    (event: ChangeEvent<{ value: unknown }>) => {
      const tableType = event.target.value as StoreTableType;
      addTableTypeToURL(tableType);
    },
    [addTableTypeToURL],
  );

  if (!currentTableType) {
    // Set initial tableType into URL for analytics
    addTableTypeToURL(defaultTableType);
  }

  if (isSellerStatusLoading || isSellerAccountBalanceLoading || isSellerPayoutsTotalLoading) {
    return (
      <Grid container data-testid='creator-store-transactions-id' item>
        <CircularProgress />
      </Grid>
    );
  }

  // Hiding the payouts until the backend is correct (STM-5011)
  const isPayoutTotalShown = sellerPayoutsTotalResponse?.totalPayoutAmount !== null;

  const { totalPayoutAmount, pendingBalance, availableBalance } =
    getConsistentZeroBalanceCurrencyCodes(
      sellerPayoutsTotalResponse?.totalPayoutAmount,
      sellerAccountBalanceResponse?.pendingBalance,
      sellerAccountBalanceResponse?.availableBalance,
    );

  return (
    <Grid
      container
      data-testid='creator-store-transactions-id'
      direction='column'
      alignItems='flex-start'
      spacing={2}>
      {showInsightCards && isPayoutsFrozen && (
        <Grid container item direction='column' spacing={2}>
          <Grid item XSmall>
            <Alert data-testid='payouts-frozen-alert-id' severity='error' variant='standard'>
              <OverviewInlineUrlTranslationLabel
                anchorTargetUrl={dashboard.getSellerOnboardingUrl()}
                closing='reqLinkEnd'
                typographyVariantOverride='smallLabel2'
                linkVariantOverride='inherit'
                typographyColorOverride='inherit'
                opening='reqLinkStart'
                translationKey='Message.PayoutsFrozen'
              />
            </Alert>
          </Grid>
        </Grid>
      )}
      {!isSetupCompleted && (
        <Grid item className={cx(styles.fullWidth, styles.onboardingContainer)}>
          <OnboardingCard />
        </Grid>
      )}
      {showInsightCards && (
        <Grid item>
          <Grid container className={styles.payoutContainer} item direction='row' spacing={2}>
            {isPayoutTotalShown && totalPayoutAmount && (
              <Grid item>
                <PayoutCard
                  amount={totalPayoutAmount}
                  description={translate('Message.PayoutTotal')}
                  header={translate('Title.PayoutTotal')}
                />
              </Grid>
            )}

            {pendingBalance && (
              <Grid item>
                <PayoutCard
                  amount={pendingBalance}
                  description={translate('Message.PendingRevenue')}
                  header={translate('Title.PendingRevenue')}
                />
              </Grid>
            )}

            {availableBalance && (
              <Grid item>
                <PayoutCard
                  amount={availableBalance}
                  description={translate('Message.AvailableBalance')}
                  header={translate('Title.AvailableBalance')}
                />
              </Grid>
            )}
          </Grid>
        </Grid>
      )}
      <Grid container item direction='row' justifyContent='start' spacing={2}>
        <Grid item>
          <Select
            className={styles.paymentTypeDropdown}
            size='medium'
            label={translate('Label.PaymentType')}
            value={selectedTableType}
            onChange={onChangePaymentType}>
            {Object.values(StoreTableType).map((tableType) => {
              return (
                <MenuItem value={tableType} key={tableType}>
                  {translate(
                    StoreTableTypeToTranslationKey.get(tableType ?? defaultTableType) ?? '',
                  )}
                </MenuItem>
              );
            })}
          </Select>
        </Grid>
        {currentTableType !== StoreTableType.Payouts && (
          <>
            <Grid item>
              <PickersUtilsProvider>
                <DatePicker
                  maxDate={displayEndDate || maxEndDate}
                  minDate={minStartDate}
                  onChange={onChangeDisplayStartDate}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      value={displayStartDate}
                      id='start-date-picker'
                      data-testid='startDate'
                      variant='outlined'
                      label={translate('Label.StartDate')}
                      className={undefined}
                    />
                  )}
                  value={displayStartDate}
                />
              </PickersUtilsProvider>
            </Grid>
            <Grid item>
              <PickersUtilsProvider>
                <DatePicker
                  maxDate={maxEndDate}
                  minDate={displayStartDate || minStartDate}
                  onChange={onChangeDisplayEndDate}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      value={displayEndDate}
                      id='end-date-picker'
                      data-testid='endDate'
                      variant='outlined'
                      label={translate('Label.EndDate')}
                      className={undefined}
                    />
                  )}
                  value={displayEndDate}
                />
              </PickersUtilsProvider>
            </Grid>
            <Grid item>
              <Select
                size='medium'
                label={translate('Label.Price') || 'Price'}
                value={priceFilter}
                onChange={onChangePriceFilter}>
                <MenuItem value={PurchasePriceFilter.All}>{translate('Label.All')}</MenuItem>
                <MenuItem value={PurchasePriceFilter.FreeOnly}>{translate('Label.Free')}</MenuItem>
                <MenuItem value={PurchasePriceFilter.PaidOnly}>{translate('Label.Paid')}</MenuItem>
              </Select>
            </Grid>
            <Grid item className={styles.resetButton}>
              <Button onClick={onClickReset}>{translate('Action.Reset')}</Button>
            </Grid>
          </>
        )}

        {isExportAvailable && (
          <Grid item className={styles.exportReport}>
            <ExportReport
              storeTableType={selectedTableType}
              startDate={startDate || undefined}
              endDate={endDate || undefined}
              priceFilter={priceFilter}
            />
          </Grid>
        )}
      </Grid>
      <Grid item className={styles.fullWidth}>
        <StoreTransactionsTable
          tableType={currentTableType ?? defaultTableType}
          startDate={startDate || undefined}
          endDate={endDate || undefined}
          priceFilter={priceFilter}
        />
      </Grid>
    </Grid>
  );
};

export default CreatorStoreTransactions;
