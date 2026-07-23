import type { FunctionComponent } from 'react';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  formatLocalCurrency,
  getLocalCurrencyDisplay,
  getTaxNote,
} from '../../../utils/countryCurrency';
import {
  currencyMoneyFormatter,
  currencyNumberFormatter,
  moneyToNumber,
  dateFormatter,
} from '../../../utils/formatters';
import type { BillDetails, ServiceUsage } from '../../types';
import { PRICE_MAX_DECIMALS, ServiceId, TaxIdType } from '../../types';
import BillingStatementAddress from '../BillingStatementAddress/BillingStatementAddress';
import BillingStatementPayments from '../BillingStatementPayments/BillingStatementPayments';
import BillingStatementServiceItem from '../BillingStatementServiceItem/BillingStatementServiceItem';
import useBillingStatementStyles from './BillingStatement.styles';

export type TStatementInfo =
  | { billingDate: Date; isPendingUsage: false }
  | { billingDate: undefined; isPendingUsage: true };

export const isTStatementInfo = (obj: {
  isPendingUsage: boolean;
  billingDate: Date | undefined;
}): obj is TStatementInfo => {
  return typeof obj.billingDate !== 'undefined' || obj.isPendingUsage;
};

export type BillingStatementProps = {
  data: BillDetails;
  previousBalance?: number;
  statementInfo: TStatementInfo;
  taxId?: string;
};

const EU_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czechia
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
];

const handlePrint = () => {
  const printContent = document.getElementById('print-container');
  const originalContent = document.body.innerHTML;

  if (printContent) {
    document.body.innerHTML = printContent.outerHTML;
    window.print();
    document.body.innerHTML = originalContent;
  }
};

