import type { FunctionComponent } from 'react';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useLeaderboardCreateAction } from '../../queries/useLeaderboardCreateAction';
import { LEADERBOARD_LEARN_MORE_URL } from '../../types';
import LeaderboardFormSheet from '../LeaderboardFormSheet/LeaderboardFormSheet';

const ILLUSTRATION = 'leaderboard' as const;

const LeaderboardEmptyState: FunctionComponent = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { isOpen, open, close, formSheetProps } = useLeaderboardCreateAction();

  const heading = translate(
    translationKey('Label.NoLeaderboards', TranslationNamespace.Leaderboards),
  );
  const descriptionLead = translate(
    translationKey('Description.ConfigureLeaderboard', TranslationNamespace.Leaderboards),
  );
  const learnMoreLabel = translate(
    translationKey('Action.LearnMore', TranslationNamespace.Leaderboards),
  );
  const createLabel = translate(translationKey('Action.Create', TranslationNamespace.Leaderboards));

  const description = (
    <>
      {descriptionLead}{' '}
      <a href={LEADERBOARD_LEARN_MORE_URL} target='_blank' rel='noopener noreferrer'>
        {learnMoreLabel}
      </a>
    </>
  );

  return (
    <>
      <EmptyState title={heading} description={description} illustration={ILLUSTRATION}>
        <Button variant='Emphasis' size='Medium' onClick={open}>
          {createLabel}
        </Button>
      </EmptyState>
      {isOpen && (
        <LeaderboardFormSheet
          mode='create'
          onClose={close}
          config={undefined}
          {...formSheetProps}
        />
      )}
    </>
  );
};

export default LeaderboardEmptyState;
