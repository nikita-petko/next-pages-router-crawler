import type React from 'react';
import type { Control, FieldErrors, SubmitHandler } from 'react-hook-form';
import type { Money } from '@rbx/client-developer-subscriptions-api/v1';
import { ThumbnailTypes } from '@rbx/thumbnails';
import {
  Alert,
  AlertTitle,
  Button,
  Divider,
  FileCopyOutlinedIcon,
  Grid,
  IconButton,
  Typography,
} from '@rbx/ui';
import type { GetExperienceSubscriptionResponse } from '@modules/clients/experienceSubscriptions';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import type { CreateSubscriptionFormType } from '../../../constants/CreateSubscriptionRegisterConstants';
import { ImageDimension } from '../../../constants/CreateSubscriptionRegisterConstants';
import CreateSubscriptionCurrencyTypeSelect from '../../CreateExperienceSubscriptionForm/ui/CreateSubscriptionCurrencyTypeSelect';
import CreateSubscriptionFiatRobuxDescriptionInput from '../../CreateExperienceSubscriptionForm/ui/CreateSubscriptionFiatRobuxDescriptionInput';
import CreateSubscriptionFiatRobuxNameInput from '../../CreateExperienceSubscriptionForm/ui/CreateSubscriptionFiatRobuxNameInput';
import CreateSubscriptionFiatRobuxProductTypeSelect from '../../CreateExperienceSubscriptionForm/ui/CreateSubscriptionFiatRobuxProductTypeSelect';
import CreateSubscriptionPeriodSelect from '../../CreateExperienceSubscriptionForm/ui/CreateSubscriptionPeriodSelect';
import ExperienceSubscriptionDialog from '../../ExperienceSubscriptionDialog';
import ExperienceSubscriptionFormErrorText from '../../ExperienceSubscriptionFormErrorText';

