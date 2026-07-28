import type { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const ExploreLicensesEmptyState: FunctionComponent = () => {
  const { translate } = useTranslation();

  return (
    <div data-testid='explore-licenses-empty-state'>
      <EmptyState
        size='small'
        illustration='oof'
        title={translate('Label.EmptyStateLicenses')}
        description={translate('Description.EmptyStateLicenses')}
      />
    </div>
  );
};

export default withTranslation(ExploreLicensesEmptyState, [TranslationNamespace.Licenses]);
