import { useCallback, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  ClaimContentContentTypeEnum,
  ClaimItemDiscoveredFromEnum,
  ClaimItemSourceEnum,
} from '@rbx/client-rights/v1';
import { uuidService } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { FormMode } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ParsedContentUrl } from '../../../helpers/parseContentUrl';
import useCheckSelfContent from '../../../hooks/useCheckSelfContent';
import useParseLinks from '../../../hooks/useParseLinks';
import useValidateContentIds from '../../../hooks/useValidateContentIds';
import type { ClaimRequest } from '../../../types/types';
import ApplyFooter from '../../registration/ApplyFooter';
import BulkLinksForm from './BulkLinksForm';
import { MAX_CHARACTER_COUNT } from './constants';
import type { AddCreationsFields } from './types';

export type AddClaimCreationProps = {
  onNext: () => void;
  onBack: () => void;
  claimRequests: ClaimRequest[];
  setClaimRequests: (claimRequest: ClaimRequest[]) => void;
};

/**
 * AddCreationsForm displays a form to add creations to takedown requests.
 * It's the first step in Creating Claims, and shows a Bulk Link form.
 */
// oxlint-disable-next-line react/react-compiler -- react-hook-form's watch() is intentionally non-memoizable
const AddCreationsForm = ({
  onNext,
  onBack,
  claimRequests,
  setClaimRequests,
}: AddClaimCreationProps) => {
  const { ready, translate } = useTranslation();

  const defaultValues: AddCreationsFields = {
    creationSource: ClaimItemSourceEnum.OnRoblox,
    myCreationLink: '',
    description: '',
    documents: [],
    infringingCreationsLinks: [''],
    discoveredFrom: ClaimItemDiscoveredFromEnum.BulkEntry,
  };

  const formMethods = useForm<AddCreationsFields>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues,
  });

  const { watch, setError, clearErrors } = formMethods;
  const { errors } = formMethods.formState;

  const myLink = watch('myCreationLink');
  const infringingLinks = watch('infringingCreationsLinks');
  const descriptionLength = watch('description').length;
  const { myContent, infringingContents } = useParseLinks(myLink, infringingLinks);

  const [invalidIds, setInvalidIds] = useState<number[]>([]);

  const createClaimRequests = useCallback(
    (formData: AddCreationsFields) => {
      const newClaimRequests = infringingContents.map((infringingContent: ParsedContentUrl) => {
        return {
          creationSource: formData.creationSource || '',
          infringingContent: {
            contentId: infringingContent.contentId,
            contentType: infringingContent.contentType,
            originalLink: infringingContent.originalLink ?? '',
          },
          description: formData.description,
          supportingFiles: formData.documents,
          key: uuidService.generateRandomUuid(),
          discoveredFrom: formData.discoveredFrom,
          ...(!!formData.myCreationLink?.trim() &&
            myContent && {
              myContent: {
                contentId: myContent.contentId,
                contentType: myContent.contentType,
                originalLink: formData.myCreationLink,
              },
            }),
        } as ClaimRequest;
      });
      setClaimRequests(newClaimRequests);
      onNext();
    },
    [infringingContents, myContent, onNext, setClaimRequests],
  );

  const assetIds = infringingContents
    .filter((content) => content.contentType === ClaimContentContentTypeEnum.Asset)
    .map((content) => content.contentId);
  const bundleIds = infringingContents
    .filter((content) => content.contentType === ClaimContentContentTypeEnum.Bundle)
    .map((content) => content.contentId);
  const { invalidContentIds } = useValidateContentIds(assetIds, bundleIds);
  const { selfOwnedIds } = useCheckSelfContent(infringingContents);

  const onClickNext = () => {
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
      void formMethods.handleSubmit(createClaimRequests)();
    }
  };

  if (!ready) {
    return null;
  }

  const noBulkLinkErrors = (errors.infringingCreationsLinks ?? []).length === 0;
  const isNextButtonEnabled =
    noBulkLinkErrors && infringingContents.length > 0 && descriptionLength <= MAX_CHARACTER_COUNT;
  return (
    <FormProvider {...formMethods}>
      <Grid container direction='column' width='70%' spacing={4}>
        <Grid item>
          <BulkLinksForm claimRequests={claimRequests} invalidIds={invalidIds} />
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

export default withTranslation(AddCreationsForm, [TranslationNamespace.RightsPortal]);
