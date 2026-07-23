import { FormMode } from '@modules/miscellaneous/common';
import { Doc } from '@modules/miscellaneous/common/components/uploaders';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ClaimItemDiscoveredFromEnum, ClaimItemSourceEnum } from '@rbx/clients/rightsV1';
import { uuidService } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { AddIcon, Alert, Button, Grid } from '@rbx/ui';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import usePagination from '../../hooks/usePagination';
import ApplyFooter from '../registration/ApplyFooter';
import { TakedownRequest } from './CreateRemovalRequestContainer';
import CreationsTable from './CreationsTable';
import AddCreation from './AddCreation';
import EditModal from './EditModal';
import { MAX_CHARACTER_COUNT } from '../createClaims/AddCreationsForm/BulkLinksForm';

const MaxTakedownRequests = 250;

export interface RemovalRequestFormFields {
  creationSource: ClaimItemSourceEnum;
  myCreationLink: string;
  description: string;
  documents: Doc[];
  infringingCreationsLinks: string[];
  discoveredFrom: ClaimItemDiscoveredFromEnum;
}

export interface RemovalRequestFormFieldsModal {
  creationSource: ClaimItemSourceEnum;
  myCreationLink: string;
  description: string;
  documents: Doc[];
  infringingCreationsLinks: string[];
  discoveredFrom: ClaimItemDiscoveredFromEnum;
}

interface RemovalRequestFormProps {
  takedownRequests: Array<TakedownRequest>;
  setTakedownRequests: (takedownRequests: Array<TakedownRequest>) => void;
  onClickBack: () => void;
  onClickNext: () => void;
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  shouldHideCreation?: boolean;
  setBacktrackToSearch: React.Dispatch<React.SetStateAction<boolean>>;
}

