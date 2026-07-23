import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import React, { useMemo } from 'react';
import { AnalyticsDocLink } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Link } from '@modules/miscellaneous/common';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';

const customEventsDocLink: AnalyticsDocLink = '/docs/production/analytics/custom-events';

const makeLearnMoreLink = (chunks: React.ReactNode) => {
  return (
    <Link href={customEventsDocLink} target='_blank' underline='always' color='inherit'>
      {chunks}
    </Link>
  );
};

const CustomEventsNoEventsEmptyState = () => {
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();

  const title = useMemo(
    () => translate(translationKey('EmptyState.Title.NoEvents', TranslationNamespace.Analytics)),
    [translate],
  );
  const description = useMemo(
    () =>
      translateHTML(
        translationKey('EmptyState.Description.NoEvents', TranslationNamespace.Analytics),
        [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content: makeLearnMoreLink,
          },
        ],
      ),
    [translateHTML],
  );

  return (
    <EmptyStateBorder>
      <EmptyState title={title} description={description} size='small' illustration='chart' />
    </EmptyStateBorder>
  );
};

export default CustomEventsNoEventsEmptyState;
