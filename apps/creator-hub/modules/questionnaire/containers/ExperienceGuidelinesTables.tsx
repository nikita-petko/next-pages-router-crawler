import React, { FunctionComponent } from 'react';
import { RestrictedCountry } from '@rbx/clients/experienceQuestionnaire/v1';
import {
  V1Beta1ExperienceDescriptor as ExperienceDescriptor,
  V1Beta1CreatorOverrides as CreatorOverrides,
} from '@rbx/clients/experienceGuidelinesService';
import AgeRecommendationTable from './AgeRecommendationTable';
import RestrictionsTable from './RestrictionsTable';

interface ExperienceGuidelinesTablesProps {
  universeId: number;
  restrictedCountries: Array<RestrictedCountry>;
  ageDisplay: string | null;
  ageContentDescriptors: Array<ExperienceDescriptor>;
  creatorOverrides: CreatorOverrides | null;
  isContentMaturityEnabled: boolean;
  isIncreaseMaturityEnabled: boolean;
}

const ExperienceGuidelinesTables: FunctionComponent<
  React.PropsWithChildren<ExperienceGuidelinesTablesProps>
> = ({
  universeId,
  restrictedCountries,
  ageDisplay,
  ageContentDescriptors,
  creatorOverrides,
  isContentMaturityEnabled,
  isIncreaseMaturityEnabled,
}) => {
  return (
    <React.Fragment>
      <AgeRecommendationTable
        universeId={universeId}
        contentDescriptors={ageContentDescriptors}
        displayName={ageDisplay}
        creatorOverrides={creatorOverrides}
        isContentMaturityEnabled={isContentMaturityEnabled}
        isIncreaseMaturityEnabled={isIncreaseMaturityEnabled}
      />
      <RestrictionsTable
        restrictedCountries={restrictedCountries}
        isContentMaturityEnabled={isContentMaturityEnabled}
      />
    </React.Fragment>
  );
};
export default ExperienceGuidelinesTables;
