import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, DialogActions, Grid, StickyFooter } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useCreateProductsStyles from '../../utils/CreateProducts.styles';

interface CreateProductStepperProps {
  onClickCreate: () => void;
  onClickCancel: () => void;
  onClickBack?: () => void;
  isLoading: boolean;
  primaryButtonText: string;
  primaryButtonDisabled: boolean;
  primaryButtonColor?: 'primaryBrand' | 'secondary';
}

const CreateProductsStickyFooter = ({
  onClickCreate,
  onClickCancel,
  onClickBack,
  isLoading,
  primaryButtonText,
  primaryButtonDisabled,
  primaryButtonColor,
}: CreateProductStepperProps) => {
  const { translate } = useTranslation();
  const { classes, cx } = useCreateProductsStyles();

  return (
    <Grid container direction='column' justifyContent='space-between'>
      <StickyFooter
        tertiary={{
          variant: 'contained',
          color: 'primary',
          size: 'large',
          onClick: onClickCancel,
          label: translate('Action.Cancel'),
        }}
        secondary={
          onClickBack
            ? {
                variant: 'contained',
                color: 'secondary',
                size: 'large',
                onClick: onClickBack,
                label: translate('Action.Back'),
              }
            : undefined
        }
        primary={{
          variant: 'contained',
          color: primaryButtonColor,
          size: 'large',
          loading: isLoading,
          disabled: primaryButtonDisabled,
          onClick: onClickCreate,
          label: primaryButtonText,
        }}
      />
      <DialogActions className={classes.containerPadding}>
        <Button
          className={cx(classes.tertiaryButton)}
          variant='text'
          color='secondary'
          size='large'
          onClick={onClickCancel}>
          {translate('Action.Cancel')}
        </Button>
        <Grid className={cx(classes.primaryDiv)}>
          {onClickBack && (
            <Button variant='contained' color='secondary' size='large' onClick={onClickBack}>
              {translate('Action.Back')}
            </Button>
          )}
          <Button
            variant='contained'
            color={primaryButtonColor ?? 'primaryBrand'}
            size='large'
            loading={isLoading}
            disabled={primaryButtonDisabled}
            onClick={onClickCreate}>
            {primaryButtonText}
          </Button>
        </Grid>
      </DialogActions>
    </Grid>
  );
};

export default withTranslation(CreateProductsStickyFooter, [TranslationNamespace.Commerce]);
