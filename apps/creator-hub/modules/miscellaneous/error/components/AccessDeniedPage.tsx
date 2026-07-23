import React, { FunctionComponent } from 'react';
import { EmptyState } from '@modules/miscellaneous/common/components';
import { useTranslation } from '@rbx/intl';

const AccessDeniedPage: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();

  return (
    <EmptyState
      size='large'
      illustration='noPermissions'
      title={translate('Description.AccessDenied')}
      description={translate('Label.AccessDenied')}
    />
  );
};

export default AccessDeniedPage;
