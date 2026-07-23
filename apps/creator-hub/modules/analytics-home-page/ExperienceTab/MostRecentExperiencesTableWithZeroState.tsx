import type { FC } from 'react';
import React from 'react';
import { Surface } from '@rbx/client-universes-api/v1';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ZeroState from '@modules/experience-analytics-shared/components/ZeroState';
import useOwner from '@modules/experience-analytics-shared/context/useOwner';
import usePaginatedSearchUniverses from '@modules/experience-analytics-shared/hooks/usePaginatedSearchUniverses';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import MostRecentExperiencesTableV2 from '@modules/experience-analytics/components/MostRecentExperiencesTableV2';
import { EStudioTaskType, useStudio } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const MostRecentExperiencesTableWithZeroState: FC = () => {
  const { translate } = useRAQIV2TranslationDependencies();
  const owner = useOwner();
  const { open, dialog } = useStudio();

  const { data: anyExperience } = usePaginatedSearchUniverses({
    owner,
    pageSizeOptions: [1],
    defaultPageSize: 1,
    surface: Surface.CreatorHubAnalytics,
  });

  if (anyExperience?.totalResults) {
    return <MostRecentExperiencesTableV2 />;
  }

  return (
    <>
      <ZeroState
        heading={translate(
          translationKey('Heading.ExperienceZeroState', TranslationNamespace.Analytics),
        )}
        description={translate(
          translationKey('Description.ExperienceZeroState', TranslationNamespace.Analytics),
        )}
        buttonContent={translate(
          translationKey('Action.ExperienceZeroState', TranslationNamespace.Analytics),
        )}
        buttonAction={{
          onClick: () => open({ task: EStudioTaskType.Default }),
        }}
        imageSrc={`${process.env.assetPathPrefix}/analytics/ExperienceZeroState.png`}
      />
      {dialog}
    </>
  );
};

export default MostRecentExperiencesTableWithZeroState;
