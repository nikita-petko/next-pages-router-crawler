import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, RobuxIcon, Grid, makeStyles, Skeleton } from '@rbx/ui';

const useStyles = makeStyles()(() => ({
  robuxIcon: {
    width: 24,
    height: 24,
    verticalAlign: 'sub',
    fontSize: '1rem',
    marginRight: 4,
  },
}));

export interface GroupFundsDetailsCardProps {
  rate: number | undefined;
  robuxAmount: number;
  isLoading?: boolean;
}

const GroupFundsDetailsCard: FunctionComponent<GroupFundsDetailsCardProps> = ({
  rate,
  robuxAmount,
  isLoading = false,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { robuxIcon },
  } = useStyles();

  return (
    <Grid container direction='column' spacing={1}>
      <Grid item>
        {rate ? (
          <Grid>
            <Typography variant='captionHeader' color='secondary'>
              {`${translate('Label.EarnedAt')} `}
            </Typography>
          </Grid>
        ) : (
          <Typography variant='captionHeader' color='secondary'>
            {`${translate('Title.GroupFunds')} `}
          </Typography>
        )}
      </Grid>
      <Grid item>
        <Grid container alignItems='center' spacing={0.25}>
          <RobuxIcon className={robuxIcon} />
          {!isLoading ? (
            <Typography variant='h2'>{robuxAmount.toLocaleString()}</Typography>
          ) : (
            <Skeleton animate variant='text' width={24} height={24} />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default GroupFundsDetailsCard;
