import React from 'react';
import { EmptyState } from '@modules/miscellaneous/common/components';
import { useTranslation } from '@rbx/intl';

export default function AccessDeniedAgeOrReasonPage() {
  const { translate } = useTranslation();
  return (
    <EmptyState
      size='large'
      illustration='noPermissions'
      title={translate('Description.AccessDeniedAgeOrRegion')}
      description={translate('Label.AccessDeniedAgeOrRegion')}
    />
  );
}
