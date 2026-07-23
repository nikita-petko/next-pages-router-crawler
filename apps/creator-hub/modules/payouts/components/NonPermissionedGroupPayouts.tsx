import { Fragment, FunctionComponent, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Chip, makeStyles } from '@rbx/ui';
import { Organization } from '@modules/clients/organizationApi';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import PayoutType from '../interface/PayoutType';
import { SupportedPayoutTypes } from '../constants/payoutsConstants';
import GroupPayoutsView from './GroupPayoutsView';
import NonPermissionedExperiencePayoutsView from './NonPermissionedExperiencePayoutsView';

const useGroupPayoutsStyles = makeStyles()(() => ({
  container: {
    width: '100%',
    height: '100%',
    '& > *:not(:last-child)': {
      marginBottom: 24,
    },
  },
  chipsContainer: {
    '& > *:not(:first-child)': {
      marginLeft: 12,
    },
  },
}));

export type NonPermissionedGroupPayoutsProps = {
  organization: Organization;
  canUseRecurringPayout: boolean;
  disabled?: boolean;
};

const NonPermissionedGroupPayouts: FunctionComponent<NonPermissionedGroupPayoutsProps> = ({
  organization,
  canUseRecurringPayout,
  disabled = false,
}) => {
  const {
    classes: { container, chipsContainer },
  } = useGroupPayoutsStyles();

  const { translate } = useTranslation();

  const [payoutType, setPayoutType] = useState<PayoutType>(PayoutType.Group);

  return (
    <Grid container className={container} wrap='wrap' alignContent='flex-start'>
      {!canUseRecurringPayout ? (
        <Grid container item XSmall={12} wrap='wrap'>
          <ErrorPage errorCode={StatusCodes.FORBIDDEN} />
        </Grid>
      ) : (
        <Fragment>
          {/* Chips */}
          <Grid container className={chipsContainer}>
            {SupportedPayoutTypes.map((supportedPayoutType: PayoutType) => (
              <Chip
                key={supportedPayoutType}
                clickable
                variant='filled'
                label={translate(`Title.${supportedPayoutType}`)}
                color={supportedPayoutType === payoutType ? 'primary' : 'secondary'}
                onClick={() => setPayoutType(supportedPayoutType)}
              />
            ))}
          </Grid>

          {/* Payout contents */}
          <Grid container>
            {payoutType === PayoutType.Group && (
              <GroupPayoutsView
                organization={organization}
                disabled={disabled || !canUseRecurringPayout}
              />
            )}

            {payoutType === PayoutType.Experiences && (
              <NonPermissionedExperiencePayoutsView
                organization={organization}
                disabled={disabled || !canUseRecurringPayout}
              />
            )}
          </Grid>
        </Fragment>
      )}
    </Grid>
  );
};

export default NonPermissionedGroupPayouts;
