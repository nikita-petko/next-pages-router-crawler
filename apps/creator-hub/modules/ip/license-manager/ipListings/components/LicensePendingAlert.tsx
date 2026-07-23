import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, AccessTimeIcon, makeStyles } from '@rbx/ui';

const useStyles = makeStyles()(() => ({
  alert: {
    width: '100%',
    alignItems: 'flex-start',
    '& .MuiAlert-message': {
      flex: 1,
    },
    '& .MuiAlert-icon': {
      paddingTop: '4px',
      paddingBottom: 0,
    },
  },
}));

const LicensePendingAlert: React.FC = () => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  return (
    <Alert severity='info' variant='outlined' className={classes.alert} icon={<AccessTimeIcon />}>
      <AlertTitle>{translate('Label.PendingReview')}</AlertTitle>
      {translate('Description.LicensePendingReview')}
    </Alert>
  );
};

export default LicensePendingAlert;
