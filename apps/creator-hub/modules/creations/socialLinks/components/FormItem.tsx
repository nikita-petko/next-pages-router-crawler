import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import type { FieldPath, ErrorOption } from 'react-hook-form';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  DeleteOutlinedIcon,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@rbx/ui';
import type { SocialLinksMetadata } from '@modules/clients/develop';
import { SocialLinkTypes } from '@modules/clients/games';
import { SocialLinkTypesPattern } from '../constants';
import SocialLinkFormErrors from '../errors';
import type { SocialLinkFormType } from '../formConfiguration';
import { maxTitleLength, maxUrlLength, SocialLinkFormRules } from '../formConfiguration';
import useTranslatedSocialLinkNames from '../hooks/useTranslatedSocialLinkNames';
import useSocialLinkConfigurationFormStyles from './SocialLinkConfigurationForm.styles';

export interface FormItemProps {
  index: number;
  linkMetadata: SocialLinksMetadata | null;
  disableDelete: boolean;
  onDelete: () => void;
  onValidateInput: () => Promise<void>;
}

const FormItem: FunctionComponent<React.PropsWithChildren<FormItemProps>> = (props) => {
  const { index, linkMetadata, disableDelete, onDelete, onValidateInput } = props;
  const { control, formState, setValue, getValues, setError, clearErrors, register } =
    useFormContext<SocialLinkFormType>();
  const { translate } = useTranslation();
  const { getTranslatedSocialLinkName } = useTranslatedSocialLinkNames();
  const {
    classes: { formField, urlField, urlFieldWithLinkTypeError, errorMessage, linkTypeErrorText },
  } = useSocialLinkConfigurationFormStyles();
  const formValue = useWatch({
    control,
    name: `socialLink.${index}`,
  });

  const urlKey: FieldPath<SocialLinkFormType> = `socialLink.${index}.url`;

  const deletionFailed = useMemo(() => {
    const error = formState.errors.socialLink?.[index] as ErrorOption | undefined;
    return error && error.type === SocialLinkFormErrors.DeletionError.toString();
  }, [formState.errors.socialLink, index]);

  const getLinkType = useCallback((url: string): SocialLinkTypes | null => {
    const typeIndex = Object.values(SocialLinkTypesPattern).findIndex((typeRegExp) =>
      typeRegExp.test(url),
    );
    if (typeIndex !== -1) {
      return SocialLinkTypes[
        Object.keys(SocialLinkTypesPattern)[typeIndex] as keyof typeof SocialLinkTypes
      ];
    }
    return null;
  }, []);

  const validateLink = useCallback(
    (linkType: SocialLinkTypes, url: string) => {
      const result = SocialLinkTypesPattern[linkType || 'default']?.test(url);
      if (!result) {
        return {
          message: translate('Error.LinkTypeUrlMismatch'),
          type: 'urlMismatch',
        };
      }
      return null;
    },
    [translate],
  );

  useEffect(() => {
    if (typeof formValue === 'undefined') {
      return;
    }
    if (!formValue.linkType && formValue.url) {
      const newLinkType = getLinkType(formValue.url);
      if (newLinkType !== null && typeof newLinkType !== 'undefined') {
        setValue(`socialLink.${index}.linkType`, newLinkType);
        onValidateInput();
      }
    }
  }, [formValue, getLinkType, index, onValidateInput, setValue]);

  useEffect(() => {
    // for register this field without showing anything
    register(`socialLink.${index}.linkId`);
  }, [index, register]);

  return (
    <Grid className={formField} container item direction='row' wrap='nowrap' XSmall={12} XLarge={6}>
      <Grid container item>
        <Grid XSmall={12} Large={4} item>
          <Controller
            name={`socialLink.${index}.linkType`}
            control={control}
            rules={{
              ...SocialLinkFormRules.linkType,
              validate: {
                linkTypeMatch: (value) => {
                  const url = getValues(urlKey);
                  if (!url) {
                    return true;
                  }
                  const err = validateLink(value as SocialLinkTypes, url);
                  if (err !== null) {
                    setError(urlKey, err);
                  } else {
                    clearErrors(urlKey);
                  }
                  return true;
                },
                [SocialLinkFormErrors.LinkTypeDuplicate]: (value) => {
                  const currentFormValue = getValues('socialLink');
                  if (!value) {
                    return true;
                  }
                  let haveDuplicate = false;
                  currentFormValue.forEach((row, cIndex) => {
                    if (cIndex === index) {
                      return;
                    }
                    if (row.linkType === value) {
                      haveDuplicate = true;
                    }
                  });
                  if (haveDuplicate) {
                    return translate('Error.DuplicateLinkType', {
                      linkType: getTranslatedSocialLinkName(value),
                    });
                  }
                  return true;
                },
              },
            }}
            render={(linkTypeProps) => (
              <Select
                {...linkTypeProps.field}
                value={linkTypeProps.field.value || ''}
                data-testid='select-link-type'
                required
                fullWidth
                margin='dense'
                size='small'
                onChange={(e) => {
                  linkTypeProps.field.onChange(e);
                  onValidateInput();
                }}
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
                }}
                label={translate('Label.LinkType')}
                InputLabelProps={{ shrink: !!linkTypeProps.field.value }}
                error={!!formState.errors.socialLink?.[index]?.linkType}>
                {Object.keys(SocialLinkTypes)
                  .filter((linkEnum) => {
                    if (linkEnum === SocialLinkTypes.Amazon) {
                      return linkMetadata?.amazonStoreLinksEnabledForUser;
                    }

                    return linkEnum !== SocialLinkTypes.GooglePlus;
                  })
                  .map((linkType) => (
                    <MenuItem key={linkType} value={linkType}>
                      {getTranslatedSocialLinkName(linkType as SocialLinkTypes)}
                    </MenuItem>
                  ))}
              </Select>
            )}
          />
        </Grid>
        {!!formState.errors.socialLink?.[index]?.linkType && (
          <Grid className={linkTypeErrorText} item XSmall={12}>
            <Typography variant='caption' color='error'>
              {formState.errors.socialLink?.[index]?.linkType?.message ?? ''}
            </Typography>
          </Grid>
        )}
        <Grid item XSmall={12}>
          <Controller
            name={urlKey}
            rules={{
              ...SocialLinkFormRules.url,
              validate: (value) => {
                const linkType = getValues(`socialLink.${index}.linkType`);
                const err = validateLink(linkType as SocialLinkTypes, value as string);
                if (err !== null) {
                  return err.message;
                }
                return true;
              },
            }}
            render={(urlProps) => {
              const urlErrorMessage = urlProps.fieldState.error;
              return (
                <TextField
                  {...urlProps.field}
                  className={
                    formState.errors.socialLink?.[index]?.linkType
                      ? urlFieldWithLinkTypeError
                      : urlField
                  }
                  fullWidth
                  required
                  id='url'
                  label={translate('Label.URL')}
                  margin='dense'
                  size='small'
                  multiline
                  error={typeof urlErrorMessage !== 'undefined'}
                  helperText={
                    urlErrorMessage?.message
                      ? urlErrorMessage.message
                      : translate('Label.CharacterLimit', {
                          number: maxUrlLength.toString(),
                        })
                  }
                />
              );
            }}
          />
        </Grid>
        <Grid item XSmall={12}>
          <Controller
            name={`socialLink.${index}.title`}
            control={control}
            rules={SocialLinkFormRules.title}
            render={(titleProps) => {
              const titleErrorMessage = titleProps.fieldState.error;
              return (
                <TextField
                  {...titleProps.field}
                  fullWidth
                  required
                  id='title'
                  label={translate('Label.Title')}
                  margin='dense'
                  size='small'
                  multiline
                  error={titleErrorMessage !== undefined}
                  helperText={
                    titleErrorMessage?.message
                      ? titleErrorMessage.message
                      : translate('Label.CharacterLimit', {
                          number: maxTitleLength.toString(),
                        })
                  }
                />
              );
            }}
          />
        </Grid>
        {deletionFailed && (
          <Grid item XSmall={12}>
            <Typography className={errorMessage} component='p' variant='smallLabel2' color='error'>
              {translate('Error.FailedToDeleteLink')}
            </Typography>
          </Grid>
        )}
      </Grid>
      <Grid item>
        <IconButton
          data-testid='delete-social-link'
          aria-label='delete social link'
          color='secondary'
          disabled={disableDelete}
          onClick={onDelete}
          size='large'>
          <DeleteOutlinedIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
};

export default FormItem;
