import { zodResolver } from '@hookform/resolvers/zod';
import { trim } from 'lodash';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormFields } from '@constants/account';
import { OrganizationType } from '@constants/app';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getValidateDisplayName } from '@services/ads/adAccountService';

const timezoneSchema = z.object({
  timezoneDbName: z.string(),
  title: z.string(),
  value: z.number(),
});

const countrySchema = z.object({
  title: z.string(),
  value: z.string(),
});

export type TimezoneType = z.infer<typeof timezoneSchema>;
type CountryType = z.infer<typeof countrySchema>;

const regexpForTaxIds = /^[a-zA-Z0-9-_]*$/;
const specialCharactersRegex = /^[^&<>"']*$/;
const RESTRICTED_CHARACTERS = '& < > " \'';

const noBlankInputTest = (val: string) => trim(val) !== '';

const useAdAccountSchema = (isAdAccountAutoCreateEnabled?: boolean) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  return useMemo(
    () =>
      z
        .object({
          [FormFields.BUSINESS_NAME]: z
            .string()
            .max(
              128,
              translateMisc('Validation.FieldMaxLength', {
                fieldMaxLength: '129',
                fieldName: translate('Label.BusinessName'),
              }),
            )
            .regex(
              specialCharactersRegex,
              translateMisc('Validation.SpecialCharactersNotAllowed', {
                restrictedCharacters: RESTRICTED_CHARACTERS,
              }),
            )
            .optional(),

          [FormFields.COUNTRY]: isAdAccountAutoCreateEnabled
            ? countrySchema
            : countrySchema.refine(
                (val) => val !== undefined,
                translate('Validation.LocationRequired'),
              ),

          [FormFields.FIRST_NAME]: z
            .string()
            .max(
              35,
              translateMisc('Validation.FieldMaxLength', {
                fieldMaxLength: '36',
                fieldName: translate('Label.FirstName'),
              }),
            )
            .regex(
              specialCharactersRegex,
              translateMisc('Validation.SpecialCharactersNotAllowed', {
                restrictedCharacters: RESTRICTED_CHARACTERS,
              }),
            )
            .optional(),

          [FormFields.LAST_NAME]: z
            .string()
            .max(
              35,
              translateMisc('Validation.FieldMaxLength', {
                fieldMaxLength: '36',
                fieldName: translate('Label.LastName'),
              }),
            )
            .regex(
              specialCharactersRegex,
              translateMisc('Validation.SpecialCharactersNotAllowed', {
                restrictedCharacters: RESTRICTED_CHARACTERS,
              }),
            )
            .optional(),

          [FormFields.NICKNAME]: z
            .string()
            .min(
              1,
              translateMisc('Validation.FieldRequired', {
                fieldName: translate('Label.AdAccountNickname'),
              }),
            )
            .max(
              128,
              translateMisc('Validation.FieldMaxLength', {
                fieldMaxLength: '129',
                fieldName: translate('Label.AdAccountNickname'),
              }),
            )
            .regex(
              specialCharactersRegex,
              translateMisc('Validation.SpecialCharactersNotAllowed', {
                restrictedCharacters: RESTRICTED_CHARACTERS,
              }),
            )
            .refine(noBlankInputTest, translate('Validation.DescriptiveInput')),

          [FormFields.TAX_ID]: z
            .string()
            .max(
              128,
              translateMisc('Validation.FieldMaxLength', {
                fieldMaxLength: '129',
                fieldName: translate('Label.TaxIdOptional'),
              }),
            )
            .regex(regexpForTaxIds, translate('Validation.TaxIdInvalid'))
            .optional(),

          [FormFields.TERMS_CHECKBOX]: z
            .boolean()
            .refine(
              (val) => val === true,
              translate(
                isAdAccountAutoCreateEnabled
                  ? 'Validation.TermsRequiredSetup'
                  : 'Validation.TermsRequired',
              ),
            ),

          [FormFields.TIME_ZONE]: timezoneSchema.refine(
            (val) => val !== undefined,
            translate('Validation.TimezoneRequired'),
          ),

          [FormFields.TYPE]: z.enum(OrganizationType, {
            error: (issue) =>
              issue.input === undefined
                ? translateMisc('Validation.FieldRequired', {
                    fieldName: translate('Heading.AccountType'),
                  })
                : undefined,
          }),
        })
        .superRefine(async (data, ctx) => {
          if (isAdAccountAutoCreateEnabled) {
            return;
          }

          if (data.type === OrganizationType.ORGANIZATION_TYPE_INDIVIDUAL) {
            if (!data[FormFields.FIRST_NAME] || data[FormFields.FIRST_NAME].trim() === '') {
              ctx.addIssue({
                code: 'custom',
                message: translateMisc('Validation.FieldRequired', {
                  fieldName: translate('Label.FirstName'),
                }),
                path: [FormFields.FIRST_NAME],
              });
            }

            if (!data[FormFields.LAST_NAME] || data[FormFields.LAST_NAME].trim() === '') {
              ctx.addIssue({
                code: 'custom',
                message: translateMisc('Validation.FieldRequired', {
                  fieldName: translate('Label.LastName'),
                }),
                path: [FormFields.LAST_NAME],
              });
            }
          }

          if (data.type === OrganizationType.ORGANIZATION_TYPE_BUSINESS) {
            const businessName = data[FormFields.BUSINESS_NAME];
            if (!businessName || businessName.trim() === '') {
              ctx.addIssue({
                code: 'custom',
                message: translateMisc('Validation.FieldRequired', {
                  fieldName: translate('Label.BusinessName'),
                }),
                path: [FormFields.BUSINESS_NAME],
              });
            } else {
              try {
                const { is_valid: isValid } = await getValidateDisplayName(businessName);
                if (!isValid) {
                  ctx.addIssue({
                    code: 'custom',
                    message: translate('Validation.BusinessNameCommunityStandards'),
                    path: [FormFields.BUSINESS_NAME],
                  });
                }
              } catch (_error) {
                ctx.addIssue({
                  code: 'custom',
                  message: translate('Validation.BusinessNameValidationFailed'),
                  path: [FormFields.BUSINESS_NAME],
                });
              }
            }
          }
        }),
    [translate, translateMisc, isAdAccountAutoCreateEnabled],
  );
};

