import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import EmptyState from '../../components/EmptyState/EmptyState';

const AccessDeniedPage: FunctionComponent<React.PropsWithChildren> = () => {
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
