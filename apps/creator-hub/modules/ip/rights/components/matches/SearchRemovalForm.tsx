import type { FunctionComponent } from 'react';
import React from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import type { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/client-games/v1';
import {
  ClaimContentContentTypeEnum,
  ClaimItemDiscoveredFromEnum,
  ClaimItemSourceEnum,
  SearchContentContentTypeEnum,
} from '@rbx/client-rights/v1';
import { uuidService } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, TextField, Typography } from '@rbx/ui';
import { FormMode } from '@modules/miscellaneous/common';
import type { Doc } from '@modules/miscellaneous/components/uploaders/components/MultiDocumentUploader/MultiDocumentUploader';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import parseContentUrl, { ContentURLType } from '../../helpers/parseContentUrl';
import parseUrl from '../../helpers/parseUrl';
import type { TakedownRequest } from '../../types/types';
import { DocumentUploader } from '../documents/DocumentForm';
import ApplyFooter from '../registration/ApplyFooter';
import OriginalContentDisplay from './OriginalContentDisplay';
import SelectedContentsDisplay from './SelectedContentsDisplay';
import type { useCart } from './useCart';

function getCatalogLink(id: string, type: SearchContentContentTypeEnum) {
  const wwwPath = `https://${process.env.robloxSiteDomain}`;
  switch (type) {
    case SearchContentContentTypeEnum.Bundle:
      return `${wwwPath}/bundle/${id}`;
    case SearchContentContentTypeEnum.Asset:
    default:
      return `${wwwPath}/catalog/${id}`;
  }
}

function getExperienceLink(id: string) {
  const wwwPath = `https://${process.env.robloxSiteDomain}`;
  return `${wwwPath}/games/${id}`;
}
interface CreationForRemovalFormType {
  creationSource: ClaimItemSourceEnum;
  myCreationLink: string;
  infringingCreationLink: string;
  description: string;
  documents: Doc[];
  discoveredFrom: ClaimItemDiscoveredFromEnum;
}

interface SearchRemovalFormProps {
  onClickNext: (takedowns: TakedownRequest[]) => void;
  onClickBack: () => void;
  cart: ReturnType<typeof useCart>;
  originalContent: RobloxGamesApiModelsResponsePlaceDetails | null;
  isExperienceSearch: boolean;
}

/**
 * SearchRemovalForm is the first step in creating a search removal request.
 * It pulls SearchContent from local storage, collects various details, and submits TakedownRequests to be used in the
 * shared removalRequestForm component.
 */
const SearchRemovalForm: FunctionComponent<React.PropsWithChildren<SearchRemovalFormProps>> = ({
  onClickNext,
  onClickBack,
  cart,
  originalContent,
  isExperienceSearch,
}) => {
  const { ready, translate } = useTranslation();
  const { account } = useCurrentAccountContext();

  const defaultValues = {
    creationSource: ClaimItemSourceEnum.OnRoblox,
    myCreationLink: '',
    infringingCreationLink: '',
    description: '',
    documents: [],
    discoveredFrom: ClaimItemDiscoveredFromEnum.Unknown,
  };

  const formMethods = useForm<CreationForRemovalFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues,
  });

  const { handleSubmit, control, formState } = formMethods;

  const { errors } = formState;

  const addCreations = (formData: CreationForRemovalFormType): void => {
    const addedTakedownRequests = cart.items.map((match) => {
      const { searchContent } = match;
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
      // TODO FIX CLIENT
      let ctype: ClaimContentContentTypeEnum = 'Asset';
      switch (searchContent.contentType) {
        case 'asset':
          ctype = 'Asset';
          break;
        case 'bundle':
          ctype = 'Bundle';
          break;
        default:
          ctype = 'Asset';
          break;
      }
      let infringingLink = getCatalogLink(
        searchContent.contentId || '',
        searchContent.contentType || SearchContentContentTypeEnum.Asset,
      );
      if (isExperienceSearch) {
        infringingLink = getExperienceLink(searchContent.contentId || '');
      }
      return {
        creationSource: formData.creationSource || '',
        infringingContent: {
          contentId: Number(searchContent.contentId),
          contentType: ctype,
          originalLink: infringingLink,
        },
        description: formData.description,
        supportingFiles: formData.documents,
        key: uuidService.generateRandomUuid(),
        discoveredFrom: match.discoveredFrom,
        ...(isExperienceSearch && originalContent
          ? {
              myContent: {
                contentId: originalContent.universeRootPlaceId?.toString() ?? '',
                contentType: ClaimContentContentTypeEnum.Asset,
                originalLink: originalContent.url ?? '',
              },
            }
          : !!formData.myCreationLink?.trim() &&
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
    onClickNext(addedTakedownRequests);
  };

  if (!account || !ready) {
    return null;
  }

  return (
    <Grid container direction='column' spacing={2}>
      <Grid item XSmall>
        <FormProvider {...formMethods}>
          <Grid container direction='column' spacing={4}>
            <Grid item XSmall container spacing={3} marginBottom='40px'>
              <Grid item XSmall={12} Large={12}>
                <Typography variant='h5'>{translate('Heading.YourCreation')}</Typography>
              </Grid>
              <OriginalContentDisplay
                originalContent={originalContent}
                isExperienceSearch={isExperienceSearch}
                account={account}
              />
              {/* This is to support 60% width for normal screens, 100% width for small ones */}
              <Grid item XSmall={0} Large={4} />
              <Grid item XSmall={12} Large={12}>
                <Typography variant='h5'>{translate('Label.CreationsYoureReporting')}</Typography>
              </Grid>
              <Grid item XSmall={12} Large={8}>
                <SelectedContentsDisplay
                  cartItems={cart.items}
                  removeFromCart={cart.remove}
                  numPerRow={3}
                />
              </Grid>
              <Grid item XSmall={12} Large={12}>
                <Typography variant='h5'>{translate('Heading.AdditionalDetails')}</Typography>
              </Grid>
              <Grid item XSmall={12} Large={8}>
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
              <Grid item XSmall={12} Large={8}>
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
        </FormProvider>
      </Grid>
      <Grid item>
        <ApplyFooter
          primaryLabel={translate('Label.Next')}
          primaryEnabled={formState.isValid}
          secondaryLabel={translate('Label.Back')}
          onNext={handleSubmit(addCreations)}
          onBack={onClickBack}
        />
      </Grid>
    </Grid>
  );
};

export default withTranslation(SearchRemovalForm, [TranslationNamespace.RightsPortal]);
