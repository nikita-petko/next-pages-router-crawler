import {
  V1Beta1ExperienceDescriptor as ExperienceDescriptor,
  V1Beta1AgeRecommendationDetails as GuidelinesAgeRecommendationDetails,
  V1Beta1RestrictedCountry as EGSRestrictedCountry,
} from '@rbx/clients/experienceGuidelinesService';
import {
  AgeRecommendationDetails as PreviewAgeRecommendationDetails,
  RestrictedCountry,
} from '@rbx/clients/experienceQuestionnaire/v1';

export function extractExperienceDescriptorsFromEQSAgeRecommendation(
  ageRecommendationDetails: PreviewAgeRecommendationDetails | null,
): ExperienceDescriptor[] {
  const experienceDescriptorArray: ExperienceDescriptor[] = [];
  if (ageRecommendationDetails?.descriptorUsages != null) {
    ageRecommendationDetails.descriptorUsages.forEach((descriptorUsage) => {
      if (descriptorUsage.descriptor != null) {
        experienceDescriptorArray.push(descriptorUsage.descriptor as ExperienceDescriptor);
      }
    });
  }
  return experienceDescriptorArray;
}

export function extractExperienceDescriptorsFromEGSAgeRecommendation(
  ageRecommendationDetails: GuidelinesAgeRecommendationDetails | null,
): ExperienceDescriptor[] {
  if (ageRecommendationDetails?.experienceDescriptorUsages?.items == null) {
    return [];
  }

  // Also filters out any regional descriptors by searching for the regionalcompliance
  // dimension. This is to keep the EGS response (used on landing) consistent with the
  // EQS response (used on preview before submit).
  return ageRecommendationDetails.experienceDescriptorUsages.items
    .filter(
      (descriptorUsage) =>
        descriptorUsage.experienceDescriptor != null &&
        !descriptorUsage.experienceDescriptorDimensionUsages?.some(
          (dim) => dim.dimensionName === 'regionalcompliance',
        ),
    )
    .map((descriptorUsage) => descriptorUsage.experienceDescriptor as ExperienceDescriptor);
}

export function extractAgeDisplayNameFromEQS(
  ageRecommendationDetails: PreviewAgeRecommendationDetails | null,
): string | null {
  return ageRecommendationDetails?.summary?.ageRecommendation?.displayName || null;
}

export function extractAgeDisplayNameFromEGS(
  ageRecommendationDetails: GuidelinesAgeRecommendationDetails | null,
): string | null {
  return ageRecommendationDetails?.ageRecommendationSummary?.ageRecommendation?.displayName || null;
}

export function convertRestrictedCountries(
  egsRestrictedCountries: EGSRestrictedCountry[],
): RestrictedCountry[] {
  const result: RestrictedCountry[] = [];
  egsRestrictedCountries.forEach((country) => {
    const reasons: string[] = [];
    country.experienceDescriptorUsages?.forEach((descriptor) => {
      const restrictedCountry: RestrictedCountry = {
        countryCode: country.countryCode || '',
        reasons,
        displayCountryName: country.countryDisplayName || '',
        displayDescriptorName: descriptor.descriptorDisplayName || '',
        displayAgeRangeName: descriptor.ageRangeDisplayName || '',
      };
      result.push(restrictedCountry);
      reasons.push(descriptor.experienceDescriptor?.displayName || '');
    });
  });
  return result;
}
