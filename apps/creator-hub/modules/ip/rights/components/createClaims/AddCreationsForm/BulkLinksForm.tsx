import { useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { AccountAccountTypeEnum, ClaimItemSourceEnum } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, MenuItem, Select, TextField, Typography, makeStyles } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentAccountContext } from '../../../../components/AccountProvider';
import type { ParsedContentUrl } from '../../../helpers/parseContentUrl';
import parseContentUrl, {
  ContentUrlDuplicateError,
  ContentURLType,
} from '../../../helpers/parseContentUrl';
import parseUrl from '../../../helpers/parseUrl';
import useContentPermissions from '../../../hooks/useContentPermissions';
import type { ClaimRequest } from '../../../types/types';
import ControlledDescription from '../../common/ControlledDescription';
import MultiLinkField from '../../createRemovalRequest/MultiLinkField';
import { DocumentUploader } from '../../documents/DocumentForm';
import { COPYRIGHT_EMAIL, MAX_CLAIM_REQUESTS, PLACEHOLDER_CREATION_LINK } from './constants';
import type { AddCreationsFields } from './types';

export interface AddClaimStepOneProps {
  claimRequests: Array<ClaimRequest>;
  invalidIds: number[];
}

const useStyles = makeStyles()(() => ({
  select: {
    width: '100%',
  },
}));

/**
 * BulkLinksForm presents a form that primarily lets you enter all the links for creations.
 */
const BulkLinksForm = ({ claimRequests, invalidIds }: AddClaimStepOneProps) => {
  const { ready, translate } = useTranslation();
  const contentPermissions = useContentPermissions();
  const [infCreationsErrorLines, setInfCreationsErrorLines] = useState<number[]>([]);
  const [infCreationsDuplicateLines, setInfCreationsDuplicateLines] = useState<number[]>([]);
  const parsedInfringingCreationsLinks = useRef<ParsedContentUrl[]>([]);
  const { account } = useCurrentAccountContext();
  const isOffPlatformSourceEnabled =
    account && account.accountType === AccountAccountTypeEnum.Corporate;

  const { classes: styles } = useStyles();
  const {
    control,
    formState: { errors },
    trigger,
    watch,
  } = useFormContext<AddCreationsFields>();
  const remainingClaimRequests = Math.max(0, MAX_CLAIM_REQUESTS - claimRequests.length);

  const infringingCreationsLinksError = () => {
    if (!errors.infringingCreationsLinks || Array.isArray(errors.infringingCreationsLinks)) {
      return null;
    }
    const { type } = errors.infringingCreationsLinks;
    if (type === 'selfOwned') {
      return translate('Error.ReportOwnContent');
    }
    if (type === 'required') {
      return translate('Error.InfringingLinksRequiredClaims', {
        limit: remainingClaimRequests.toString(),
      });
    }
    if (type === 'count') {
      return translate('Error.InfringingLinksCount', {
        count: remainingClaimRequests.toString(),
      });
    }
    if (type === 'format') {
      let validLinks = '';
      if (infCreationsErrorLines.length === 0) {
        validLinks = translate('Error.LinkMustBeValid');
        // Only check for duplicates if there are no other errors
        if (infCreationsDuplicateLines.length > 0) {
          const linesStr = infCreationsDuplicateLines
            .slice(0, infCreationsDuplicateLines.length - 1)
            .join(', ');
          const lastLine = infCreationsDuplicateLines[infCreationsDuplicateLines.length - 1];
          validLinks = translate('Error.LinksOnLinesMustBeUnique', {
            linesStr,
            lastLine: lastLine.toString(),
          });
        }
      } else if (infCreationsErrorLines.length > 1) {
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
        copyrightEmail: COPYRIGHT_EMAIL,
      });
      return `${validLinks}. ${unsupported}`;
    }
    return null;
  };

  const infringingCreationIdsError = () => {
    if (invalidIds.length > 0) {
      let invalidContents = '';
      if (invalidIds.length === 1) {
        invalidContents = translate('Error.ContentMustBeValid', { id: invalidIds[0].toString() });
      } else if (invalidIds.length > 1) {
        const allButLastIds = invalidIds.slice(0, invalidIds.length - 1).join(', ');
        const lastId = invalidIds[invalidIds.length - 1].toString();
        invalidContents = translate('Error.ContentsMustBeValid', {
          allButLastIds,
          lastId,
        });
      }
      return invalidContents;
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

  const infringingCreationsHelperText = () => {
    if (infringingCreationsLinksError() === null && infringingCreationIdsError() === null) {
      return translate('Description.EnterOneOrMoreLinksClaims', {
        count: remainingClaimRequests.toString(),
      });
    }
    return null;
  };

  const description = watch('description');

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
                    void trigger(['myCreationLink', 'infringingCreationsLinks']);
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
                  placeholder={PLACEHOLDER_CREATION_LINK}
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
            name='infringingCreationsLinks'
            control={control}
            rules={{
              validate: {
                required: (value) => value.some((val: string) => val.length > 0),
                count: (value) => value.length <= remainingClaimRequests,
                format: (value) => {
                  if (value.length === 0) {
                    return true;
                  }

                  // Parse all lines
                  const parseResult = value.map((url: string) => {
                    const result = parseContentUrl(url, ContentURLType.Infringing);
                    if (value.filter((l) => l === url).length > 1) {
                      return { ...result, error: ContentUrlDuplicateError, contentId: -1 };
                    }
                    return result;
                  });
                  parsedInfringingCreationsLinks.current = parseResult;

                  // Collect line numbers of the ones that can't be parsed
                  const errorLines: number[] = [];
                  parseResult.forEach((current: ParsedContentUrl, index: number) => {
                    if (current.contentId === -1 && current.error !== ContentUrlDuplicateError) {
                      errorLines.push(index + 1);
                    }
                  });
                  setInfCreationsErrorLines(errorLines);

                  const duplicatedLines: number[] = [];
                  parseResult.forEach((current: ParsedContentUrl, index: number) => {
                    if (current.contentId === -1 && current.error === ContentUrlDuplicateError) {
                      duplicatedLines.push(index + 1);
                    }
                  });
                  setInfCreationsDuplicateLines(duplicatedLines);

                  return errorLines.length === 0 && duplicatedLines.length === 0;
                },
              },
            }}
            render={({ field }) => {
              return (
                <MultiLinkField
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={field.value}
                  disabled={false}
                  error={errors.infringingCreationsLinks !== undefined}
                  parseResults={parsedInfringingCreationsLinks.current}
                  required
                  helperText={infringingCreationsLinksError() ?? infringingCreationsHelperText()}
                  persistentText={infringingCreationIdsError()}
                  label={translate('Label.LinksToInfringingCreationsClaims')}
                  limit={remainingClaimRequests}
                />
              );
            }}
          />
        </Grid>
        <Grid item XSmall={12} Large={12}>
          <Typography variant='h5'>{translate('Label.SupportingInformation')}</Typography>
        </Grid>
        <Grid item XSmall={12} Large={12}>
          <Typography color='secondary'>
            {translate('Description.SupportingInformationCreate')}
          </Typography>
        </Grid>
        <Grid item XSmall={12} Large={12}>
          <ControlledDescription
            description={description}
            control={control}
            error={errors.description}
          />
        </Grid>
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

export default withTranslation(BulkLinksForm, [TranslationNamespace.RightsPortal]);
