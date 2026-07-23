import React, { FC } from 'react';
import {
  ZeroState,
  useOwner,
  usePaginatedSearchUniverses,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EStudioTaskType, useStudio } from '@modules/miscellaneous/hooks';
import MostRecentExperiencesTableV2 from '@modules/experience-analytics/components/MostRecentExperiencesTableV2';
import { Surface } from '@rbx/clients/universesApi';

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
    <React.Fragment>
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
    </React.Fragment>
  );
};

export default MostRecentExperiencesTableWithZeroState;
