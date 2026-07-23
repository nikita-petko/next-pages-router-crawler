import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/client-games/v1';
import type { Account } from '@rbx/client-rights/v1';
import {
  AccountAccountTypeEnum,
  ClaimItemSourceEnum,
  SearchContentContentTypeEnum,
} from '@rbx/client-rights/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, MenuItem, Select, TextField } from '@rbx/ui';
import parseContentUrl, { ContentURLType } from '../../helpers/parseContentUrl';
import parseUrl from '../../helpers/parseUrl';
import useContentPermissions from '../../hooks/useContentPermissions';
import type { AddCreationsFields } from '../createClaims/AddCreationsForm/types';
import ExperienceContentTile from './ExperienceContentTile';

const PlaceholderCreationLink = `https://www.${process.env.robloxSiteDomain}/games/1234567891/Roblox-Game`;
const CopyrightEmail = 'copyright_agent@roblox.com';

export interface OriginalContentDisplayProps {
  originalContent: RobloxGamesApiModelsResponsePlaceDetails | null;
  isExperienceSearch: boolean;
  account: Account;
}

/**
 * OriginalContentDisplay either displays the preset original content for an experience search,
 * or the creation source/link fields for a normal search
 */
const OriginalContentDisplay = ({
  originalContent,
  isExperienceSearch,
  account,
}: OriginalContentDisplayProps) => {
  const { ready, translate } = useTranslation();
  const {
    control,
    formState: { errors },
    trigger,
    watch,
  } = useFormContext<AddCreationsFields>();
  const contentPermissions = useContentPermissions();
  const isOffPlatformSourceEnabled = account.accountType === AccountAccountTypeEnum.Corporate;

  const myCreationLinkError = () => {
    if (errors.myCreationLink?.type === 'required') {
      return translate('Error.MyCreationLinkRequired');
    }
    if (errors.myCreationLink?.type === 'format') {
      const validLinks = translate('Error.LinkMustBeValid');
      const unsupported = translate('Error.UnsupportedLinkType', {
        copyrightEmail: CopyrightEmail,
      });
      return watch('creationSource') === ClaimItemSourceEnum.OutsideOfRoblox
        ? translate('Error.LinkMustBeValidUrl')
        : `${validLinks}. ${unsupported}`;
    }
    if (errors.myCreationLink?.type === 'ownership') {
      return translate('Error.LinkYourOwnContent');
    }
    return null;
  };

  const showPresetContent = isExperienceSearch && originalContent !== null;

  if (!ready) {
    return null;
  }

  if (showPresetContent) {
    return (
      <Grid item XSmall={12} Large={12}>
        <ExperienceContentTile
          content={{
            contentId: originalContent?.universeRootPlaceId?.toString() ?? '',
            contentType: SearchContentContentTypeEnum.Asset,
            contentName: originalContent?.name || '',
            creator: {
              displayName: originalContent?.builder || '',
            },
          }}
          url={originalContent?.url ?? ''}
        />
      </Grid>
    );
  }

  return (
    <>
      {isOffPlatformSourceEnabled && (
        <Grid item XSmall={12} Large={12}>
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
                fullWidth
                error={!!errors.creationSource}
                required
                id='typeSelect'
                label={translate('Label.SourceOfYourCreation')}
                onChange={(e) => {
                  field.onChange(e);
                  trigger(['myCreationLink', 'infringingCreationsLinks']);
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
      <Grid item XSmall={12} Large={12}>
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
                // 'current' because it relies on the latest ref value
                const currentIsOffRoblox =
                  watch('creationSource') === ClaimItemSourceEnum.OutsideOfRoblox;
                return (
                  (currentIsOffRoblox && value.length === 0) ||
                  parseUrl(value) ||
                  parseContentUrl(value, ContentURLType.Original).error.length === 0
                );
              },
              ownership: async (value) => {
                // 'current' because it relies on the latest ref value
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
                placeholder={PlaceholderCreationLink}
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

export default OriginalContentDisplay;
