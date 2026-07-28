import { useMemo } from 'react';
import { Button } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const recommendationServiceDocLink: AnalyticsDocLink =
  '/docs/reference/engine/classes/RecommendationService';

const RecommendationServiceEmptyState = () => {
  const { translate } = useRAQIV2TranslationDependencies();

  const title = useMemo(
    () =>
      translate(
        translationKey(
          'EmptyState.Title.RecommendationService',
          TranslationNamespace.RecommendationService,
        ),
      ),
    [translate],
  );
  const description = useMemo(
    () =>
      translate(
        translationKey(
          'EmptyState.Description.RecommendationService',
          TranslationNamespace.RecommendationService,
        ),
      ),
    [translate],
  );

  return (
    <EmptyStateBorder>
      <EmptyState title={title} description={description} size='small' illustration='chart'>
        <Button
          variant='Emphasis'
          size='Large'
          onClick={() => window.open(recommendationServiceDocLink, '_blank')}>
          {translate(
            translationKey('Action.SeeDocumentation', TranslationNamespace.RecommendationService),
          )}
        </Button>
      </EmptyState>
    </EmptyStateBorder>
  );
};

export default RecommendationServiceEmptyState;
