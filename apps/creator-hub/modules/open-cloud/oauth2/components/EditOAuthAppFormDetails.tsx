import { useState, Fragment } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Button, ExpandLessIcon, ExpandMoreIcon } from '@rbx/ui';
import EditOAuthAppFormCollapsibleDrawer from './EditOAuthAppFormCollapsibleDrawer';
import useEditOAuthAppFormHeaderStyles from './EditOAuthAppFormHeader.styles';

interface EditOAuthAppFormDetailsProps {
  openRegenerateDialog: () => void;
  updated: Date | null;
  clientId: string;
  clientSecret: string;
  isBanned: boolean;
}

const EditOAuthAppFormDetails = ({
  openRegenerateDialog,
  updated,
  clientId,
  clientSecret,
  isBanned,
}: EditOAuthAppFormDetailsProps) => {
  const {
    classes: { detailButton, label },
  } = useEditOAuthAppFormHeaderStyles();
  const { translate } = useTranslation();
  const [isIdSecretVisible, setIsIdSecretVisible] = useState<boolean>(true);
  return (
    <>
      <Grid container alignItems='center'>
        <Typography className={label} variant='largeLabel1'>
          {translate('Label.OAuthLastUpdated')}
        </Typography>
        <Typography variant='largeLabel2'>{updated?.toLocaleString()}</Typography>
        <Button
          className={detailButton}
          size='medium'
          startIcon={isIdSecretVisible ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setIsIdSecretVisible(!isIdSecretVisible)}>
          {translate('Label.OAuthMoreDetails')}
        </Button>
      </Grid>
      <EditOAuthAppFormCollapsibleDrawer
        isIdSecretVisible={isIdSecretVisible}
        clientId={clientId}
        clientSecret={clientSecret}
        openRegenerateDialog={openRegenerateDialog}
        isBanned={isBanned}
      />
    </>
  );
};

export default EditOAuthAppFormDetails;
