import React, { useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid } from '@rbx/ui';
import { FormProvider, useForm } from 'react-hook-form';
import {
  ClaimContentContentTypeEnum,
  ClaimItemDiscoveredFromEnum,
  ClaimItemSourceEnum,
  SearchContentContentTypeEnum,
  Account,
} from '@rbx/clients/rightsV1';
import { FormMode } from '@modules/miscellaneous/common';
import { uuidService } from '@rbx/core';
import { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/clients/games';
import ApplyFooter from '../../registration/ApplyFooter';
import { ClaimRequest } from '../../createClaims/CreateClaimsContainer';
import useCart from '../useCart';
import ReviewCartForm from './ReviewCartForm';
import useParseCart from './useParseCart';
import Match from '../Match';
import { AddCreationsFields } from '../../createClaims/AddCreationsForm/AddCreationsForm';

export type AddSearchCreationsForm = {
  onNext: () => void;
  onBack: () => void;
  cart: ReturnType<typeof useCart>;
  setClaimRequests: (claimRequest: ClaimRequest[]) => void;
  originalContent: RobloxGamesApiModelsResponsePlaceDetails | null;
  isExperienceSearch: boolean;
  account: Account;
};

/**
 * AddSearchCreationsForm displays a form to add creations to takedown requests.
 * It's the first step in Creating Claims, letting you review your cart
 */
const AddSearchCreationsForm = ({
  onNext,
  onBack,
  cart,
  setClaimRequests,
  originalContent,
  isExperienceSearch,
  account,
}: AddSearchCreationsForm) => {
  const { ready, translate } = useTranslation();

  const defaultValues: AddCreationsFields = {
    creationSource: ClaimItemSourceEnum.OnRoblox,
    myCreationLink: '',
    description: '',
    documents: [],
    infringingCreationsLinks: [''],
    discoveredFrom: ClaimItemDiscoveredFromEnum.Unknown,
  };

  const formMethods = useForm<AddCreationsFields>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues,
  });

  const myLink = formMethods.watch('myCreationLink');
  const { myContent, infringingContents } = useParseCart(myLink, cart.items);

  /**
   * createClaimRequests is called when submitting the form.
   * We take the cart and construct claimRequest objects from it to prepare for
   * submission to the backend.
   */
  const createClaimRequests = useCallback(
    (formData: AddCreationsFields) => {
      const newClaimRequests = cart.items.flatMap((match: Match) => {
        const infringingContent = infringingContents.find((content) => {
          const matchID = parseInt(match.searchContent.contentId || '-1', 10);
          const contentType =
            match.searchContent.contentType === SearchContentContentTypeEnum.Asset
              ? ClaimContentContentTypeEnum.Asset
              : ClaimContentContentTypeEnum.Bundle;
          return content.contentId === matchID && content.contentType === contentType;
        });
        const myContentInfo =
          isExperienceSearch && originalContent
            ? {
                myContent: {
                  contentId: originalContent.universeRootPlaceId?.toString() ?? '',
                  contentType: ClaimContentContentTypeEnum.Asset,
                  originalLink: originalContent.url ?? '',
                },
              }
            : !!formData.myCreationLink?.trim() &&
              myContent && {
                myContent: {
                  contentId: myContent.contentId,
                  contentType: myContent.contentType,
                  originalLink: formData.myCreationLink,
                },
              };
        if (!infringingContent) {
          return [];
        }
        return [
          {
            creationSource: formData.creationSource || '',
            infringingContent: {
              contentId: infringingContent.contentId,
              contentType: infringingContent.contentType,
              originalLink: infringingContent.originalLink || '',
            },
            description: formData.description,
            supportingFiles: formData.documents,
            key: uuidService.generateRandomUuid(),
            discoveredFrom: match.discoveredFrom,
            ...myContentInfo,
          } as ClaimRequest,
        ];
      });
      setClaimRequests(newClaimRequests);
      onNext();
    },
    [
      cart.items,
      setClaimRequests,
      onNext,
      infringingContents,
      myContent,
      isExperienceSearch,
      originalContent,
    ],
  );

  const onClickNext = useCallback(() => {
    formMethods.handleSubmit(createClaimRequests)();
  }, [createClaimRequests, formMethods]);

  if (!ready) {
    return null;
  }

  const isNextButtonEnabled = infringingContents.length > 0;
  return (
    <FormProvider {...formMethods}>
      <Grid container direction='column' width='70%' spacing={4}>
        <Grid item>
          <ReviewCartForm
            cart={cart}
            originalContent={originalContent}
            isExperienceSearch={isExperienceSearch}
            account={account}
          />
        </Grid>
        <Grid item>
          <ApplyFooter
            primaryLabel={translate('Label.Next')}
            primaryEnabled={isNextButtonEnabled}
            secondaryLabel={translate('Label.Cancel')}
            onNext={onClickNext}
            onBack={onBack}
          />
        </Grid>
      </Grid>
    </FormProvider>
  );
};

export default withTranslation(AddSearchCreationsForm, [TranslationNamespace.RightsPortal]);
