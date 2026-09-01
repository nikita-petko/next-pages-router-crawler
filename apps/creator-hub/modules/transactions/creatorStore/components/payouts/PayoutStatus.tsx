import type { FunctionComponent } from 'react';
import React from 'react';
import { RobloxPaymentsSharedV1PayoutStatus as PayoutStatusTypes } from '@rbx/client-marketplace-fiat-service/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Label } from '@rbx/ui';
import type { TLabelProps } from '@rbx/ui';

type TLabelSeverity = NonNullable<TLabelProps['severity']>;

export type PayoutStatusProps = {
  status: PayoutStatusTypes;
};

const PayoutStatus: FunctionComponent<React.PropsWithChildren<PayoutStatusProps>> = ({
  status,
}) => {
  const { translate } = useTranslation();

  let statusText = '';
  let severity: TLabelSeverity = 'default';

  switch (status) {
    case PayoutStatusTypes.Pending:
      statusText = translate('Label.Pending');
      severity = 'info';
      break;
    case PayoutStatusTypes.Succeeded:
      statusText = translate('Label.Paid');
      severity = 'success';
      break;
    case PayoutStatusTypes.Failed:
      statusText = translate('Label.Failed');
      severity = 'error';
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

export default PayoutStatus;
