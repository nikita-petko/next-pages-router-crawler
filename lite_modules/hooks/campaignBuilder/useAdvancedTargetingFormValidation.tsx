import { zodResolver } from '@hookform/resolvers/zod';
import { isEqual } from 'lodash';

import {
  AllAgesOption,
  AllDevicesOption,
  AllGendersOption,
  AllGenresObj,
  FormField,
  ServerAgeBucketType,
} from '@constants/advancedTargeting';
import { FlowTypes } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import useAdvancedTargetingFormSchema, {
  FormType,
} from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { ContainsAge5To12, ContainsUnder18Ages } from '@utils/advancedTargeting';

export const useAdvancedTargetingFormValidation = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const advancedTargetingFormSchema = useAdvancedTargetingFormSchema();
  const editMode = useCampaignBuilderStore((state) => state.flowType === FlowTypes.EDIT);
  const { isAge5To12TargetingEnabled } = useAppStore((state) => ({
    isAge5To12TargetingEnabled: state.appMetadataState.data.isAge5To12TargetingEnabled,
  }));
  return zodResolver<FormType, unknown, FormType>(
    advancedTargetingFormSchema
      .superRefine((data, { addIssue }) => {
        if (editMode) {
          return;
        }
        if (
          !data[FormField.UNIVERSE] ||
          !data[FormField.UNIVERSE].seventeen_plus_age_rating ||
          !(
            data[FormField.AGES]
              .map((ageOption) => ageOption.value)
              .includes(ServerAgeBucketType.AGE_BUCKET_TYPE_13_TO_17) ||
            data[FormField.AGES].some(({ label }) => label === AllAgesOption.label)
          )
        ) {
          return;
        }
        addIssue({
          code: 'custom',
          message: translate('Validation.MustTarget18Plus'),
          path: [FormField.AGES],
        });
      })
      .superRefine((data, { addIssue }) => {
        if (editMode) {
          return;
        }
        const hasGenderTargeting =
          data[FormField.GENDERS].length > 0 &&
          !isEqual(data[FormField.GENDERS], [{ ...AllGendersOption }]);
        if (hasGenderTargeting) {
          if (
            ContainsUnder18Ages(data[FormField.AGES]) &&
            !data[FormField.AGES].some((ages) => ages.isAll)
          ) {
            addIssue({
              code: 'custom',
              message: translate('Validation.GenderTargetingAgeRestriction'),
              path: [FormField.GENDERS],
            });
          }
        }
      })
      .superRefine((data, { addIssue }) => {
        if (editMode) {
          return;
        }
        const hasGenreTargeting =
          data[FormField.GENRES].length > 0 &&
          !isEqual(data[FormField.GENRES], [{ ...AllGenresObj }]);
        if (hasGenreTargeting) {
          if (
            ContainsUnder18Ages(data[FormField.AGES]) &&
            !data[FormField.AGES].some((ages) => ages.isAll)
          ) {
            addIssue({
              code: 'custom',
              message: translate('Validation.GenreTargetingAgeRestriction'),
              path: [FormField.GENRES],
            });
          }
        }
      })
      .superRefine((data, { addIssue }) => {
        if (editMode || !isAge5To12TargetingEnabled) {
          return;
        }
        if (!ContainsAge5To12(data[FormField.AGES])) {
          return;
        }
        const hasGenderTargeting =
          data[FormField.GENDERS].length > 0 &&
          !isEqual(data[FormField.GENDERS], [{ ...AllGendersOption }]);
        if (hasGenderTargeting) {
          addIssue({
            code: 'custom',
            message: translate('Validation.GenderTargetingU13Restriction'),
            path: [FormField.GENDERS],
          });
        }
      })
      .superRefine((data, { addIssue }) => {
        if (editMode || !isAge5To12TargetingEnabled) {
          return;
        }
        if (!ContainsAge5To12(data[FormField.AGES])) {
          return;
        }
        const hasDeviceTargeting =
          data[FormField.DEVICES].length > 0 &&
          !isEqual(data[FormField.DEVICES], [{ ...AllDevicesOption }]);
        if (hasDeviceTargeting) {
          addIssue({
            code: 'custom',
            message: translate('Validation.DeviceTargetingU13Restriction'),
            path: [FormField.DEVICES],
          });
        }
      }),
  );
};
