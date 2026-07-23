import { Fragment, FunctionComponent, useState } from 'react';
import { Grid, Typography, ArrowDropDownRoundedIcon } from '@rbx/ui';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { useLocalization, Locale, useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import {
  currencyMoneyFormatter,
  currencyNumberFormatter,
  numberFormatter,
  moneyToNumber,
} from '../../../utils/formatters';
import {
  PRICE_MAX_DECIMALS,
  ResourceId,
  resourceIdToBillTranslationKeys,
  ServiceId,
  serviceIdToBillTranslationKeys,
  ServiceUsage,
} from '../../types';
import useBillingStatementServiceItemStyles from './BillingStatementServiceItem.styles';

type TBillingStatementServiceItemProps = {
  service: ServiceUsage;
};

const BillingStatementServiceItem: FunctionComponent<TBillingStatementServiceItemProps> = ({
  service,
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

  const validResources =
    service.resourceUsages?.filter(
      (resource) => resource.resourceId && isValidEnumValue(ResourceId, resource.resourceId),
    ) || [];

  const shouldCollapse = service.serviceId === ServiceId.DataStore && validResources.length > 3;

  const totalResourceCost = validResources.reduce((sum, resource) => {
    if (resource.totalCost) {
      return sum + moneyToNumber(resource.totalCost);
    }
    return sum;
  }, 0);

  const renderResources = (isInBreakdown = false) => (
    <Fragment>
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
                  resourceIdToBillTranslationKeys[resource.resourceId as ResourceId],
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
            {resource.totalCost && currencyMoneyFormatter(resource.totalCost, PRICE_MAX_DECIMALS)}
          </Typography>
        </Grid>
      ))}
    </Fragment>
  );

  return (
    <Fragment>
      <Grid container item justifyContent='space-between' alignItems='center'>
        <Typography variant='subtitle2' className={usageText}>
          {service.serviceId &&
            translate(
              translationKey(
                serviceIdToBillTranslationKeys[service.serviceId as ServiceId],
                TranslationNamespace.CloudServices,
              ),
            )}
        </Typography>
        <Grid item XSmall className={invoiceLines} />
        <Typography variant='subtitle2'>
          {service.subtotalAmount &&
            currencyMoneyFormatter(service.subtotalAmount, PRICE_MAX_DECIMALS)}
        </Typography>
      </Grid>
      {shouldCollapse ? (
        <Fragment>
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
              {currencyNumberFormatter(totalResourceCost, PRICE_MAX_DECIMALS)}
            </Typography>
          </Grid>
          {isExpanded && renderResources(true)}
        </Fragment>
      ) : (
        renderResources(false)
      )}
    </Fragment>
  );
};

export default withTranslation(BillingStatementServiceItem, [TranslationNamespace.CloudServices]);
