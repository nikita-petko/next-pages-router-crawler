import { FormMode } from '@modules/miscellaneous/common';
import { Doc } from '@modules/miscellaneous/common/components/uploaders';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ClaimItemDiscoveredFromEnum, ClaimItemSourceEnum } from '@rbx/clients/rightsV1';
import { uuidService } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import React, { useCallback, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import useParseLinks from '../../hooks/useParseLinks';
import usePagination from '../../hooks/usePagination';
import ApplyFooter from '../registration/ApplyFooter';
import { ClaimRequest } from './CreateClaimsContainer';
import ClaimCreationsTable from './ClaimCreationsTable';
import EditCreationModal from './EditCreationModal/EditCreationModal';
import { SingleCreationFields } from './EditCreationModal/EditSingleCreationForm';

export interface ReviewCreationsModal {
  creationSource: ClaimItemSourceEnum;
  myCreationLink: string;
  description: string;
  documents: Doc[];
  infringingCreationsLinks: string[];
  discoveredFrom: ClaimItemDiscoveredFromEnum;
}

interface ReviewCreationsProps {
  claimRequests: ClaimRequest[];
  setClaimRequests: (takedownRequests: ClaimRequest[]) => void;
  onClickBack: () => void;
  onClickNext: () => void;
  setActiveStep: (activeStep: number) => void;
}

const cloneTakedownRequest = (originalRequest: ClaimRequest): ClaimRequest => {
  return {
    creationSource: originalRequest.creationSource,
    infringingContent: JSON.parse(JSON.stringify(originalRequest.infringingContent)),
    myContent: originalRequest.myContent && JSON.parse(JSON.stringify(originalRequest.myContent)),
    description: originalRequest.description,
    supportingFiles: originalRequest.supportingFiles.map((doc) => {
      const clonedFile = new File([doc.file ?? ''], doc.file?.name ?? '', { type: doc.file?.type });
      return {
        file: clonedFile,
        key: URL.createObjectURL(clonedFile),
        name: clonedFile.name,
      };
    }),
    key: uuidService.generateRandomUuid(),
    discoveredFrom: originalRequest.discoveredFrom,
  };
};

/**
 * ReviewCreations displays the Creations table, with an Edit modal Form for duplicating/editing.
 */
const ReviewCreations = ({
  claimRequests,
  setClaimRequests,
  onClickNext,
  onClickBack,
  setActiveStep,
}: ReviewCreationsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [editIndex, setEditIndex] = useState<undefined | number>();
  const { ready, translate } = useTranslation();
  const pagination = usePagination({ initialRowsPerPage: 10 });
  const { rowsPerPage, setPage } = pagination;

  const onDeleteRequest = useCallback(
    (index: number) => {
      const newTakedownRequests = [...claimRequests];
      newTakedownRequests.splice(index, 1);
      setClaimRequests(newTakedownRequests);

      if (newTakedownRequests.length === 0) {
        setActiveStep(0);
      }
      // switch to the last page so if we just deleted the only item on the last page
      // we won't show the user empty page
      setPage(Math.floor(Math.abs((newTakedownRequests.length - 1) / rowsPerPage)));
    },
    [claimRequests, setClaimRequests, setPage, rowsPerPage, setActiveStep],
  );

  const convertClaimRequestToFormData = (claimRequest: ClaimRequest): SingleCreationFields => {
    return {
      creationSource: claimRequest.creationSource,
      myCreationLink: claimRequest.myContent?.originalLink || '',
      description: claimRequest.description,
      documents: claimRequest.supportingFiles,
      infringingCreationsLink: claimRequest.infringingContent.originalLink,
      discoveredFrom: claimRequest.discoveredFrom,
    };
  };
  const isNextButtonEnabled = claimRequests && claimRequests.length > 0;

  const defaultValues: SingleCreationFields = {
    creationSource: ClaimItemSourceEnum.OnRoblox,
    myCreationLink: '',
    description: '',
    documents: [],
    infringingCreationsLink: '',
    discoveredFrom: ClaimItemDiscoveredFromEnum.BulkEntry,
  };

  const formMethods = useForm<SingleCreationFields>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues,
  });

  const { handleSubmit, watch, reset: resetModal } = formMethods;
  // watching edit modal
  const myLink = watch('myCreationLink');
  const infringingLink = watch('infringingCreationsLink');
  const { myContent, infringingContents } = useParseLinks(myLink, [infringingLink]);

  const onEditRequest = useCallback(
    (index: number) => {
      const claimRequest = claimRequests[index];
      resetModal(convertClaimRequestToFormData(claimRequest));
      setIsDuplicating(false);
      setIsOpen(true);
      setEditIndex(index);
    },
    [claimRequests, resetModal],
  );

  const onDuplicateRequest = useCallback(
    (index: number) => {
      const duplicatedRequest = cloneTakedownRequest(claimRequests[index]);
      resetModal(convertClaimRequestToFormData(duplicatedRequest));
      setIsDuplicating(true);
      setIsOpen(true);
    },
    [claimRequests, resetModal],
  );

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEditIndex(undefined);
  }, []);

  const submitEditClaimRequest = useCallback(
    (formData: SingleCreationFields) => {
      // infringingContents contains the singular content being edited
      if (infringingContents.length !== 1) {
        closeModal();
        return;
      }
      const infringingContent = infringingContents[0];
      const newClaimRequest = {
        creationSource: formData.creationSource || '',
        infringingContent: {
          contentId: infringingContent.contentId,
          contentType: infringingContent.contentType,
          originalLink: infringingContent.originalLink || '',
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

      let newClaimRequests = [...claimRequests];
      if (!isDuplicating && editIndex !== undefined) {
        // When editing, bulk component is disabled and array length is always 1
        newClaimRequests[editIndex] = newClaimRequest;
      } else {
        newClaimRequests = [...claimRequests, newClaimRequest];
      }
      setClaimRequests(newClaimRequests);
      closeModal();
    },
    [
      infringingContents,
      myContent,
      claimRequests,
      isDuplicating,
      editIndex,
      setClaimRequests,
      closeModal,
    ],
  );

  if (!ready) {
    return null;
  }

  return (
    <FormProvider {...formMethods}>
      <Grid container direction='column' spacing={2}>
        <EditCreationModal
          claimRequests={claimRequests}
          isDuplicating={isDuplicating}
          isOpen={isOpen}
          onClose={closeModal}
          onSubmit={handleSubmit(submitEditClaimRequest)}
        />
        <Grid item>
          <ClaimCreationsTable
            creations={claimRequests}
            onDelete={onDeleteRequest}
            onDuplicate={onDuplicateRequest}
            onEdit={onEditRequest}
            pagination={pagination}
          />
        </Grid>
        <Grid item>
          <ApplyFooter
            primaryLabel={translate('Label.Next')}
            primaryEnabled={isNextButtonEnabled}
            secondaryLabel={translate('Label.Back')}
            onNext={onClickNext}
            onBack={onClickBack}
          />
        </Grid>
      </Grid>
    </FormProvider>
  );
};

export default withTranslation(ReviewCreations, [TranslationNamespace.RightsPortal]);
