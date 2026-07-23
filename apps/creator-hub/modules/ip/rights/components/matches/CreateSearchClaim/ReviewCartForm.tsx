import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Grid, TextField, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Account } from '@rbx/clients/rightsV1';
import { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/clients/games';
import SelectedContentsDisplay from '../SelectedContentsDisplay';
import useCart from '../useCart';
import { DocumentUploader } from '../../documents/DocumentForm';
import { AddCreationsFields } from '../../createClaims/AddCreationsForm/AddCreationsForm';
import OriginalContentDisplay from '../OriginalContentDisplay';

export interface ReviewCartFormProps {
  cart: ReturnType<typeof useCart>;
  originalContent: RobloxGamesApiModelsResponsePlaceDetails | null;
  isExperienceSearch: boolean;
  account: Account;
}

/**
 * ReviewCartForm presents a form that lets you review your cart items
 */
const ReviewCartForm = ({
  cart,
  originalContent,
  isExperienceSearch,
  account,
}: ReviewCartFormProps) => {
  const { ready, translate } = useTranslation();
  const {
    control,
    formState: { errors },
  } = useFormContext<AddCreationsFields>();

  if (!ready) {
    return null;
  }

  return (
    <Grid container direction='column'>
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
          <Typography variant='h5'>{translate('Label.CreationsYoureClaiming')}</Typography>
        </Grid>
        <Grid item XSmall={12} Large={8}>
          <SelectedContentsDisplay
            cartItems={cart.items}
            removeFromCart={cart.remove}
            numPerRow={3}
          />
        </Grid>
        <Grid item XSmall={12} Large={12}>
          <Typography variant='h5'>{translate('Label.SupportingInformation')}</Typography>
        </Grid>
        <Grid item XSmall={12} Large={12}>
          <Typography variant='body1' color='secondary'>
            {translate('Description.SupportingInformationCreate')}
          </Typography>
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
                placeholder={translate('Description.DescriptionPlaceholder')}
                fullWidth
                multiline
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
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

export default withTranslation(ReviewCartForm, [TranslationNamespace.RightsPortal]);