type ConfigureExperienceFiatRobuxSubscriptionFormUIProps = {
  // Styles
  formContainer: string;
  createButton: string;
  errorMessageStyle: string;
  inputFormPadding: string;
  buttonContainerStyle: string;
  copyIconStyle: string;
  revshareCard: string;
  bottomGrid: string;
  // View state
  isCompactView: boolean;
  shouldFoldRevshareDemoInConfigurationForm: boolean;
  // Translation
  translate: (key: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- translateHTML callback type from intl library
  translateHTML: (key: string, replacements?: any[]) => React.ReactNode;
  // Data
  experienceSubscriptionDetailsInfo: GetExperienceSubscriptionResponse;
  // Form state
  control: Control<CreateSubscriptionFormType>;
  errors: FieldErrors<CreateSubscriptionFormType>;
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  isDirty: boolean;
  inputDescription: string;
  inputFile: File | null | undefined;
  watchedCurrencyType: string;
  // Data
  priceTierMap?: Record<string, Money>;
  // Component state
  canUpdateDescription: boolean;
  subscriptionErrorMsg: string;
  subscriptionErrorArgs?: { [key: string]: string };
  isConfigureDialogShown: boolean;
  // Callbacks
  copyToClipboard: (e: React.MouseEvent<HTMLButtonElement>) => void;
  handleFileChange: (file: File | null) => void;
  handleFormCancel: () => void;
  renderRevShareCalculationSelectedPrice: () => React.ReactNode;
  handleSubmit: (
    onSubmit: SubmitHandler<CreateSubscriptionFormType>,
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  handleFormSubmit: SubmitHandler<CreateSubscriptionFormType>;
  setIsConfigureDialogShown: (value: boolean) => void;
  onPriceSelect: (priceTierKey: string) => void;
  onRobuxPriceChange?: (priceInRobux: number) => void;
  canAccessExperienceSubscription?: boolean;
  // Links
  communityStandardsLink: (chunks: React.ReactNode) => React.ReactNode;
  termsOfUseLink: (chunks: React.ReactNode) => React.ReactNode;
  // Demo component
  revshareStatDemo: React.ReactNode;
};

function ConfigureExperienceFiatRobuxSubscriptionFormUI({
  formContainer,
  createButton,
  errorMessageStyle,
  inputFormPadding,
  buttonContainerStyle,
  copyIconStyle,
  revshareCard,
  bottomGrid,
  isCompactView,
  shouldFoldRevshareDemoInConfigurationForm,
  translate,
  translateHTML,
  experienceSubscriptionDetailsInfo,
  control,
  errors,
  isSubmitting,
  isValidating,
  isValid,
  isDirty,
  inputDescription,
  inputFile,
  priceTierMap,
  canUpdateDescription,
  subscriptionErrorMsg,
  subscriptionErrorArgs,
  isConfigureDialogShown,
  copyToClipboard,
  handleFileChange,
  handleFormCancel,
  handleSubmit,
  handleFormSubmit,
  setIsConfigureDialogShown,
  communityStandardsLink,
  termsOfUseLink,
  revshareStatDemo,
  onPriceSelect,
  onRobuxPriceChange,
  canAccessExperienceSubscription,
}: ConfigureExperienceFiatRobuxSubscriptionFormUIProps) {
  return (
    <>
      <Grid container item direction='column' classes={{ root: formContainer }}>
        <Typography variant={isCompactView ? 'h3' : 'h1'}>
          {translate('Heading.UpdateSubscription')}
        </Typography>

        <Grid container item direction='row' marginTop={-2}>
          <Grid container item direction='row' alignItems='center'>
            <Typography color='primary' variant='subtitle1'>
              {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- "EXP-" is a product identifier prefix, not translatable */}
              {`${translate('Label.SubscriptionID')}: EXP-${experienceSubscriptionDetailsInfo.id}`}
            </Typography>
            <IconButton
              aria-label='copy'
              color='secondary'
              size='small'
              classes={{ root: copyIconStyle }}
              onClick={copyToClipboard}>
              <FileCopyOutlinedIcon fontSize='small' />
            </IconButton>
          </Grid>
          <br />
          <Typography color='primary' variant='subtitle1'>
            {`${translate('Label.LastUpdated')}: ${new Date(
              experienceSubscriptionDetailsInfo.updatedTimestampMs ?? 0,
            ).toLocaleString()}`}
          </Typography>
        </Grid>

        {!canUpdateDescription && (
          <Alert
            severity='warning'
            variant='outlined'
            sx={{
              border: 0,
            }}>
            <AlertTitle>{translate('Heading.UpdateSubscriptionWarning')}</AlertTitle>
          </Alert>
        )}

        <Grid container item direction='row' XSmall={12}>
          <ThumbnailImageUploader
            onChange={handleFileChange}
            imageType={['jpg', 'png', 'bmp']}
            imageDimensionWidth={ImageDimension}
            imageDimensionHeight={ImageDimension}
            targetId={experienceSubscriptionDetailsInfo.imageAssetId ?? undefined}
            targetType={ThumbnailTypes.assetThumbnail}
          />
        </Grid>

        <Grid container item direction='row'>
          <CreateSubscriptionFiatRobuxNameInput control={control} errors={errors} disabled />
        </Grid>

        <Grid container item direction='row' classes={{ root: inputFormPadding }}>
          <Grid item XSmall={12} Medium={12} XXLarge={8} Large={7} XLarge={8}>
            <Grid container item direction='row' classes={{ root: inputFormPadding }}>
              <CreateSubscriptionFiatRobuxDescriptionInput control={control} errors={errors} />

              <CreateSubscriptionPeriodSelect control={control} errors={errors} />

              <CreateSubscriptionCurrencyTypeSelect
                control={control}
                errors={errors}
                inputFormPadding={inputFormPadding}
                priceTierMap={priceTierMap}
                onPriceSelect={onPriceSelect}
                onRobuxPriceChange={onRobuxPriceChange}
                existingCurrencyType={experienceSubscriptionDetailsInfo.currencyType}
                existingRobuxPrice={experienceSubscriptionDetailsInfo.priceInRobux}
                existingBasePriceId={experienceSubscriptionDetailsInfo.basePriceId}
                canAccessExperienceSubscription={canAccessExperienceSubscription}
              />

              {shouldFoldRevshareDemoInConfigurationForm && (
                <Grid
                  item
                  XLarge={4}
                  XSmall={12}
                  Medium={6}
                  Large={5}
                  classes={{ root: revshareCard }}>
                  {revshareStatDemo}
                </Grid>
              )}
            </Grid>
          </Grid>
          {!shouldFoldRevshareDemoInConfigurationForm && (
            <Grid item XLarge={4} XSmall={12} Medium={6} Large={5} classes={{ root: revshareCard }}>
              {revshareStatDemo}
            </Grid>
          )}
        </Grid>

        <CreateSubscriptionFiatRobuxProductTypeSelect
          control={control}
          errors={errors}
          bottomGrid={bottomGrid}
          disabled
        />

        <Grid container item XSmall={12} XLarge={8} direction='column'>
          <Grid item XSmall={12}>
            <Divider />
          </Grid>
          <Grid item XSmall={12} classes={{ root: buttonContainerStyle }}>
            <Grid container direction={isCompactView ? 'column' : 'row'}>
              <Button
                variant='outlined'
                color='primary'
                size='large'
                onClick={handleFormCancel}
                disabled={isSubmitting}>
                {translate('Action.Cancel')}
              </Button>
              <Button
                classes={{ root: createButton }}
                data-testid='save-changes-button'
                variant='contained'
                size='large'
                disabled={(!isValidating && !isValid) || !isDirty}
                onClick={() => setIsConfigureDialogShown(true)}
                loading={isSubmitting}>
                {translate('Action.SaveChanges')}
              </Button>
            </Grid>
            <ExperienceSubscriptionFormErrorText
              subscriptionErrorMsg={subscriptionErrorMsg}
              subscriptionErrorArgs={subscriptionErrorArgs}
              errorMessageStyle={errorMessageStyle}
              communityStandardsLink={communityStandardsLink}
            />
          </Grid>
        </Grid>
      </Grid>
      <ExperienceSubscriptionDialog
        isOpen={isConfigureDialogShown}
        onConfirm={handleSubmit(handleFormSubmit)}
        onCancel={() => setIsConfigureDialogShown(false)}
        title='Heading.UpdateSubscription'
        content={
          <>
            <Typography color='primary' paragraph>
              {inputDescription !== experienceSubscriptionDetailsInfo.description &&
                translateHTML('Description.UpdateSubscriptionConfirmation', [
                  {
                    opening: 'LinkStart',
                    closing: 'LinkEnd',
                    content(chunks: React.ReactNode) {
                      return termsOfUseLink(chunks);
                    },
                  },
                ])}
            </Typography>
            <Typography color='primary' paragraph>
              {inputFile !== null &&
                inputFile !== undefined &&
                translate('Message.UpdateSubscriptionConfirmation')}
            </Typography>
          </>
        }
        confirmText='Action.YesConfirm'
        cancelText='Action.NoGoBack'
        loading={isSubmitting}
      />
    </>
  );
}

export default ConfigureExperienceFiatRobuxSubscriptionFormUI;
