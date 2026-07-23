import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Typography,
  Link,
  Grid,
  makeStyles,
  Card,
  Button,
  TTheme,
} from '@rbx/ui';
import { resolveUrl } from '@rbx/env-utils';
import GroupFundsDetailsCard from './GroupFundsDetailsCard';

const rate35 = 3.5;
const useGroupPayoutsStyles = makeStyles()((theme: TTheme) => ({
  container: {
    width: '100%',
    gap: '20px',
  },
  darkContainer: {
    backgroundColor: theme.palette.surface[100],
    padding: '16px 16px 0px 16px',
    borderRadius: 8,
    height: '100%',
    display: 'flex',
  },
  dialogContent: {
    paddingBottom: 0,
  },
  dialog: {
    backgroundColor: theme.palette.surface[200],
  },
  dialogActions: {
    padding: '20px 20px 20px 20px',
  },
  subheaderText: {
    color: theme.palette.content.muted,
    fontSize: 12,
    paddingTop: '8px',
  },
  robuxIcon: {
    width: 16,
    height: 16,
    verticalAlign: 'sub',
    fontSize: '1rem',
    marginRight: 4,
  },
}));

export interface GroupFundsDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  groupFunds: number | null | undefined;
  rate35Robux: number | null | undefined;
}

const GroupFundsDetailsDialog: FunctionComponent<GroupFundsDetailsDialogProps> = ({
  open,
  onClose,
  groupFunds,
  rate35Robux,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { container, darkContainer, dialogContent, dialog, dialogActions, subheaderText },
  } = useGroupPayoutsStyles();

  return (
    <Dialog open={open} onClose={onClose} maxWidth='Medium' fullWidth classes={{ paper: dialog }}>
      <DialogTitle>{translate('Title.RemainingFundsAtOldRate')}</DialogTitle>
      <DialogContent className={dialogContent}>
        <Grid container direction='column' className={container}>
          <Grid item>
            <Typography variant='body2'>
              {translate('Description.DevExRateSplitExplanation')}{' '}
            </Typography>
          </Grid>
          <Card className={darkContainer}>
            <Grid container spacing={2}>
              <Grid item XSmall={6}>
                <GroupFundsDetailsCard
                  rate={undefined}
                  robuxAmount={Number(groupFunds)}
                  isLoading={!Number.isInteger(groupFunds)}
                />
              </Grid>
              <Grid item XSmall={6}>
                <GroupFundsDetailsCard
                  rate={rate35}
                  robuxAmount={Number(rate35Robux)}
                  isLoading={!Number.isInteger(rate35Robux)}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>
        <Grid item>
          <Typography variant='body2' component='p' className={subheaderText}>
            {translate('Description.AmountEarnedDisclaimer')}{' '}
            <Link
              href={resolveUrl(
                'developerExchangeHelpAndInformationPageUrl',
                process.env.targetEnvironment,
                process.env.buildTarget,
              )}
              target='_blank'
              underline='hover'>
              {translate('Action.LearnMore')}
            </Link>
          </Typography>
        </Grid>
      </DialogContent>
      <DialogActions className={dialogActions}>
        <Grid container justifyContent='flex-end'>
          <Button variant='contained' color='primaryBrand' onClick={onClose}>
            {translate('Action.Close')}
          </Button>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default GroupFundsDetailsDialog;
