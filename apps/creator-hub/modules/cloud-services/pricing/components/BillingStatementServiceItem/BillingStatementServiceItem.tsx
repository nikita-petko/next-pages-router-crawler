import type { FunctionComponent } from 'react';
import { useState } from 'react';
import { useLocalization, Locale, useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography, ArrowDropDownRoundedIcon } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { formatLocalCurrency } from '../../../utils/countryCurrency';
import {
  currencyMoneyFormatter,
  currencyNumberFormatter,
  numberFormatter,
  moneyToNumber,
} from '../../../utils/formatters';
import type { ServiceUsage } from '../../types';
import {
  PRICE_MAX_DECIMALS,
  ResourceId,
  resourceIdToBillTranslationKeys,
  ServiceId,
  serviceIdToBillTranslationKeys,
} from '../../types';
import useBillingStatementServiceItemStyles from './BillingStatementServiceItem.styles';

type TBillingStatementServiceItemProps = {
  service: ServiceUsage;
  /** When set, all Money amounts are shown in local currency using this rate (USD → local). */
  conversionRate?: number | null;
  localCurrencyCode?: string | null;
};

const BillingStatementServiceItem: FunctionComponent<TBillingStatementServiceItemProps> = ({
  service,
  conversionRate,
  localCurrencyCode,
}) => {
  const {
    classes: {
      usageText,
      invoiceLines,
      costBreakdownHeader,
      costBreakdownResource,
      expandedIcon,
      collapsedIcon,
    },
  } = useBillingStatementServiceItemStyles();
  const { locale } = useLocalization();
  const { translate } = useTranslationWrapper(useTranslation());
  const [isExpanded, setIsExpanded] = useState(false);

  // Formats a USD amount in local currency when a valid rate is available, otherwise falls back to
  // the standard USD formatter.
  const localFormatMoney = (
    money: Parameters<typeof currencyMoneyFormatter>[0],
    decimals?: number,
  ): string =>
    conversionRate != null && localCurrencyCode
      ? (formatLocalCurrency(moneyToNumber(money) * conversionRate, localCurrencyCode, locale) ??
        currencyMoneyFormatter(money, decimals))
      : currencyMoneyFormatter(money, decimals);

  const localFormatNumber = (amount: number, decimals?: number): string =>
    conversionRate != null && localCurrencyCode
      ? (formatLocalCurrency(amount * conversionRate, localCurrencyCode, locale) ??
        currencyNumberFormatter(amount, decimals))
      : currencyNumberFormatter(amount, decimals);

  const validResources =
    service.resourceUsages?.filter(
      (resource): resource is typeof resource & { resourceId: ResourceId } =>
        !!resource.resourceId && isValidEnumValue(ResourceId, resource.resourceId),
    ) || [];

  const serviceId = isValidEnumValue(ServiceId, service.serviceId) ? service.serviceId : null;
  const shouldCollapse = serviceId === ServiceId.DataStore && validResources.length > 3;

  const totalResourceCost = validResources.reduce((sum, resource) => {
    if (resource.totalCost) {
      return sum + moneyToNumber(resource.totalCost);
    }
    return sum;
  }, 0);

  const renderResources = (isInBreakdown = false) => (
    <>
      {validResources.map((resource) => (
        <Grid
          data-testid={resource.resourceId}
          container
          item
          key={`resource-usage-${resource.resourceId}`}
          justifyContent='space-between'
          alignItems='center'>
          <Typography
            variant='body2'
            className={isInBreakdown ? costBreakdownResource : usageText}
            data-testid={`${resource.resourceId}-description`}>
            {typeof resource.paidAmount !== 'undefined' &&
              resource.unitCost &&
              resource.resourceId &&
              translate(
                translationKey(
                  resourceIdToBillTranslationKeys[resource.resourceId],
                  TranslationNamespace.CloudServices,
                ),
                {
                  amount: resource.paidAmount.toLocaleString(locale ?? Locale.English),
                  unitCost: resource.unitCost
                    ? currencyMoneyFormatter(
                        resource.price.cost ?? resource.unitCost,
                        PRICE_MAX_DECIMALS,
                      )
                    : '--',
                  unitAmount: numberFormatter(resource.price.unitAmount ?? 1),
                },
              )}
          </Typography>
          <Grid item XSmall className={invoiceLines} />
          <Typography variant='body2'>
            {resource.totalCost && localFormatMoney(resource.totalCost, PRICE_MAX_DECIMALS)}
          </Typography>
        </Grid>
      ))}
    </>
  );

  return (
    <>
      <Grid container item justifyContent='space-between' alignItems='center'>
        <Typography variant='subtitle2' className={usageText}>
          {serviceId &&
            translate(
              translationKey(
                serviceIdToBillTranslationKeys[serviceId],
                TranslationNamespace.CloudServices,
              ),
            )}
        </Typography>
        <Grid item XSmall className={invoiceLines} />
        <Typography variant='subtitle2'>
          {service.subtotalAmount && localFormatMoney(service.subtotalAmount, PRICE_MAX_DECIMALS)}
        </Typography>
      </Grid>
      {shouldCollapse ? (
        <>
          <Grid
            container
            item
            className={costBreakdownHeader}
            onClick={() => setIsExpanded(!isExpanded)}
            justifyContent='space-between'
            alignItems='center'>
            <Typography variant='body2' className={usageText} style={{ fontWeight: 500 }}>
              {translate(translationKey('Label.CostBreakdown', TranslationNamespace.CloudServices))}
              <ArrowDropDownRoundedIcon
                className={isExpanded ? expandedIcon : collapsedIcon}
                style={{ fontSize: 20, verticalAlign: 'middle', marginLeft: 4 }}
              />
            </Typography>
            <Grid item XSmall className={invoiceLines} />
            <Typography variant='body2'>
              {localFormatNumber(totalResourceCost, PRICE_MAX_DECIMALS)}
            </Typography>
          </Grid>
          {isExpanded && renderResources(true)}
        </>
      ) : (
        renderResources(false)
      )}
    </>
  );
};

export default withTranslation(BillingStatementServiceItem, [TranslationNamespace.CloudServices]);
