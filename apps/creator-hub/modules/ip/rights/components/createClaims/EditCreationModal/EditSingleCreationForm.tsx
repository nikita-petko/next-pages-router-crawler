import React, { useState } from 'react';
import { Controller, FieldError, useFormContext } from 'react-hook-form';
import { Grid, MenuItem, Select, TextField, Typography, makeStyles } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  AccountAccountTypeEnum,
  ClaimItemDiscoveredFromEnum,
  ClaimItemSourceEnum,
} from '@rbx/clients/rightsV1';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Doc } from '@modules/miscellaneous/common/components/uploaders';
import useContentPermissions from '../../../hooks/useContentPermissions';
import parseUrl from '../../../helpers/parseUrl';
import parseContentUrl, { ContentURLType } from '../../../helpers/parseContentUrl';
import { ClaimRequest } from '../CreateClaimsContainer';
import { DocumentUploader } from '../../documents/DocumentForm';
import { useCurrentAccountContext } from '../../../../components/AccountProvider';

const PlaceholderCreationLink = `https://www.${process.env.robloxSiteDomain}/games/1234567891/Roblox-Game`;
const CopyrightEmail = 'copyright_agent@roblox.com';
const MaxClaimRequests = 250;

export interface SingleCreationFields {
  creationSource: ClaimItemSourceEnum;
  myCreationLink: string;
  description: string;
  documents: Doc[];
  infringingCreationsLink: string;
  discoveredFrom: ClaimItemDiscoveredFromEnum;
}

export interface AddClaimStepOneProps {
  claimRequests: ClaimRequest[];
}

const useStyles = makeStyles()(() => ({
  select: {
    width: '100%',
  },
}));

/**
 * EditSingleCreationForm presents a separate form that lets you edit a single creation
 */
const EditSingleCreationForm = ({ claimRequests }: AddClaimStepOneProps) => {
  const { ready, translate } = useTranslation();
  const contentPermissions = useContentPermissions();
  const [infCreationsErrorLines, setInfCreationsErrorLines] = useState<number[]>([]);
  const { account } = useCurrentAccountContext();
  const isOffPlatformSourceEnabled =
    account && account.accountType === AccountAccountTypeEnum.Corporate;
  const { classes: styles } = useStyles();
  const {
    control,
    formState: { errors },
    trigger,
    watch,
  } = useFormContext<SingleCreationFields>();
  const remainingClaimRequests = Math.max(0, MaxClaimRequests - claimRequests.length);

  const infringingCreationsLinkError = () => {
    if (!errors.infringingCreationsLink) return null;
    const fieldError = errors.infringingCreationsLink as unknown as FieldError;
    if (fieldError.type === 'required') {
      return translate('Error.InfringingLinksRequiredClaims', {
        limit: remainingClaimRequests.toString(),
      });
    }
    if (fieldError.type === 'count') {
      return translate('Error.InfringingLinksCount', {
        count: remainingClaimRequests.toString(),
      });
    }
    if (fieldError.type === 'format') {
      let validLinks = '';
      if (infCreationsErrorLines.length === 0) {
        validLinks = translate('Error.LinkMustBeValid');
      }
      if (infCreationsErrorLines.length > 1) {
        const linesStr = infCreationsErrorLines
          .slice(0, infCreationsErrorLines.length - 1)
          .join(', ');
        const lastLine = infCreationsErrorLines[infCreationsErrorLines.length - 1];
        validLinks = translate('Error.LinksOnLinesMustBeValid', {
          linesStr,
          lastLine: lastLine.toString(),
        });
      } else {
        validLinks = translate('Error.LinkOnLineMustBeValid', {
          line: infCreationsErrorLines[0].toString(),
        });
      }
      const unsupported = translate('Error.UnsupportedLinkType', {
        copyrightEmail: CopyrightEmail,
      });
      return `${validLinks}. ${unsupported}`;
    }
    return null;
  };

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

  if (!ready) {
    return null;
  }
  return (
    <Grid container direction='column'>
      <Grid item XSmall container spacing={3} marginBottom='40px'>
        <Grid item XSmall={12} Large={12}>
          <Typography variant='h5'>{translate('Heading.YourCreation')}</Typography>
        </Grid>
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
                  className={styles.select}
                  error={!!errors.creationSource}
                  required
                  id='typeSelect'
                  label={translate('Label.SourceOfYourCreation')}
                  onChange={(e) => {
                    field.onChange(e);
                    trigger(['myCreationLink', 'infringingCreationsLink']);
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
        {/* This is to support 60% width for normal screens, 100% width for small ones or sliding modal */}
        <Grid item XSmall={0} Large={4} />
        <Grid item XSmall={12} Large={12}>
          <Typography variant='h5'>{translate('Label.CreationsYoureClaiming')}</Typography>
        </Grid>
        <Grid item XSmall={12} Large={12}>
          <Controller
            name='infringingCreationsLink'
            control={control}
            rules={{
              validate: {
                required: (value) => value.length > 0,
                format: (value: string) => {
                  setInfCreationsErrorLines([]);
                  return parseContentUrl(value, ContentURLType.Infringing).error.length === 0;
                },
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                id='infringing-creations-link'
                data-testid='infringing-creations-link'
                label={`${translate('Label.LinkToInfringingCreation')}*`}
                autoComplete='off'
                placeholder={PlaceholderCreationLink}
                fullWidth
                error={!!errors.infringingCreationsLink}
                helperText={infringingCreationsLinkError()}
              />
            )}
          />
        </Grid>
        <Grid item XSmall={12} Large={12}>
          <Controller
            name='description'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                id='description'
                label={translate('Label.Description')}
                placeholder={translate('Description.Description')}
                fullWidth
                multiline
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />
        </Grid>
        <Grid item XSmall={0} Large={4} />
        <Grid item XSmall={12} Large={12}>
          <DocumentUploader
            translate={translate}
            maxCount={6}
            placeholder={translate('Label.DragHereToUpload')}
            acceptedMIMETypes={['application/pdf', 'image/jpeg', 'image/png']}
            required={false}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(EditSingleCreationForm, [TranslationNamespace.RightsPortal]);
