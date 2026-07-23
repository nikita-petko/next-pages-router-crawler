import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { AccountAccountTypeEnum, ClaimItemSourceEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, MenuItem, Select, TextField, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import parseContentUrl, { ContentURLType } from '../../helpers/parseContentUrl';
import parseUrl from '../../helpers/parseUrl';
import useContentPermissions from '../../hooks/useContentPermissions';

const PLACEHOLDER_CREATION_LINK = `https://www.${process.env.robloxSiteDomain}/games/1234567891/Roblox-Game`;
const COPYRIGHT_EMAIL = 'copyright_agent@roblox.com';

export interface MyCreationFormFields {
  creationSource: ClaimItemSourceEnum;
  myCreationLink: string;
}

export interface MyCreationSectionProps {
  largeColumnSize?: number;
}

/**
 * MyCreationSection renders the "Your Creation" heading, creation source select,
 * and my creation link field with validation. Must be used within a FormProvider
 * whose fields extend MyCreationFormFields.
 */
const MyCreationSection = ({ largeColumnSize = 12 }: MyCreationSectionProps) => {
  const { translate } = useTranslation();
  const contentPermissions = useContentPermissions();
  const { account } = useCurrentAccountContext();
  const isOffPlatformSourceEnabled =
    account && account.accountType === AccountAccountTypeEnum.Corporate;

  const {
    control,
    formState: { errors },
    trigger,
    watch,
  } = useFormContext<MyCreationFormFields>();

  const myCreationLinkError = () => {
    if (errors.myCreationLink?.type === 'required') {
      return translate('Error.MyCreationLinkRequired');
    }
    if (errors.myCreationLink?.type === 'format') {
      const validLinks = translate('Error.LinkMustBeValid');
      const unsupported = translate('Error.UnsupportedLinkType', {
        copyrightEmail: COPYRIGHT_EMAIL,
      });

      // Circular reference is a known react-hook-form issue
      // See https://github.com/orgs/react-hook-form/discussions/7764
      return watch('creationSource') === ClaimItemSourceEnum.OutsideOfRoblox
        ? translate('Error.LinkMustBeValidUrl')
        : `${validLinks}. ${unsupported}`;
    }
    if (errors.myCreationLink?.type === 'ownership') {
      return translate('Error.LinkYourOwnContent');
    }
    return null;
  };

  return (
    <>
      <Grid item XSmall={12} Large={12}>
        <Typography variant='h5'>{translate('Heading.YourCreation')}</Typography>
      </Grid>
      {isOffPlatformSourceEnabled && (
        <Grid item XSmall={12} Large={largeColumnSize}>
          <Controller
            name='creationSource'
            control={control}
            rules={{
              validate: {
                required: (value) => !!value,
              },
            }}
            render={({ field }) => (
              <Select
                {...field}
                sx={{ width: '100%' }}
                error={!!errors.creationSource}
                required
                id='typeSelect'
                label={translate('Label.SourceOfYourCreation')}
                onChange={(e) => {
                  field.onChange(e);
                  trigger('myCreationLink');
                }}
                helperText={errors.creationSource && translate('Error.SourceCreationRequired')}>
                <MenuItem value={ClaimItemSourceEnum.OnRoblox}>
                  {translate('Label.OnRoblox')}
                </MenuItem>
                <MenuItem value={ClaimItemSourceEnum.OutsideOfRoblox}>
                  {translate('Label.OutsideOfRoblox')}
                </MenuItem>
              </Select>
            )}
          />
        </Grid>
      )}
      <Grid item XSmall={12} Large={largeColumnSize}>
        <Controller
          name='myCreationLink'
          control={control}
          rules={{
            validate: {
              required: (value) => {
                return (
                  watch('creationSource') === ClaimItemSourceEnum.OutsideOfRoblox ||
                  value.length > 0
                );
              },
              format: (value) => {
                const currentIsOffRoblox =
                  watch('creationSource') === ClaimItemSourceEnum.OutsideOfRoblox;
                return (
                  (currentIsOffRoblox && value.length === 0) ||
                  parseUrl(value) ||
                  parseContentUrl(value, ContentURLType.Original).error.length === 0
                );
              },
              ownership: async (value) => {
                const currentIsOffRoblox =
                  watch('creationSource') === ClaimItemSourceEnum.OutsideOfRoblox;
                return currentIsOffRoblox || contentPermissions.mutateAsync(value);
              },
            },
          }}
          render={({ field }) => {
            const label =
              watch('creationSource') === ClaimItemSourceEnum.OutsideOfRoblox
                ? translate('Label.LinkToYourNonRobloxCreation')
                : translate('Label.LinkToYourRobloxCreation');
            return (
              <TextField
                {...field}
                id='my-creation-link'
                data-testid='my-creation-link'
                label={label}
                placeholder={PLACEHOLDER_CREATION_LINK}
                fullWidth
                error={!!errors.myCreationLink}
                helperText={myCreationLinkError()}
              />
            );
          }}
        />
      </Grid>
    </>
  );
};

export default withTranslation(MyCreationSection, [TranslationNamespace.RightsPortal]);
