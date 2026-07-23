import { useMemo } from 'react';
import { z } from 'zod';

import { FormField } from '@constants/advancedTargeting';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const GenericAutocompleteOptionNonEmptyArray = z.array(
  z.object({
    isAll: z.boolean().optional(),
    label: z.string(),
    value: z.number(),
  }),
);

const GenreAutocompleteOptionNonEmptyArray = z.array(
  z.object({
    deprecated: z.boolean(),
    description: z.string(),
    title: z.string(),
    value: z.number(),
  }),
);

const RegionsAndLocationsFormInputObj = z.object({
  countryCode: z.string().optional(),
  label: z.string().optional(),
  nonEU: z.boolean().optional(),
  parentRegion: z.boolean().optional(),
  regionCode: z.string(),
  superGroup: z.boolean().optional(),
  title: z.string().optional(),
  value: z.number(),
});

const useAdvancedTargetingFormSchema = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);

  return useMemo(() => {
    const NonEmptyLocationTargeting = z
      .object({
        countries: z.array(RegionsAndLocationsFormInputObj),
        includesEUCountry: z.boolean().optional(),
        regions: z.array(RegionsAndLocationsFormInputObj),
      })
      .refine((data) => data.countries.length > 0 || data.regions.length > 0, {
        error: translate('Validation.SelectAtLeastOneLocation'),
      });

    return z.object({
      [FormField.AGES]: GenericAutocompleteOptionNonEmptyArray.refine((data) => data.length > 0, {
        error: translate('Validation.SelectAtLeastOneAgeRange'),
      }),
      [FormField.DEVICES]: GenericAutocompleteOptionNonEmptyArray.refine(
        (data) => data.length > 0,
        {
          error: translate('Validation.SelectAtLeastOneDeviceType'),
        },
      ),
      [FormField.GENDERS]: GenericAutocompleteOptionNonEmptyArray.refine(
        (data) => data.length > 0,
        {
          error: translate('Validation.SelectAtLeastOneGender'),
        },
      ),
      [FormField.GENRES]: GenreAutocompleteOptionNonEmptyArray.refine((data) => data.length > 0, {
        error: translate('Validation.SelectAtLeastOneGenre'),
      }),
      [FormField.LOCATIONS]: NonEmptyLocationTargeting,
      [FormField.UNIVERSE]: z
        .object({
          paid_access: z.boolean().optional(),
          seventeen_plus_age_rating: z.boolean().optional(),
          universe_id: z.number().gt(0),
          universe_name: z.string(),
        })
        .optional(),
    });
  }, [translate]);
};

export type FormType = z.infer<ReturnType<typeof useAdvancedTargetingFormSchema>>;

export default useAdvancedTargetingFormSchema;
