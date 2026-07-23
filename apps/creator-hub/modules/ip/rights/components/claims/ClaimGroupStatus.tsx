import React from 'react';
import { Badge } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const ClaimGroupStatus = ({ numPending }: { numPending: number }) => {
  const { ready, translate } = useTranslation();

  if (!ready) {
    return null;
  }
  if (numPending > 0) {
    return (
      <Badge variant='Neutral' label={`${numPending} ${translate('Label.PendingResponse')}`} />
    );
  }

  return <Badge variant='Success' label={translate('Label.AllResponded')} />;
};

export default withTranslation(ClaimGroupStatus, [TranslationNamespace.RightsPortal]);
