import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import { useMemo } from 'react';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import LiveEventsButtonWithDialog from '../../Economy/components/LiveEventsButtonWithDialog';

const PopulatingEventsEmptyState = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const title = useMemo(
    () =>
      translate(
        translationKey('EmptyState.Title.PopulatingEvents', TranslationNamespace.Analytics),
      ),
    [translate],
  );
  const description = useMemo(
    () =>
      translate(
        translationKey('EmptyState.Description.PopulatingEvents', TranslationNamespace.Analytics),
      ),
    [translate],
  );

  return (
    <EmptyStateBorder>
      <EmptyState title={title} description={description} size='small' illustration='download'>
        <LiveEventsButtonWithDialog
          showRecordIcon={false}
          color='primaryBrand'
          size='large'
          variant='contained'
        />
      </EmptyState>
    </EmptyStateBorder>
  );
};

export default PopulatingEventsEmptyState;
