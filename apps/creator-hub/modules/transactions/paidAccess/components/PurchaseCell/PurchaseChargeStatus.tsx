import { RobloxPaidAccessFiatPaidAccessServiceV1PurchaseStatus as PurchaseStatus } from '@rbx/client-fiat-paid-access-service/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Label } from '@rbx/ui';
import type { TLabelProps } from '@rbx/ui';

type TLabelSeverity = NonNullable<TLabelProps['severity']>;

type PurchaseChargeStatusProps = {
  status: PurchaseStatus;
};

function PurchaseChargeStatus({ status }: PurchaseChargeStatusProps) {
  const { translate } = useTranslation();

  let statusText = '';
  let severity: TLabelSeverity = 'default';

  switch (status) {
    case PurchaseStatus.Refunded:
      statusText = translate('Label.Refund');
      severity = 'default';
      break;
    case PurchaseStatus.PurchaseSuccess:
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
}

export default PurchaseChargeStatus;
