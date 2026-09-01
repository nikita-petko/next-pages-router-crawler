import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Link } from '@rbx/ui';
import type { AppVersionInfo } from '@modules/clients/applicationAuthorization';

interface AppVersionInfoStatusAlertProps {
  versionInfo: AppVersionInfo;
  isBanned: boolean;
}

const AppVersionInfoStatusAlert = ({ versionInfo, isBanned }: AppVersionInfoStatusAlertProps) => {
  const { translate, translateHTML } = useTranslation();

  // App is banned
  if (isBanned) {
    return (
      <Alert severity='error' variant='standard'>
        <AlertTitle> {translate('Heading.AppBanned')} </AlertTitle>
        {translateHTML('Message.AppBanned', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link href={`https://${process.env.robloxSiteDomain}/support`} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ])}
      </Alert>
    );
  }

  // App is in review
  if (versionInfo.isInReview) {
    return (
      <Alert severity='info' variant='standard'>
        <AlertTitle> {translate('Heading.AppInReview')} </AlertTitle>
        {translate('Message.AppInReview')}
      </Alert>
    );
  }

  // if approved version number is equal to latest version number, app is approved with no unpublished changes
  if (versionInfo.lastApprovedVersionNumber === versionInfo.versionNumber) {
    return (
      <Alert severity='success' variant='standard'>
        <AlertTitle> {translate('Heading.AppApproved')} </AlertTitle>
        {translate('Message.AppApproved')}
      </Alert>
    );
  }

  // app has been approved, but there are new edits that have not been published yet.
  // we need the undefined check due to issues in how the FE interprets null values returned by the backend.
  if (
    versionInfo.lastApprovedVersionNumber !== null &&
    versionInfo.lastApprovedVersionNumber !== undefined &&
    versionInfo.lastApprovedVersionNumber !== versionInfo.versionNumber
  ) {
    return (
      <Alert severity='warning' variant='standard'>
        <AlertTitle> {translate('Heading.UnpublishedChanges')} </AlertTitle>
        {translate('Message.UnpublishedChanges')}
      </Alert>
    );
  }

  // default case is app is not public (last approved version number is null)
  return (
    <Alert severity='warning' variant='standard'>
      <AlertTitle> {translate('Heading.AppUnpublished')} </AlertTitle>
      {translate('Message.AppUnpublished')}
    </Alert>
  );
};

export default AppVersionInfoStatusAlert;
