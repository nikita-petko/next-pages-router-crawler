import type { FunctionComponent } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface ExploreLicensesEmptyStateProps {
  onResetFilters?: () => void;
}

const ExploreLicensesEmptyState: FunctionComponent<ExploreLicensesEmptyStateProps> = ({
  onResetFilters,
}) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const isFilteredEmptyState = onResetFilters != null;

  const filteredEmptyStateDescription = tPendingTranslation(
    'Your applied filters returned no results. To discover more licenses, try removing some filters or starting fresh.',
    'Description text shown on the "no licenses found with applied filters" empty state on the Explore Licenses List view',
    translationKey('Description.EmptyStateLicensesWithFilters', TranslationNamespace.Licenses),
  );
  const resetFiltersLabel = tPendingTranslation(
    'Reset filters',
    'Action text shown to users when they have filters applied to their current view so that they can easily remove all actively applied filters',
    translationKey('Action.ResetFilters', TranslationNamespace.Licenses),
  );

  const emptyState = (
    <EmptyState
      size='small'
      illustration='oof'
      title={translate('Label.EmptyStateLicenses')}
      description={
        isFilteredEmptyState
          ? filteredEmptyStateDescription
          : translate('Description.EmptyStateLicenses')
      }>
      {isFilteredEmptyState && (
        <Button onClick={onResetFilters} color='primaryBrand' variant='contained'>
          {resetFiltersLabel}
        </Button>
      )}
    </EmptyState>
  );

  return (
    <div data-testid='explore-licenses-empty-state'>
      {isFilteredEmptyState ? <EmptyStateBorder>{emptyState}</EmptyStateBorder> : emptyState}
    </div>
  );
};

export default withTranslation(ExploreLicensesEmptyState, [TranslationNamespace.Licenses]);