export type AdAccountFormType = z.infer<ReturnType<typeof useAdAccountSchema>>;

interface UseAccountFormProps {
  defaultValues: AdAccountFormType;
  isAdAccountAutoCreateEnabled?: boolean;
}

const useAccountForm = ({ defaultValues, isAdAccountAutoCreateEnabled }: UseAccountFormProps) => {
  const schema = useAdAccountSchema(isAdAccountAutoCreateEnabled);

  const [isNicknameUserEdited, setIsNicknameUserEdited] = useState<boolean>(
    defaultValues.type === OrganizationType.ORGANIZATION_TYPE_BUSINESS
      ? defaultValues.nickname !== defaultValues.businessName
      : defaultValues.nickname !== `${defaultValues.firstName} ${defaultValues.lastName}` &&
          defaultValues.nickname !== '',
  );
  const oldNicknameValueRef = useRef<string>('');
  const form = useForm<AdAccountFormType>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(schema),
  });
  const { clearErrors, getValues, setValue, trigger } = form;

  const handleBusinessNameChange = (value: string) => {
    clearErrors(FormFields.BUSINESS_NAME);
    setValue(FormFields.BUSINESS_NAME, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    if (!isNicknameUserEdited) {
      setValue(FormFields.NICKNAME, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  const handleFirstNameChange = (value: string) => {
    setValue(FormFields.FIRST_NAME, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    if (!isNicknameUserEdited) {
      const lastName = getValues(FormFields.LAST_NAME);
      const fullName = `${value} ${lastName}`.trim();
      if (fullName) {
        setValue(FormFields.NICKNAME, fullName, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        trigger(FormFields.NICKNAME);
      }
    }
  };

  const handleLastNameChange = (value: string) => {
    setValue(FormFields.LAST_NAME, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    if (!isNicknameUserEdited) {
      const firstName = getValues(FormFields.FIRST_NAME);
      const fullName = `${firstName} ${value}`.trim();
      if (fullName) {
        setValue(FormFields.NICKNAME, fullName, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        trigger(FormFields.NICKNAME);
      }
    }
  };

  const handleNicknameChange = (value: string) => {
    const oldNickname = oldNicknameValueRef.current || '';

    if (!isNicknameUserEdited && oldNickname.trim() !== value.trim()) {
      setIsNicknameUserEdited(true);
    }

    setValue(FormFields.NICKNAME, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleCountryChange = (country: CountryType | null) => {
    if (country) {
      setValue(FormFields.COUNTRY, country, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  const handleTimeZoneChange = (timezone: TimezoneType | null) => {
    if (timezone) {
      setValue(FormFields.TIME_ZONE, timezone, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  const handleAccountTypeChange = (accountType: OrganizationType) => {
    setValue(FormFields.TYPE, accountType, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    if (accountType === OrganizationType.ORGANIZATION_TYPE_BUSINESS) {
      setIsNicknameUserEdited(
        getValues(FormFields.NICKNAME) !== getValues(FormFields.BUSINESS_NAME),
      );
    } else {
      setIsNicknameUserEdited(
        getValues(FormFields.NICKNAME) !==
          `${getValues(FormFields.FIRST_NAME)} ${getValues(FormFields.LAST_NAME)}`,
      );
    }
  };

  const handleTaxIdChange = (value: string) => {
    setValue(FormFields.TAX_ID, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return {
    form,
    handleAccountTypeChange,
    handleBusinessNameChange,
    handleCountryChange,
    handleFirstNameChange,
    handleLastNameChange,
    handleNicknameChange,
    handleTaxIdChange,
    handleTimeZoneChange,
  };
};

export default useAccountForm;