const BillingStatement: FunctionComponent<BillingStatementProps> = ({
  data,
  previousBalance,
  statementInfo,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { sectionTitle, usageSection, noDataText, invoiceLines, billId, vatText, totalText },
  } = useBillingStatementStyles();
  const { billingDate, isPendingUsage } = statementInfo;

  const taxIdType =
    data.taxIdType && isValidEnumValue(TaxIdType, data.taxIdType) ? data.taxIdType : null;

  const isEUCountry =
    data.billingAddress?.country && EU_COUNTRIES.includes(data.billingAddress.country);

  // Bills are charged in USD; conversionRate is a reference-only USD->local rate captured at bill
  // time and stored for every non-US country. Whether we surface a local-currency figure—and
  // whether it's the whole total or only the tax—is a per-market display decision owned by the
  // frontend (see getLocalCurrencyDisplay). null/-1/0 rates (US, pending, older bills, or a failed
  // lookup) and non-display markets are skipped so we never show a misleading figure.
  const totalUsd =
    (data.totalAmount ? moneyToNumber(data.totalAmount) : 0) + (previousBalance ?? 0);
  const conversionRate =
    !isPendingUsage &&
    typeof data.conversionRate === 'number' &&
    Number.isFinite(data.conversionRate) &&
    data.conversionRate > 0
      ? data.conversionRate
      : null;
  const { mode: localCurrencyMode, currencyCode: localCurrencyCode } = getLocalCurrencyDisplay(
    data.billingAddress?.country,
    data.billingAddress?.state,
  );
  // For convert markets, show Subtotal/Taxes/Total in local currency and add a "Total (USD)"
  // secondary line. Bills are always settled in USD — this is purely a display decision.
  const canShowLocal =
    localCurrencyMode === 'convert' && conversionRate !== null && !!localCurrencyCode;
  const localSubtotal =
    canShowLocal && conversionRate !== null && localCurrencyCode
      ? formatLocalCurrency(
          moneyToNumber(data.usageAmount) * conversionRate,
          localCurrencyCode,
          locale,
        )
      : null;
  const localTax =
    canShowLocal && conversionRate !== null && localCurrencyCode
      ? formatLocalCurrency(
          moneyToNumber(data.taxAmount) * conversionRate,
          localCurrencyCode,
          locale,
        )
      : null;
  const localTotal =
    canShowLocal && conversionRate !== null && localCurrencyCode
      ? formatLocalCurrency(totalUsd * conversionRate, localCurrencyCode, locale)
      : null;
  // Tax-type annotation for the combined tax line (e.g. "Includes VAT"/"Includes PST"). Hidden for
  // pending usage and for locations without a specific note. EU countries render the reverse-charge
  // disclaimer instead, so getTaxNote returns null for them.
  const taxNote = isPendingUsage
    ? null
    : getTaxNote(data.billingAddress?.country, data.billingAddress?.state);

  return (
    <Grid id='print-container' container item XSmall={12} spacing={5}>
      <Grid item container XSmall={12}>
        <Grid item container XSmall={12} justifyContent='space-between' alignItems='center'>
          <Grid>
            {data.billId && (
              <Grid item XSmall={12} className={billId}>
                <Typography variant='body2'>
                  {translate(translationKey('Label.BillId', TranslationNamespace.CloudServices), {
                    id: data.billId,
                  })}
                </Typography>
              </Grid>
            )}

            <Typography variant='body2'>
              {isPendingUsage
                ? translate(
                    translationKey('Message.PendingUsage', TranslationNamespace.CloudServices),
                  )
                : translate(
                    translationKey('Message.BillingStatement', TranslationNamespace.CloudServices),
                    {
                      date: dateFormatter(billingDate, locale),
                    },
                  )}
            </Typography>
          </Grid>
          <Button
            data-testid='print-button'
            color='secondary'
            size='small'
            variant='contained'
            onClick={handlePrint}>
            {translate(translationKey('Action.PrintBill', TranslationNamespace.CloudServices))}
          </Button>
        </Grid>
      </Grid>
      {!data.usages || data.usages.length === 0 ? (
        <Grid item XSmall={12} className={noDataText} data-testid='empty-billing-message'>
          {translate(translationKey('Message.NoBillingData', TranslationNamespace.CloudServices))}
        </Grid>
      ) : (
        <>
          <BillingStatementAddress
            billingAddress={data.billingAddress}
            robloxAddress={data.robloxAddress}
            taxId={data.taxId}
            taxIdType={taxIdType}
          />
          <Grid container item XSmall={12}>
            <Typography variant='h5'>
              {translate(translationKey('Label.Invoice', TranslationNamespace.CloudServices))}
            </Typography>
          </Grid>
          <Grid container item className={usageSection} XSmall={12}>
            {previousBalance && (
              <Grid container item justifyContent='space-between'>
                <Typography variant='h5' className={sectionTitle}>
                  {translate(
                    translationKey('Label.PreviousBalance', TranslationNamespace.CloudServices),
                  )}
                </Typography>
                <Typography variant='h5'>
                  {canShowLocal && localCurrencyCode && conversionRate !== null
                    ? (formatLocalCurrency(
                        previousBalance * conversionRate,
                        localCurrencyCode,
                        locale,
                      ) ?? currencyNumberFormatter(previousBalance))
                    : currencyNumberFormatter(previousBalance)}
                </Typography>
              </Grid>
            )}
            {data.usages?.map((universe, index) => (
              <Grid container item key={`universe-usage-${universe.consumerId}`} spacing={3}>
                <Grid container item justifyContent='space-between' alignItems='center'>
                  <Typography variant='subtitle1' className={index !== 0 ? sectionTitle : ''}>
                    {universe.consumerName}
                  </Typography>
                  <Grid item XSmall className={invoiceLines} />
                  <Typography variant='subtitle2'>
                    {universe.subtotalAmount &&
                      (canShowLocal && localCurrencyCode && conversionRate !== null
                        ? (formatLocalCurrency(
                            moneyToNumber(universe.subtotalAmount) * conversionRate,
                            localCurrencyCode,
                            locale,
                          ) ?? currencyMoneyFormatter(universe.subtotalAmount, PRICE_MAX_DECIMALS))
                        : currencyMoneyFormatter(universe.subtotalAmount, PRICE_MAX_DECIMALS))}
                  </Typography>
                </Grid>
                {universe.serviceUsages
                  ?.filter(
                    (service) =>
                      service.serviceId &&
                      isValidEnumValue(ServiceId, service.serviceId) &&
                      typeof service.subtotalAmount !== 'undefined' &&
                      Array.isArray(service.resourceUsages),
                  )
                  .map((service) => (
                    <BillingStatementServiceItem
                      data-testid={`${universe.consumerId}-${service.serviceId}`}
                      key={`service-usage-${service.serviceId}`}
                      service={service as ServiceUsage}
                      conversionRate={canShowLocal ? conversionRate : null}
                      localCurrencyCode={canShowLocal ? localCurrencyCode : null}
                    />
                  ))}
              </Grid>
            ))}
          </Grid>

          <Grid container item XSmall={12}>
            {!isPendingUsage && (
              <Grid container item justifyContent='space-between' alignItems='center'>
                <Grid item>
                  <Typography variant='subtitle1'>
                    {translate(
                      translationKey('Label.Subtotal', TranslationNamespace.CloudServices),
                    )}
                  </Typography>
                </Grid>
                <Grid item XSmall className={invoiceLines} />
                <Grid item>
                  <Typography variant='subtitle2' data-testid='subtotal-amount'>
                    {localSubtotal ?? currencyMoneyFormatter(data.usageAmount)}
                  </Typography>
                </Grid>
              </Grid>
            )}
            {!isPendingUsage && (
              <Grid
                container
                item
                className={sectionTitle}
                justifyContent='space-between'
                alignItems='center'>
                <Grid item>
                  <Typography variant='subtitle1' data-testid='taxes-label'>
                    {taxNote
                      ? translate(
                          translationKey('Label.TaxesIncludes', TranslationNamespace.CloudServices),
                          { taxName: taxNote },
                        )
                      : translate(
                          translationKey('Label.Taxes', TranslationNamespace.CloudServices),
                        )}
                  </Typography>
                </Grid>
                <Grid item XSmall className={invoiceLines} />
                <Grid item>
                  <Typography variant='subtitle2'>
                    {localTax ?? currencyMoneyFormatter(data.taxAmount)}
                  </Typography>
                </Grid>
              </Grid>
            )}
            {isEUCountry && !isPendingUsage && (
              <Grid
                container
                className={vatText}
                item
                justifyContent='space-between'
                alignItems='center'>
                <Typography variant='body2'>
                  {translate(
                    translationKey('Description.TaxVAT', TranslationNamespace.CloudServices),
                  )}
                </Typography>
              </Grid>
            )}
            <Grid
              container
              className={totalText}
              item
              justifyContent='space-between'
              alignItems='center'>
              <Typography variant='subtitle1' className={sectionTitle}>
                {translate(translationKey('Label.Total', TranslationNamespace.CloudServices))}
              </Typography>
              <Grid item XSmall className={invoiceLines} />
              <Typography variant='subtitle2' data-testid='total-amount'>
                {localTotal ?? currencyNumberFormatter(totalUsd)}
                {isPendingUsage &&
                  ` + ${translate(translationKey('Label.Taxes', TranslationNamespace.CloudServices))}`}
              </Typography>
            </Grid>
            {/* Convert markets: always show the actual USD charge below the local-currency total */}
            {localTotal && (
              <Grid container item justifyContent='space-between' alignItems='center'>
                <Typography variant='subtitle1' className={sectionTitle}>
                  {translate(translationKey('Label.TotalUsd', TranslationNamespace.CloudServices))}
                </Typography>
                <Grid item XSmall className={invoiceLines} />
                <Typography variant='subtitle2' data-testid='total-charged-in-usd'>
                  {currencyNumberFormatter(totalUsd)}
                </Typography>
              </Grid>
            )}
          </Grid>
          {!isPendingUsage && <BillingStatementPayments payments={data.payments} />}
        </>
      )}
    </Grid>
  );
};

export default withTranslation(BillingStatement, [TranslationNamespace.CloudServices]);
