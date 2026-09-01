import { Button, Link } from '@rbx/foundation-ui';
import { ReactElement } from 'react';

import GenericNoDataPage from '@components/common/GenericNoDataPage';
import { AdsManagerDocsUrl, getGroupRolesUrl } from '@constants/groupPermissionsUrls';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const GroupPermissionDeniedPage = (): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
  const groupRolesUrl = getGroupRolesUrl();

  return (
    <GenericNoDataPage
      additionalText={translate('Description.GroupAdsManagerPermissionSetup')}
      iconName='icon-filled-lock-closed'
      primaryButton={
        <div className='flex flex-col items-center gap-medium medium:flex-row'>
          <Button
            as='a'
            href={groupRolesUrl}
            rel='noopener noreferrer'
            size='Medium'
            target='_blank'
            variant='Emphasis'>
            {translate('Action.ManageGroupRoles')}
          </Button>
          <Link
            href={AdsManagerDocsUrl}
            rel='noopener noreferrer'
            target='_blank'
            underline='always'>
            {translate('Action.LearnMoreAboutAdsManagerPermissions')}
          </Link>
        </div>
      }
      subtitle={translate('Description.GroupAdsManagerPermissionDenied')}
      title={translate('Heading.PermissionDenied')}
    />
  );
};

export default GroupPermissionDeniedPage;
