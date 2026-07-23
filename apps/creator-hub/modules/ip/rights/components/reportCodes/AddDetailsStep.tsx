import React, { FunctionComponent, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Grid, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ClaimItemSourceEnum } from '@rbx/clients/rightsV1';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Doc } from '@modules/miscellaneous/common/components/uploaders';
import ApplyFooter from '../registration/ApplyFooter';
import ControlledDescription from '../common/ControlledDescription';
import MyCreationSection from '../common/MyCreationSection';
import { DocumentUploader } from '../documents/DocumentForm';
import parseOriginalContent from '../../helpers/parseOriginalContent';
import type { OriginalContent } from '../../helpers/parseOriginalContent';

export interface AddDetailsResult {
  creationSource: ClaimItemSourceEnum;
  originalContent: OriginalContent | null;
  description: string;
  documents: Doc[];
}

interface AddDetailsFormValues {
  creationSource: ClaimItemSourceEnum;
  description: string;
  documents: Doc[];
  myCreationLink: string;
}

export interface AddDetailsStepProps {
  onNext: (result: AddDetailsResult) => void;
  onBack: () => void;
}

const AddDetailsStep: FunctionComponent<AddDetailsStepProps> = ({ onNext, onBack }) => {
  const { ready, translate } = useTranslation();

  const formMethods = useForm<AddDetailsFormValues>({
    defaultValues: {
      creationSource: ClaimItemSourceEnum.OnRoblox,
      description: '',
      documents: [],
      myCreationLink: '',
    },
    mode: 'onChange',
  });

  const handleNext = useCallback(
    (formData: AddDetailsFormValues) => {
      onNext({
        creationSource: formData.creationSource,
        originalContent: parseOriginalContent(formData.myCreationLink),
        description: formData.description,
        documents: formData.documents,
      });
    },
    [onNext],
  );

  if (!ready) {
    return null;
  }

  const { isValid } = formMethods.formState;

  return (
    <FormProvider {...formMethods}>
      <Grid container direction='column' width='70%' spacing={2}>
        <MyCreationSection />
        <Grid item>
          <Typography variant='h5'>{translate('Heading.AdditionalDetails')}</Typography>
        </Grid>
        <Grid item>
          <ControlledDescription
            description={formMethods.watch('description')}
            control={formMethods.control}
            error={formMethods.formState.errors.description}
            placeholderKey='Description.Description'
          />
        </Grid>
        <Grid item>
          <DocumentUploader
            translate={translate}
            maxCount={6}
            placeholder={translate('Label.DragHereToUpload')}
            acceptedMIMETypes={['application/pdf', 'image/jpeg', 'image/png']}
            required={false}
          />
        </Grid>
        <Grid item>
          <ApplyFooter
            primaryLabel={translate('Label.Next')}
            primaryEnabled={isValid}
            secondaryLabel={translate('Label.Back')}
            onNext={formMethods.handleSubmit(handleNext)}
            onBack={onBack}
          />
        </Grid>
      </Grid>
    </FormProvider>
  );
};

export default withTranslation(AddDetailsStep, [TranslationNamespace.RightsPortal]);
