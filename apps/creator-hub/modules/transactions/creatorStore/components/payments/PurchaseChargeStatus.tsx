import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Label } from '@rbx/ui';

import { RobloxMarketplaceFiatSharedV1Beta1PurchaseChargeStatus as MarketplacePurchaseChargeStatus } from '@rbx/clients/marketplaceFiatService';
import type { TLabelProps } from '@rbx/ui';

type TLabelSeverity = NonNullable<TLabelProps['severity']>;

export type PurchaseChargeStatusProps = {
  status: MarketplacePurchaseChargeStatus;
};

const PurchaseChargeStatus: FunctionComponent<
  React.PropsWithChildren<PurchaseChargeStatusProps>
> = ({ status }) => {
  const { translate } = useTranslation();

  let statusText = '';
  let severity: TLabelSeverity = 'default';

  switch (status) {
    case MarketplacePurchaseChargeStatus.Chargeback:
      statusText = translate('Label.ChargeBack');
      severity = 'error';
      break;
    case MarketplacePurchaseChargeStatus.Refund:
      statusText = translate('Label.Refund');
      severity = 'default';
      break;
    case MarketplacePurchaseChargeStatus.Success:
      statusText = translate('Label.Paid');
      severity = 'success';
      break;
    default:
      statusText = translate('Label.Unknown');
      severity = 'default';
      break;
  }

  return (
    <Grid item>
      <Label labelText={statusText} severity={severity} />
    </Grid>
  );
};

export default PurchaseChargeStatus;
