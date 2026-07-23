import type { FunctionComponent } from 'react';
import React, { useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Controller, FormProvider } from 'react-hook-form';
import {
  ClaimItemSourceEnum,
  ClaimContentContentTypeEnum,
  AccountAccountTypeEnum,
} from '@rbx/client-rights/v1';
import { uuidService } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid, MenuItem, Select, TextField, Typography, makeStyles } from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import type { ParsedContentUrl } from '../../helpers/parseContentUrl';
import parseContentUrl, {
  ContentUrlDuplicateError,
  ContentURLType,
} from '../../helpers/parseContentUrl';
import parseUrl from '../../helpers/parseUrl';
import useCheckSelfContent from '../../hooks/useCheckSelfContent';
import useContentPermissions from '../../hooks/useContentPermissions';
import useValidateContentIds from '../../hooks/useValidateContentIds';
import type { TakedownRequest } from '../../types/types';
import ControlledDescription from '../common/ControlledDescription';
import {
  COPYRIGHT_EMAIL,
  MAX_CLAIM_REQUESTS,
  PLACEHOLDER_CREATION_LINK,
} from '../createClaims/AddCreationsForm/constants';
import { DocumentUploader } from '../documents/DocumentForm';
import MultiLinkField from './MultiLinkField';
import type { RemovalRequestFormFields } from './types';

export type TAddCreationProps = {
  defaultValues: RemovalRequestFormFields;
  formMethods: UseFormReturn<RemovalRequestFormFields>;
  takedownRequests: Array<TakedownRequest>;
  setTakedownRequests: (takedownRequests: Array<TakedownRequest>) => void;
  setShowAddCreation: React.Dispatch<React.SetStateAction<boolean>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  isDuplicating: boolean;
  editIndex: number | undefined;
  setEditIndex: React.Dispatch<React.SetStateAction<number | undefined>>;
  rowsPerPage: number;
  setPage: (value: number) => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
};

const useStyles = makeStyles()(() => ({
  select: {
    width: '100%',
  },
}));

