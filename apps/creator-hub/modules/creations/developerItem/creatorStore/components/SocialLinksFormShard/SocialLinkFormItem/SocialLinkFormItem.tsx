import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { Grid, MenuItem, Select, TextField } from '@rbx/ui';
import { Controller, FieldPath, useFormContext } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';
import {
  MAX_TITLE_LENGTH,
  MAX_URI_LENGTH,
  SocialLinkFormRules,
  SocialLinkType,
  SocialLinkTypeToRegexPattern,
  SocialLinkTypeToTranslatedText,
} from '../../../hooks/useSocialLinks';
import useSocialLinkFormItemStyles from './SocialLinkFormItem.styles';
import { CreatorStoreConfigurationType } from '../../CreatorStoreConfiguration/CreatorStoreConfiguration';

const DEBOUNCED_VALIDATION_DELAY_MS = 100;

export interface SocialLinkFormItemProps {
  index: number;
  triggerLinkTypeValidation: () => Promise<void>;
  socialLinkTypeToTranslatedText: SocialLinkTypeToTranslatedText;
}

const SocialLinkFormItem: FunctionComponent<SocialLinkFormItemProps> = ({
  index,
  triggerLinkTypeValidation,
  socialLinkTypeToTranslatedText,
}) => {
  const typeKey: FieldPath<CreatorStoreConfigurationType> = `socialLinks.${index}.type`;
  const uriKey: FieldPath<CreatorStoreConfigurationType> = `socialLinks.${index}.uri`;
  const titleKey: FieldPath<CreatorStoreConfigurationType> = `socialLinks.${index}.title`;

  const { control, getValues, setValue, setError, clearErrors, trigger } =
    useFormContext<CreatorStoreConfigurationType>();
  const { translate } = useTranslation();
  const { frontendFlags } = useToolboxServiceApiProvider();
  const {
    classes: { formContainer, urlField },
  } = useSocialLinkFormItemStyles();

  /*
   * We check if the URI isn't empty to avoid initially showing validation
   * errors for existing links, prior to the useEffect running (as would occur
   * if this was defaulted to false).
   *
   * And we do not just default to true as we want to show validation errors for empty URIs.
   */
  const [isUriValid, setIsUriValid] = useState(getValues(uriKey) !== '');

  const linkTypeUriMismatchError = useMemo<{ message: string; type: string }>(
    () => ({
      message: translate('Error.SocialLinkTypeUriMismatch'),
      type: 'socialLinkTypeUriMismatch',
    }),
    [translate],
  );

  /*
   * We have debounced and non-debounced versions of this validation.
   * Changes to the URI use the debounced version so validation is not fired off every keypress.
   * Changes to the link type use the non-debounced version as this event is less frequent and not spammable.
   */
  const validateUri = useCallback(
    (uri: string, linkType: SocialLinkType) => {
      const linkTypeRegex = SocialLinkTypeToRegexPattern[linkType];
      const isValid = linkTypeRegex.test(uri);
      setIsUriValid(isValid);
      if (isValid) {
        clearErrors(uriKey);
      } else {
        setError(uriKey, linkTypeUriMismatchError);
      }
    },
    [clearErrors, linkTypeUriMismatchError, setError, uriKey],
  );
  const [validateUriDebounced] = useDebouncedFunction(validateUri, DEBOUNCED_VALIDATION_DELAY_MS);

  useEffect(() => {
    // Trigger validation whenever debounced isUriValid changes
    trigger(uriKey);
  }, [isUriValid, trigger, uriKey]);

  return (
    <Grid
      container
      item
      data-testid='social-link-form-item'
      XSmall={12}
      classes={{ root: formContainer }}>
      <Grid item XSmall={12}>
        <Controller
          control={control}
          name={typeKey}
          rules={{
            ...SocialLinkFormRules.type,
            validate: {
              linkTypeMatch: (value) => {
                const uri = getValues(uriKey);
                if (!uri) {
                  return true;
                }
                // Checks if the URI matches the new link type
                // Use the non-debounced validation as these are less-frequent changes
                validateUri(uri as string, value as SocialLinkType);
                // Uri validation issue is surfaced alongside URI field
                // The link type, itself, will not be marked as invalid
                return true;
              },
              duplicateLinkTypes: (value) => {
                const currentSocialLinks = getValues('socialLinks');
                if (!value) {
                  return true;
                }
                let haveDuplicate = false;
                currentSocialLinks.forEach((socialLink, socialLinkIndex) => {
                  // Skip the current Social Link's type from being evaluated against itself
                  if (socialLinkIndex === index) {
                    return;
                  }
                  // Determine if the current Social Link's type is the same as another Social Link's type
                  if (socialLink.type === value) {
                    haveDuplicate = true;
                  }
                });
                if (haveDuplicate) {
                  return translate('Error.DuplicateSocialLinkType');
                }
                return true;
              },
            },
          }}
          render={(linkTypeProps) => {
            const linkTypeErrorMessage = linkTypeProps.fieldState.error;
            return (
              <Select
                {...linkTypeProps.field}
                fullWidth
                required
                data-testid='select-link-type'
                margin='dense'
                size='small'
                error={linkTypeErrorMessage !== undefined}
                helperText={linkTypeErrorMessage?.message}
                label={translate('Label.SocialLinkType')}
                onChange={(e) => {
                  linkTypeProps.field.onChange(e);
                  triggerLinkTypeValidation();
                }}
                InputLabelProps={{ shrink: !!linkTypeProps.field.value }}
                SelectProps={{
                  MenuProps: {
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'center',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'center',
                    },
                  },
                }}>
                {Object.values(SocialLinkType).map((linkType) => (
                  <MenuItem key={linkType} value={linkType}>
                    {socialLinkTypeToTranslatedText[linkType].displayName}
                  </MenuItem>
                ))}
              </Select>
            );
          }}
        />
      </Grid>
      <Grid item XSmall={12}>
        <Controller
          control={control}
          name={uriKey}
          rules={{
            ...SocialLinkFormRules.uri,
            validate: (value) => {
              if (!value) {
                return false;
              }
              if (!isUriValid) {
                return linkTypeUriMismatchError.message;
              }
              return true;
            },
          }}
          render={(uriProps) => {
            const currentLinkType = getValues(typeKey) ?? SocialLinkType.ROBLOX;
            const { helperText, placeholderText } = socialLinkTypeToTranslatedText[currentLinkType];
            return (
              <TextField
                {...uriProps.field}
                fullWidth
                required
                data-testid='uri-text-field'
                id='uri'
                margin='dense'
                size='small'
                error={!isUriValid}
                helperText={
                  !isUriValid ? `${helperText} - ${linkTypeUriMismatchError.message}` : helperText
                }
                inputProps={{ maxLength: MAX_URI_LENGTH }}
                label={translate('Label.SocialLinkUri')}
                placeholder={placeholderText}
                classes={{ root: urlField }}
                onChange={(e) => {
                  const latestUri = e.target.value;
                  setValue(uriKey, latestUri, { shouldDirty: true });
                  // Use the debounced validation as these are more-frequent changes
                  validateUriDebounced(latestUri, currentLinkType);
                }}
              />
            );
          }}
        />
      </Grid>
      <Grid
        item
        XSmall={12}
        hidden={!frontendFlags[FrontendFlagName.FrontendFlagEnableSocialLinkCustomTitles]}>
        <Controller
          control={control}
          name={titleKey}
          rules={SocialLinkFormRules.title}
          render={(titleProps) => {
            const titleErrorMessage = titleProps.fieldState.error;
            return (
              <TextField
                {...titleProps.field}
                fullWidth
                data-testid='title-text-field'
                id='title'
                margin='dense'
                size='small'
                error={titleErrorMessage !== undefined}
                helperText={
                  titleErrorMessage?.message ??
                  translate('Label.CharacterLimit', {
                    number: MAX_TITLE_LENGTH.toString(),
                  })
                }
                inputProps={{
                  maxLength: MAX_TITLE_LENGTH,
                }}
                label={translate('Label.Title')}
              />
            );
          }}
        />
      </Grid>
    </Grid>
  );
};

export default SocialLinkFormItem;
