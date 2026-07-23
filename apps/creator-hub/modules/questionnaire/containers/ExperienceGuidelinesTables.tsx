import type { FunctionComponent } from 'react';
import React from 'react';
import type {
  V1Beta1ExperienceDescriptor as ExperienceDescriptor,
  V1Beta1CreatorOverrides as CreatorOverrides,
} from '@rbx/client-experience-guidelines-service/v1';
import type { RestrictedCountry } from '@rbx/client-experience-questionnaire/v1';
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
    <>
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
    </>
  );
};
export default ExperienceGuidelinesTables;