const cloneTakedownRequest = (originalRequest: TakedownRequest): TakedownRequest => {
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

const RemovalRequestForm: FunctionComponent<React.PropsWithChildren<RemovalRequestFormProps>> = ({
  takedownRequests,
  setTakedownRequests,
  onClickNext,
  onClickBack,
  activeStep,
  setActiveStep,
  shouldHideCreation = false,
  setBacktrackToSearch,
}) => {
  const [showAddCreation, setShowAddCreation] = useState(!shouldHideCreation);
  const [isEditing, setIsEditing] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [editIndex, setEditIndex] = useState<undefined | number>();
  const { ready, translate } = useTranslation();
  const pagination = usePagination({ initialRowsPerPage: 10 });
  const { rowsPerPage, setPage } = pagination;
  const { isFetched: isIXPFetched } = useIXPParameters(IXPLayers.RightsManager);
  const onDeleteRequest = useCallback(
    (index: number) => {
      const newTakedownRequests = [...takedownRequests];
      newTakedownRequests.splice(index, 1);
      setTakedownRequests(newTakedownRequests);

      if (newTakedownRequests.length === 0) {
        setActiveStep(0);
        setBacktrackToSearch(false);
        setShowAddCreation(true);
      }

      // switch to the last page so if we just deleted the only item on the last page
      // we won't show the user empty page
      setPage(Math.floor(Math.abs((newTakedownRequests.length - 1) / rowsPerPage)));
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps --
     * NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
     * responsible for triaging issue.
     */
    [takedownRequests, setTakedownRequests, setPage],
  );

  const convertTakedownRequestToFormData = (
    takedownRequest: TakedownRequest,
  ): RemovalRequestFormFields => {
    return {
      creationSource: takedownRequest.creationSource,
      myCreationLink: takedownRequest.myContent?.originalLink || '',
      description: takedownRequest.description,
      documents: takedownRequest.supportingFiles,
      infringingCreationsLinks: [takedownRequest.infringingContent.originalLink],
      discoveredFrom: takedownRequest.discoveredFrom,
    };
  };

  const defaultValues: RemovalRequestFormFields = {
    creationSource: ClaimItemSourceEnum.OnRoblox,
    myCreationLink: '',
    description: '',
    documents: [],
    infringingCreationsLinks: [''],
    discoveredFrom: ClaimItemDiscoveredFromEnum.BulkEntry,
  };

  const formMethods = useForm<RemovalRequestFormFields>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues,
  });

  const formMethodsModal = useForm<RemovalRequestFormFieldsModal>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues,
  });

  const { reset, watch } = formMethods;
  const { reset: resetModal } = formMethodsModal;
  const onEditRequest = (index: number) => {
    const takedownRequest = takedownRequests[index];
    resetModal(convertTakedownRequestToFormData(takedownRequest));
    setIsDuplicating(false);
    setIsEditing(true);
    setEditIndex(index);
  };

  const onDuplicateRequest = useCallback(
    (index: number) => {
      const duplicatedRequest = cloneTakedownRequest(takedownRequests[index]);
      resetModal(convertTakedownRequestToFormData(duplicatedRequest));
      setIsDuplicating(true);
      setIsEditing(true);
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps --
     * NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
     * responsible for triaging issue.
     */
    [takedownRequests],
  );

  const onAddCreation = () => {
    reset({ ...defaultValues });
    setShowAddCreation(true);
  };

  if (!ready || !isIXPFetched) {
    return null;
  }

  const isMaxCreationsReached = takedownRequests.length >= MaxTakedownRequests;
  const descriptionLength = watch('description').length;
  const isNextButtonEnabled =
    takedownRequests && takedownRequests.length > 0 && descriptionLength <= MAX_CHARACTER_COUNT;

  return (
    <Grid container direction='column' spacing={2}>
      <EditModal
        defaultValues={defaultValues}
        formMethods={formMethodsModal}
        takedownRequests={takedownRequests}
        setTakedownRequests={setTakedownRequests}
        setShowAddCreation={setShowAddCreation}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        isDuplicating={isDuplicating}
        editIndex={editIndex}
        setEditIndex={setEditIndex}
        rowsPerPage={rowsPerPage}
        setPage={setPage}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
      />
      <Grid item XSmall>
        {showAddCreation && (
          <AddCreation
            defaultValues={defaultValues}
            formMethods={formMethods}
            takedownRequests={takedownRequests}
            setTakedownRequests={setTakedownRequests}
            setShowAddCreation={setShowAddCreation}
            isEditing={false}
            setIsEditing={setIsEditing}
            isDuplicating={false}
            editIndex={editIndex}
            setEditIndex={setEditIndex}
            rowsPerPage={rowsPerPage}
            setPage={setPage}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />
        )}
        {takedownRequests.length > 0 && (
          <Grid item container direction='column' spacing={2}>
            {isMaxCreationsReached && (
              <Grid item marginLeft={1} marginRight={1}>
                <Alert variant='standard' severity='error'>
                  <span>
                    {translate('Label.ReachedMaxCreationsPerRequest', {
                      limit: MaxTakedownRequests.toString(),
                    })}
                  </span>
                </Alert>
              </Grid>
            )}
            {!isMaxCreationsReached && !showAddCreation && (
              <Grid item container spacing={3}>
                <Grid item>
                  <Button
                    color='primary'
                    size='medium'
                    variant='contained'
                    disabled={isMaxCreationsReached}
                    onClick={onAddCreation}
                    startIcon={<AddIcon />}>
                    {translate('Label.AddCreation')}
                  </Button>
                </Grid>
              </Grid>
            )}

            <Grid item>
              <CreationsTable
                creations={takedownRequests}
                onDelete={onDeleteRequest}
                onDuplicate={onDuplicateRequest}
                onEdit={onEditRequest}
                pagination={pagination}
              />
            </Grid>
          </Grid>
        )}
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
  );
};

export default withTranslation(RemovalRequestForm, [TranslationNamespace.RightsPortal]);
