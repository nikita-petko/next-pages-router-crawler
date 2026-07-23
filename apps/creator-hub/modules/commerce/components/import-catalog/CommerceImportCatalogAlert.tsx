import React from 'react';
import { Alert, Button, CloseIcon, Grid, IconButton, makeStyles, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

const useAlertStyles = makeStyles()(() => ({
  root: {
    width: '100%',
  },
  action: {
    padding: 0,
  },
}));

const useAlertButtonStyles = makeStyles()((theme) => ({
  root: {
    marginTop: theme.spacing(0.25),
    marginRight: theme.spacing(1),
    textWrap: 'nowrap',
  },
}));

export interface CommerceImportCatalogAlertProps {
  onClose: () => void;
  failedCreateCommerceItemIds: string[];
  translationKeys: {
    singular: string;
    plural: string;
  };
}

const CommerceImportCatalogAlert: React.FunctionComponent<CommerceImportCatalogAlertProps> = ({
  onClose,
  failedCreateCommerceItemIds,
  translationKeys,
}) => {
  const { translate } = useTranslation();
  const { classes: alertClasses } = useAlertStyles();
  const { classes: alertButtonClasses } = useAlertButtonStyles();
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <Alert
      classes={alertClasses}
      severity='error'
      action={[
        /* eslint-disable react/jsx-key -- ordering is fixed */
        <Grid>
          <Button
            classes={alertButtonClasses}
            color='inherit'
            size='small'
            onClick={() => setShowDetails((prevShowDetails) => !prevShowDetails)}>
            {showDetails ? translate('Action.HideDetails') : translate('Action.ShowDetails')}
          </Button>
          <IconButton
            aria-label={translate('Action.Close')}
            size='small'
            color='inherit'
            onClick={onClose}>
            <CloseIcon fontSize='small' />
          </IconButton>
        </Grid>,
        /* eslint-enable react/jsx-key -- ordering is fixed */
      ]}>
      <Grid container direction='column' gap={1}>
        <Typography variant='h6'>
          {failedCreateCommerceItemIds.length > 1
            ? translate(translationKeys.plural, {
                n: failedCreateCommerceItemIds.length.toString(),
              })
            : translate('Message.CreateCommerceItemsFailure.Amazon.Singular')}
        </Typography>
        {showDetails && (
          <Typography variant='body2'>{failedCreateCommerceItemIds.join(', ')}</Typography>
        )}
      </Grid>
    </Alert>
  );
};

export default CommerceImportCatalogAlert;
