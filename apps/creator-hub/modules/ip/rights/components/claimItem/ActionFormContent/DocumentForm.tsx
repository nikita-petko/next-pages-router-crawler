import React from 'react';
import { Grid, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useFormContext } from 'react-hook-form';
import { DocumentUploader } from '../../documents/DocumentForm';
import ControlledDescription from '../../common/ControlledDescription';
import { DisputeFormFields } from './DisputeForm';

// DocumentForm displays the 2nd page of the dispute form that requests description and supporting documents
function DocumentForm() {
  const { translate } = useTranslation();
  const { control, formState, watch } = useFormContext<DisputeFormFields>();
  const { errors } = formState;

  const descriptionValue = watch('description');

  return (
    <Grid container item XSmall rowSpacing={4}>
      <Grid item XSmall={12}>
        <Typography>{translate('Description.SupportingInformationReview')}</Typography>
      </Grid>
      <Grid item XSmall={12}>
        <ControlledDescription
          description={descriptionValue}
          control={control}
          error={errors.description}
          labelKey='Label.Rationale'
          placeholderKey='Description.DisputeDescribe'
          required
        />
      </Grid>
      <Grid item XSmall={12}>
        <DocumentUploader
          maxCount={3}
          placeholder={translate('Label.DragHereToUpload')}
          acceptedMIMETypes={['application/pdf', 'image/jpeg', 'image/png']}
          translate={translate}
          required
        />
      </Grid>
    </Grid>
  );
}

export default withTranslation(DocumentForm, [TranslationNamespace.RightsPortal]);
