import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import React from 'react';

const BeginSearchState = ({ source }: { source: string }) => {
  const { translate, ready } = useTranslation();

  const title =
    source === 'avatar'
      ? translate('Heading.SearchAvatarResults')
      : translate('Heading.SearchDevelopmentResults');

  const description =
    source === 'avatar'
      ? translate('Description.SearchAvatarResults')
      : translate('Description.SearchDevelopmentResults');

  if (!ready) {
    return null;
  }
  return (
    <EmptyStateBorder>
      <EmptyState title={title} description={description} size='small' />
    </EmptyStateBorder>
  );
};

export default withTranslation(BeginSearchState, [TranslationNamespace.RightsPortal]);
