import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import React, { FunctionComponent } from 'react';

const SearchEmptyState: FunctionComponent = () => {
  const { translate, ready } = useTranslation();

  if (!ready) {
    return null;
  }
  return (
    <EmptyStateBorder>
      <EmptyState
        title={translate('Heading.NoResults')}
        description={translate('Description.NoResults')}
        size='small'
        illustration='oof'
      />
    </EmptyStateBorder>
  );
};

export default withTranslation(SearchEmptyState, [TranslationNamespace.RightsPortal]);
