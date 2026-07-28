import { useContext, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { CommerceGrantableModel } from '@rbx/client-commerce-api/v1';
import { GrantableType } from '@rbx/client-commerce-api/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  CloseIcon,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { SettingsProvider } from '@modules/settings/SettingsProvider/SettingsProvider';
import { ThumbnailImage } from '../../ThumbnailImage';
import AvatarItemFormV2 from './form/AvatarItemFormV2';
import DeveloperProductForm from './form/DeveloperProductForm';
import GrantableSelection from './input/GrantableSelection';
import GrantableTypeSelect from './input/GrantableTypeSelect';
import useStyles from './styles';
import type { VirtualBenefitFormType } from './types';
import VirtualBenefitContext from './VirtualBenefitContext';

interface VirtualBenefitModalProps {
  productImageId: number;
  productImageUrl: string;
  productName: string;
  selectedCommerceProductId: string;
  existingDeveloperProductGrantables: CommerceGrantableModel[];
  onSave: (commerceProductId: string, grantables: Array<CommerceGrantableModel>) => void;
  onClose: () => void;
}

const VirtualBenefitModal = ({
  productImageId,
  productImageUrl,
  productName,
  selectedCommerceProductId,
  existingDeveloperProductGrantables,
  onSave,
  onClose,
}: VirtualBenefitModalProps) => {
  const { translate } = useTranslation();
  const [showDeveloperProductDraftForm, setShowDeveloperProductDraftForm] =
    useState<boolean>(false);

  const { watch, setValue } = useFormContext<VirtualBenefitFormType>();
  const { errorState, setErrorState } = useContext(VirtualBenefitContext);
  const selectedBenefitType = watch('grantableType');

  const { classes } = useStyles();

  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip the first render, also opens the dev product form if the selected type is dev product.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (selectedBenefitType === GrantableType.DeveloperProduct) {
        setShowDeveloperProductDraftForm(true);
      }
      return;
    }

    setValue('grantableAssetId', '');
    setValue('name', '');
    setValue('description', '');
    setValue('imageAssetId', 0);
    setValue('developerProductId', 0);
    setErrorState(null);
  }, [selectedBenefitType, setErrorState, setValue]);

  const validateNewGrantable = () => {
    if (errorState) {
      return false;
    }
    switch (selectedBenefitType) {
      case GrantableType.AvatarItem:
      case GrantableType.Bundle:
        return Boolean(watch('grantableAssetId') && watch('name') && watch('description'));
      case GrantableType.DeveloperProduct:
        return Boolean(watch('imageAssetId') && watch('name') && watch('description'));
      default:
        return false;
    }
  };

  // Currently only allow one grantable per product
  const getNewGrantable = () => {
    if (errorState) {
      return [];
    }
    const developerProductId = watch('developerProductId');

    switch (selectedBenefitType) {
      case GrantableType.AvatarItem:
      case GrantableType.Bundle:
        return [
          {
            grantableAssetId: watch('grantableAssetId'),
            name: watch('name'),
            description: watch('description'),
            grantableType: selectedBenefitType,
          } as CommerceGrantableModel,
        ];
      case GrantableType.DeveloperProduct:
        return [
          {
            name: watch('name'),
            description: watch('description'),
            grantableType: selectedBenefitType,
            imageAssetId: watch('imageAssetId'),
            ...(developerProductId
              ? { developerProductId }
              : { grantableAssetId: 'draft-dev-product' }),
          } as CommerceGrantableModel,
        ];
      default:
        return [];
    }
  };

  return (
    <>
      <DialogTitle style={{ paddingBottom: 24 }}>
        <Grid display='flex' alignItems='center' justifyContent='space-between'>
          <Typography variant='h5'>
            {translate(
              showDeveloperProductDraftForm
                ? 'Heading.CreateDeveloperProductBenefit'
                : 'Heading.AddVirtualBenefit',
            )}
          </Typography>
          <IconButton
            aria-label={translate('Action.Close')}
            onClick={onClose}
            edge='end'
            size='small'>
            <CloseIcon color='secondary' />
          </IconButton>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {showDeveloperProductDraftForm && (
          <DeveloperProductForm selectedCommerceProductId={selectedCommerceProductId} />
        )}
        {!showDeveloperProductDraftForm && (
          <Grid container direction='column'>
            <Grid item container direction='row' sx={{ mb: 2 }}>
              <Grid item XSmall={3} Medium={2} padding='12px'>
                <Grid container className={classes.thumbnailContainer}>
                  <ThumbnailImage
                    imageAssetId={productImageId}
                    imageUrl={productImageUrl}
                    alt={productName}
                  />
                </Grid>
              </Grid>
              <Grid
                item
                container
                direction='column'
                justifyContent='center'
                XSmall={9}
                Medium={10}>
                <Grid item>
                  <Typography className={classes.catalogItemText} variant='body1'>
                    {translate('Label.CatalogItem')}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography className={classes.productNameText} variant='h2'>
                    {productName}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item sx={{ paddingTop: '8px' }}>
              <GrantableTypeSelect />
            </Grid>
            {(selectedBenefitType === GrantableType.AvatarItem ||
              selectedBenefitType === GrantableType.Bundle) && (
              <SettingsProvider>
                <AvatarItemFormV2 />
              </SettingsProvider>
            )}
            {selectedBenefitType === GrantableType.DeveloperProduct && (
              <Grid item mb={2}>
                <Button
                  type='button' // Required to prevent form submission
                  color='secondary'
                  size='large'
                  variant='outlined'
                  onClick={() => {
                    setShowDeveloperProductDraftForm(true);
                    setValue('grantableAssetId', '');
                    setValue('developerProductId', 0);
                  }}>
                  {translate('Label.CreateNewDeveloperProductBenefit')}
                </Button>
              </Grid>
            )}
            {selectedBenefitType === GrantableType.DeveloperProduct && (
              <GrantableSelection
                title={translate('Heading.ExistingDeveloperProducts')}
                hasPrevious={false}
                hasNext={false}
                onSelect={async (grantableItem) => {
                  if (grantableItem === null || grantableItem === undefined) {
                    return;
                  }
                  setValue('developerProductId', grantableItem.developerProductId ?? 0);
                  setValue('name', grantableItem.name ?? '');
                  setValue('description', grantableItem.description ?? '');
                  setValue('imageAssetId', grantableItem.imageAssetId ?? 0);
                }}
                onPrevious={() => {}}
                onNext={() => {}}
                grantableItems={existingDeveloperProductGrantables.filter(
                  (grantable, index, self) =>
                    index ===
                    self.findIndex((g) => g.grantableAssetId === grantable.grantableAssetId),
                )}
                tooltipText={translate('Description.ExistingDeveloperProductsTooltip')}
              />
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant='contained'
          color='secondary'
          size='large'
          onClick={
            showDeveloperProductDraftForm ? () => setShowDeveloperProductDraftForm(false) : onClose
          }>
          {translate(showDeveloperProductDraftForm ? 'Action.Back' : 'Action.Cancel')}
        </Button>
        <Button
          variant='contained'
          color='primaryBrand'
          size='large'
          disabled={!validateNewGrantable()}
          onClick={() => {
            onSave(selectedCommerceProductId, getNewGrantable());
          }}>
          {translate('Action.Save')}
        </Button>
      </DialogActions>
    </>
  );
};

export default withTranslation(VirtualBenefitModal, [TranslationNamespace.Commerce]);
