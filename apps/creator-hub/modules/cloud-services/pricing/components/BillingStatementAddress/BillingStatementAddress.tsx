import React, { Fragment, FunctionComponent } from 'react';
import { Grid, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { BillDetailsResponseBillingAddress as Address, TaxIdType } from '../../types';
import useBillingStatementAddressStyles from './BillingStatementAddress.styles';

export type BillingStatementAddressProps = {
  billingAddress?: Address;
  robloxAddress?: Address;
  taxId: string | null;
  taxIdType: TaxIdType | null;
};

const defaultRobloxAddress: Address = {
  name: 'Roblox Corp',
  addressLine1: '970 Park Place',
  city: 'San Mateo',
  state: 'CA',
  postalCode: '94403-1907',
};

const BillingStatementAddress: FunctionComponent<BillingStatementAddressProps> = ({
  billingAddress,
  robloxAddress = defaultRobloxAddress,
  taxId,
  taxIdType,
}) => {
  const {
    classes: { addressLines, robloxCityZip, secondaryAddressLines },
  } = useBillingStatementAddressStyles();

  const { translate } = useTranslationWrapper(useTranslation());

  return (
    <Grid container item XSmall={12}>
      <Grid item XSmall={9} container direction='column'>
        <Typography variant='h5' className={secondaryAddressLines}>
          {translate(translationKey('Label.BillTo', TranslationNamespace.CloudServices))}
        </Typography>
        {billingAddress ? (
          <Fragment>
            {billingAddress.name && (
              <Typography className={addressLines}>{billingAddress.name}</Typography>
            )}
            {billingAddress.addressLine1 && (
              <Typography className={addressLines}>{billingAddress.addressLine1}</Typography>
            )}
            {billingAddress.addressLine2 && (
              <Typography className={addressLines}>{billingAddress.addressLine2}</Typography>
            )}
            <Typography className={addressLines}>
              {`${billingAddress.city}, ${billingAddress.state}, ${billingAddress.postalCode}, ${billingAddress.country}`}
            </Typography>
            {taxId && taxIdType && (
              <Fragment>
                <Typography className={addressLines}>
                  {translate(translationKey('Label.TaxId', TranslationNamespace.CloudServices), {
                    taxId,
                  })}
                </Typography>
                <Typography className={addressLines}>
                  {translate(
                    translationKey('Label.TaxIdTypeAddress', TranslationNamespace.CloudServices),
                    { taxIdType },
                  )}
                </Typography>
              </Fragment>
            )}
          </Fragment>
        ) : null}
      </Grid>
      <Grid item XSmall={3} container direction='column' alignItems='flex-end'>
        <Typography variant='h5' className={secondaryAddressLines}>
          {translate(translationKey('Label.From', TranslationNamespace.CloudServices))}
        </Typography>
        <Typography className={addressLines}>
          {robloxAddress.name ?? defaultRobloxAddress.name}
        </Typography>
        <Typography className={addressLines}>
          {robloxAddress.addressLine1 ?? defaultRobloxAddress.addressLine1}
        </Typography>
        <Typography className={robloxCityZip}>
          {`${robloxAddress.city ?? defaultRobloxAddress.city}, ${robloxAddress.state ?? defaultRobloxAddress.state}, ${robloxAddress.postalCode ?? defaultRobloxAddress.postalCode}`}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default withTranslation(BillingStatementAddress, [TranslationNamespace.CloudServices]);