const AddCreation: FunctionComponent<React.PropsWithChildren<TAddCreationProps>> = ({
  defaultValues,
  formMethods,
  takedownRequests,
  setTakedownRequests,
  setShowAddCreation,
  isEditing,
  setIsEditing,
  isDuplicating,
  editIndex,
  setEditIndex,
  rowsPerPage,
  setPage,
  activeStep,
  setActiveStep,
}) => {
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [addError, setAddError] = useState('');
  const { ready, translate } = useTranslation();
  const { account } = useCurrentAccountContext();
  const isOffPlatformSourceEnabled =
    account && account.accountType === AccountAccountTypeEnum.Corporate;
  const contentPermissions = useContentPermissions();
  const {
    isFetched: isIXPFetched,
    params: { enableBulkFiling },
  } = useIXPParameters(IXPLayers.RightsManager);
  const [infCreationsErrorLines, setInfCreationsErrorLines] = useState<number[]>([]);
  const [infCreationsDuplicateLines, setInfCreationsDuplicateLines] = useState<number[]>([]);
  const [parsedInfringingCreationsLinks, setParsedInfringingCreationsLinks] = useState<
    ParsedContentUrl[]
  >([]);
  const { classes: styles } = useStyles();
  const { handleSubmit, control, formState, reset, trigger, watch, setError, clearErrors } =
    formMethods;
  const { errors } = formState;
  const remainingTakedownRequests = Math.max(0, MAX_CLAIM_REQUESTS - takedownRequests.length);
  const [invalidIds, setInvalidIds] = useState<number[]>([]);

  const addCreationToList = (formData: RemovalRequestFormFields) => {
    setIsLoadingContent(true);
    try {
      const addedTakedownRequests = (
        Array.isArray(formData.infringingCreationsLinks)
          ? formData.infringingCreationsLinks
          : [formData.infringingCreationsLinks]
      ).map((infringingCreationLink: string) => {
        const parsedInfringingContentUrl = parseContentUrl(
          infringingCreationLink,
          ContentURLType.Infringing,
        );
        let parsedMyContentId: number | null = null;
        let parsedMyContentType: ClaimContentContentTypeEnum | null = null;
        if (formData.myCreationLink?.length) {
          const parsedMyContentUrl = parseContentUrl(
            formData.myCreationLink,
            ContentURLType.Original,
          );
          if (parsedMyContentUrl.contentId !== -1) {
            parsedMyContentId = parsedMyContentUrl.contentId;
            parsedMyContentType = parsedMyContentUrl.contentType;
          } else if (parseUrl(formData.myCreationLink)) {
            parsedMyContentId = -1;
            parsedMyContentType = ClaimContentContentTypeEnum.External;
          }
        }

        return {
          creationSource: formData.creationSource || '',
          infringingContent: {
            contentId: parsedInfringingContentUrl.contentId,
            contentType: parsedInfringingContentUrl.contentType,
            originalLink: infringingCreationLink,
          },
          description: formData.description,
          supportingFiles: formData.documents,
          key: uuidService.generateRandomUuid(),
          discoveredFrom: formData.discoveredFrom,
          ...(!!formData.myCreationLink?.trim() &&
            parsedMyContentId &&
            parsedMyContentType && {
              myContent: {
                contentId: parsedMyContentId,
                contentType: parsedMyContentType,
                originalLink: formData.myCreationLink,
              },
            }),
        } as TakedownRequest;
      });
      if (activeStep === 0) {
        setActiveStep(1);
      }
      let newTakedownRequests = [...takedownRequests];
      if (isEditing && editIndex !== undefined) {
        // When editing, bulk component is disabled and array length is always 1
        const [takedownRequest] = addedTakedownRequests;
        newTakedownRequests[editIndex] = takedownRequest;
      } else {
        newTakedownRequests = [...takedownRequests, ...addedTakedownRequests];
      }

      setTakedownRequests(newTakedownRequests);
      if (!isEditing) {
        setShowAddCreation(false);
      }
      setAddError('');
      reset({ ...defaultValues });

      // switch to the last page
      setPage(Math.floor(Math.abs((newTakedownRequests.length - 1) / rowsPerPage)));
    } catch {
      setAddError(translate('Error.AddingItem'));
    } finally {
      setIsEditing(false);
      setEditIndex(undefined);
      setIsLoadingContent(false);
    }
  };

  const handleCancel = () => {
    if (!isEditing) {
      setShowAddCreation(false);
    }
    setIsEditing(false);
    setEditIndex(undefined);
  };

  const infringingCreationsLinksError = () => {
    if (!errors.infringingCreationsLinks || Array.isArray(errors.infringingCreationsLinks)) {
      return null;
    }
    const { type } = errors.infringingCreationsLinks;
    if (type === 'selfOwned') {
      return translate('Error.ReportOwnContent');
    }
    if (type === 'required') {
      return translate('Error.InfringingLinksRequired', {
        limit: remainingTakedownRequests.toString(),
      });
    }
    if (type === 'count') {
      return translate('Error.InfringingLinksCount', {
        count: remainingTakedownRequests.toString(),
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
        const allButLastId = invalidIds.slice(0, invalidIds.length - 1).join(', ');
        const lastId = invalidIds[invalidIds.length - 1].toString();
        invalidContents = translate('Error.ContentsMustBeValid', {
          allButLastId,
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
      return translate('Description.EnterOneOrMoreLinks', {
        count: remainingTakedownRequests.toString(),
      });
    }
    return null;
  };

  const description = watch('description');
  const mdColSize = isEditing ? 12 : 8;

  const assetIds = parsedInfringingCreationsLinks
    .filter((content) => content.contentType === ClaimContentContentTypeEnum.Asset)
    .map((content) => content.contentId);
  const bundleIds = parsedInfringingCreationsLinks
    .filter((content) => content.contentType === ClaimContentContentTypeEnum.Bundle)
    .map((content) => content.contentId);
  const { invalidContentIds } = useValidateContentIds(assetIds, bundleIds);

  const infringingLinksValue: string | string[] = watch('infringingCreationsLinks');
  const parsedForSelfCheck = useMemo(
    () =>
      (Array.isArray(infringingLinksValue) ? infringingLinksValue : [infringingLinksValue]).map(
        (link) => parseContentUrl(link, ContentURLType.Infringing),
      ),
    [infringingLinksValue],
  );
  const { selfOwnedIds } = useCheckSelfContent(parsedForSelfCheck);

  const onClickAdd = () => {
    setInvalidIds(invalidContentIds);
    if (invalidContentIds.length > 0) {
      setError('infringingCreationsLinks', {
        type: 'manual',
        message: 'invalidIds',
      });
    } else if (selfOwnedIds.length > 0) {
      setError('infringingCreationsLinks', { type: 'selfOwned' });
    } else {
      clearErrors('infringingCreationsLinks');
      void handleSubmit(addCreationToList)();
    }
  };

  if (!ready || !isIXPFetched) {
    return null;
  }

  return (
    <FormProvider {...formMethods}>
      <Grid container direction='column' spacing={4}>
        <Grid item XSmall container spacing={3} marginBottom='40px'>
          <Grid item XSmall={12} Large={12}>
            <Typography variant='h5'>{translate('Heading.YourCreation')}</Typography>
          </Grid>
          {isOffPlatformSourceEnabled && (
            <Grid item XSmall={12} Large={mdColSize}>
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
          <Grid item XSmall={12} Large={mdColSize}>
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
          {!isEditing && <Grid item XSmall={0} Large={4} />}
          {(isEditing || !enableBulkFiling) && (
            <>
              <Grid item XSmall={12} Large={12}>
                <Typography variant='h5'>{translate('Label.CreationYoureReporting')}</Typography>
              </Grid>
              <Grid item XSmall={12} Large={mdColSize}>
                <Controller
                  name='infringingCreationsLinks'
                  control={control}
                  rules={{
                    validate: {
                      required: (value) => value.length > 0,
                      format: (value: string | string[]) => {
                        // This should never happen, outside of bulk filing this value will always be a string
                        if (Array.isArray(value)) {
                          return true;
                        }
                        setInfCreationsErrorLines([]);
                        return parseContentUrl(value, ContentURLType.Infringing).error.length === 0;
                      },
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id='infringing-creations-links'
                      data-testid='infringing-creations-links'
                      label={`${translate('Label.LinkToInfringingCreation')}*`}
                      autoComplete='off'
                      placeholder={PLACEHOLDER_CREATION_LINK}
                      fullWidth
                      error={!!errors.infringingCreationsLinks}
                      helperText={infringingCreationsLinksError()}
                    />
                  )}
                />
              </Grid>
            </>
          )}
          {!isEditing && enableBulkFiling && (
            <>
              <Grid item XSmall={12} Large={12}>
                <Typography variant='h5'>{translate('Label.CreationsYoureReporting')}</Typography>
              </Grid>
              <Grid item XSmall={12} Large={mdColSize}>
                <Controller
                  name='infringingCreationsLinks'
                  control={control}
                  rules={{
                    validate: {
                      required: (value) => value.some((val) => val.length > 0),
                      count: (value) => value.length <= remainingTakedownRequests,
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
                        setParsedInfringingCreationsLinks(parseResult);

                        // Collect line numbers of the ones that can't be parsed
                        const errorLines: number[] = [];
                        parseResult.forEach((current: ParsedContentUrl, index: number) => {
                          if (
                            current.contentId === -1 &&
                            current.error !== ContentUrlDuplicateError
                          ) {
                            errorLines.push(index + 1);
                          }
                        });
                        setInfCreationsErrorLines(errorLines);

                        const duplicatedLines: number[] = [];
                        parseResult.forEach((current: ParsedContentUrl, index: number) => {
                          if (
                            current.contentId === -1 &&
                            current.error === ContentUrlDuplicateError
                          ) {
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
                        parseResults={parsedInfringingCreationsLinks}
                        required
                        helperText={
                          infringingCreationsLinksError() ?? infringingCreationsHelperText()
                        }
                        persistentText={infringingCreationIdsError()}
                        label={translate('Label.LinksToInfringingCreations')}
                        limit={remainingTakedownRequests}
                      />
                    );
                  }}
                />
              </Grid>
            </>
          )}
          {!isEditing && <Grid item XSmall={0} Large={4} />}
          <Grid item XSmall={12} Large={mdColSize}>
            <Typography variant='h5'>{translate('Heading.AdditionalDetails')}</Typography>
          </Grid>
          <Grid item XSmall={12} Large={mdColSize}>
            <ControlledDescription
              description={description}
              control={control}
              error={errors.description}
              placeholderKey='Description.Description'
            />
          </Grid>
          {!isEditing && <Grid item XSmall={0} Large={4} />}
          <Grid item XSmall={12} Large={mdColSize}>
            <DocumentUploader
              translate={translate}
              maxCount={6}
              placeholder={translate('Label.DragHereToUpload')}
              acceptedMIMETypes={['application/pdf', 'image/jpeg', 'image/png']}
              required={false}
            />
          </Grid>
          {!isEditing && <Grid item XSmall={0} Large={4} />}
          <Grid item XSmall container direction='column'>
            <Grid item container spacing={1}>
              {takedownRequests.length > 0 && (
                <Grid item>
                  <Button variant='outlined' color='primary' size='medium' onClick={handleCancel}>
                    {translate('Label.Cancel')}
                  </Button>
                </Grid>
              )}
              <Grid item>
                <Button
                  disabled={!isDuplicating && !formMethods.formState.isDirty}
                  variant='contained'
                  color='primary'
                  size='medium'
                  onClick={onClickAdd}
                  loading={isLoadingContent}>
                  {isEditing ? translate('Label.SaveCreation') : translate('Label.AddCreation')}
                </Button>
              </Grid>
            </Grid>
            {addError !== '' && (
              <Grid item>
                <Typography color='error'>{addError}</Typography>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </FormProvider>
  );
};

export default withTranslation(AddCreation, [TranslationNamespace.RightsPortal]);
