import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyStateBorder, EmptyState } from '@modules/miscellaneous/common/components';

/**
 * EmptyClaimsAgainstMeView shows some text explaining that you have no claims against you
 *  */
const EmptyClaimsAgainstMeView = () => {
  const { ready, translate } = useTranslation();

  if (!ready) {
    return null;
  }

  return (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Heading.NoClaimsAgainstYou')}
        size='small'
        description={translate('Description.NoClaimsAgainstYou')}
      />
    </EmptyStateBorder>
  );
};

export default withTranslation(EmptyClaimsAgainstMeView, [TranslationNamespace.RightsPortal]);
