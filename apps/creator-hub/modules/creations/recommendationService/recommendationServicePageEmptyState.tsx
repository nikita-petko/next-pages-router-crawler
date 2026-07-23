import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import React, { useMemo } from 'react';
import { AnalyticsDocLink } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import { Button } from '@rbx/foundation-ui';

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
