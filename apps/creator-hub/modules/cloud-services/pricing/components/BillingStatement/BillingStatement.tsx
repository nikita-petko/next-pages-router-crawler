import { Button, Grid, Typography } from '@rbx/ui';
import { Fragment, FunctionComponent } from 'react';
import { useLocalization, useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BillingStatementServiceItem from '../BillingStatementServiceItem/BillingStatementServiceItem';
import useBillingStatementStyles from './BillingStatement.styles';
import {
  currencyMoneyFormatter,
  currencyNumberFormatter,
  moneyToNumber,
  dateFormatter,
} from '../../../utils/formatters';
import { PRICE_MAX_DECIMALS, BillDetails, ServiceId, ServiceUsage, TaxIdType } from '../../types';
import BillingStatementAddress from '../BillingStatementAddress/BillingStatementAddress';
import BillingStatementPayments from '../BillingStatementPayments/BillingStatementPayments';

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

  const isEUCountry =
    data.billingAddress?.country && EU_COUNTRIES.includes(data.billingAddress.country);

  const handlePrint = () => {
    const printContent = document.getElementById('print-container');
    const originalContent = document.body.innerHTML;

    if (printContent) {
      document.body.innerHTML = printContent.outerHTML;
      window.print();
      document.body.innerHTML = originalContent;
    }
  };

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
        <Fragment>
          <BillingStatementAddress
            billingAddress={data.billingAddress}
            robloxAddress={data.robloxAddress}
            taxId={data.taxId}
            taxIdType={data.taxIdType as TaxIdType | null}
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
                <Typography variant='h5'>{currencyNumberFormatter(previousBalance)}</Typography>
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
                      currencyMoneyFormatter(universe.subtotalAmount, PRICE_MAX_DECIMALS)}
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
                    {translate(translationKey('Label.Taxes', TranslationNamespace.CloudServices))}
                  </Typography>
                </Grid>
                <Grid item XSmall className={invoiceLines} />
                <Grid item>
                  <Typography variant='subtitle2'>
                    {currencyMoneyFormatter(data.taxAmount)}
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
              <Typography variant='subtitle2'>
                {currencyNumberFormatter(
                  (data.totalAmount ? moneyToNumber(data.totalAmount) : 0) + (previousBalance ?? 0),
                )}
                {isPendingUsage &&
                  ` + ${translate(translationKey('Label.Taxes', TranslationNamespace.CloudServices))}`}
              </Typography>
            </Grid>
          </Grid>
          {!isPendingUsage && <BillingStatementPayments payments={data.payments} />}
        </Fragment>
      )}
    </Grid>
  );
};

export default withTranslation(BillingStatement, [TranslationNamespace.CloudServices]);
