import { useTranslation } from '@rbx/intl';
import { Collapse, IconButton, AutorenewIcon, Typography, Grid, Button } from '@rbx/ui';
import useEditOAuthAppFormCollapsibleDrawerStyles from './EditOAuthAppFormCollapsibleDrawer.styles';
import InlineCodeRowContent from './InlineCodeRowContent';

interface EditOAuthAppFormCollapsibleDrawerProps {
  isIdSecretVisible: boolean;
  clientId: string;
  clientSecret: string;
  openRegenerateDialog: () => void;
  isBanned: boolean;
}

const EditOAuthAppFormCollapsibleDrawer = ({
  isIdSecretVisible,
  clientId,
  clientSecret,
  openRegenerateDialog,
  isBanned,
}: EditOAuthAppFormCollapsibleDrawerProps) => {
  const {
    classes: { drawer, label, labelContainer, rowContainer },
  } = useEditOAuthAppFormCollapsibleDrawerStyles();
  const { translate } = useTranslation();
  return (
    <Collapse className={drawer} in={isIdSecretVisible} collapsedSize='0'>
      <InlineCodeRowContent
        label={translate('Label.ClientId')}
        stringContent={clientId}
        copyMessage={translate('Label.Copied')}
        isCopyable
      />
      {clientSecret === '' ? (
        <Grid className={rowContainer} container alignItems='center' direction='row'>
          <Grid className={labelContainer} item>
            <Typography className={label}>{translate('Label.Secret')}</Typography>
          </Grid>
          <Grid item>
            <Button
              color='primary'
              variant='contained'
              disabled={isBanned}
              size='small'
              onClick={openRegenerateDialog}>
              {translate('Label.RegenerateSecret')}
            </Button>
          </Grid>
        </Grid>
      ) : (
        <InlineCodeRowContent
          label={translate('Label.Secret')}
          stringContent={clientSecret}
          isContentInitiallyVisible={false}
          isCopyable
          isVisibilityToggleable
          copyMessage={translate('Label.Copied')}
          extraButtons={
            clientSecret === ''
              ? [
                  <IconButton
                    aria-label={translate('Label.Secret')}
                    size='small'
                    key='regenerate'
                    disabled={isBanned}>
                    <AutorenewIcon color='secondary' onClick={openRegenerateDialog} />
                  </IconButton>,
                ]
              : undefined
          }
        />
      )}
    </Collapse>
  );
};

export default EditOAuthAppFormCollapsibleDrawer;
