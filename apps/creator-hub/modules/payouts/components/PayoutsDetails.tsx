import React, { FunctionComponent } from 'react';
import { Grid, makeStyles } from '@rbx/ui';
import { Organization } from '@modules/clients/organizationApi';
import { PayoutsBase } from '../interface/PayoutsFormType';
import ConfigurePayoutsForm from './ConfigurePayoutsForm';
import PayoutType from '../interface/PayoutType';

const useGroupPayoutsStyles = makeStyles()(() => ({
  container: {
    padding: 12,
  },
}));

export type PayoutsDetailsProps = {
  organization: Organization;
  payouts: PayoutsBase[];
  onSave: (
    payouts: PayoutsBase[],
  ) => Promise<{ updateSucceeded: boolean; translatedErrorMessage?: string | null }>;
  payoutType: PayoutType;
  disabled?: boolean;
};

const PayoutsDetails: FunctionComponent<PayoutsDetailsProps> = ({
  organization,
  payouts,
  onSave,
  payoutType,
  disabled = false,
}) => {
  const {
    classes: { container },
  } = useGroupPayoutsStyles();

  return (
    <Grid container className={container} wrap='nowrap'>
      <ConfigurePayoutsForm
        organization={organization}
        initialPayouts={payouts}
        onSave={onSave}
        payoutType={payoutType}
        disabled={disabled}
      />
    </Grid>
  );
};

export default PayoutsDetails;
