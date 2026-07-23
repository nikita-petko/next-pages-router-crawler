import { withTranslation, useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Button, makeStyles, Typography } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import type { GroupConfiguration } from '../../ConfigureGroupTypes';
import useGroupOwnershipTransfer from '../../hooks/useGroupOwnershipTransfer';

type TGroupOwnershipTransferAlertProps = {
  groupConfiguration: GroupConfiguration;
};

const useStyles = makeStyles()(() => ({
  title: {
    marginBottom: 6,
  },
  container: {
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 48,
  },
}));

const GroupOwnershipTransferAlert = ({ groupConfiguration }: TGroupOwnershipTransferAlertProps) => {
  const { open, dialog, hasPendingTransfer, targetCreator } =
    useGroupOwnershipTransfer(groupConfiguration);

  const { translate, translateHTML } = useTranslation();
  const { settings } = useSettings();
  const { user } = useAuthentication();

  const { classes } = useStyles();

  const isTargetCreator = targetCreator?.creatorId === user?.id;
  if (!hasPendingTransfer || !isTargetCreator || !settings?.enableGroupOwnershipTransferV2) {
    return null;
  }

  return (
    <Alert
      className={classes.container}
      variant='standard'
      severity='info'
      action={
        <Button color='primary' onClick={() => open('Receive')}>
          {translate('Action.ViewToAccept')}
        </Button>
      }>
      <AlertTitle className={classes.title}>
        {translate('Title.RequestToOwn', { gameName: groupConfiguration.name })}
      </AlertTitle>
      <Typography>
        {translateHTML('Description.GenericRequestToOwn', [
          {
            opening: 'resourceNameStart',
            closing: 'resourceNameEnd',
            content: () => groupConfiguration.name,
          },
          {
            opening: 'resourceTypeStart',
            closing: 'resourceTypeEnd',
            content: () => translate('Label.Group'),
          },
        ])}
      </Typography>
      {dialog}
    </Alert>
  );
};

export default withTranslation(GroupOwnershipTransferAlert, [
  TranslationNamespace.OwnershipTransfer,
]);
