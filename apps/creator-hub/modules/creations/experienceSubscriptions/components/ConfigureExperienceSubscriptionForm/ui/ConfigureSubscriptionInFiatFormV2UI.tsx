import { Fragment } from 'react';
import { Control, Controller, FieldErrors, SubmitHandler } from 'react-hook-form';
import {
  Alert,
  AlertTitle,
  Button,
  Divider,
  FileCopyOutlinedIcon,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@rbx/ui';
import { GetExperienceSubscriptionResponse } from '@modules/clients';
import { ThumbnailImageUploader } from '@modules/miscellaneous/common/components/uploaders';
import { ThumbnailTypes } from '@rbx/thumbnails';
import {
  CreateSubscriptionFormType,
  CreateSubscriptionRegisterOptions,
  ProductTypeMenuSelection,
  SubscriptionPeriodMenuSelection,
  ImageDimension,
} from '../../../constants/CreateSubscriptionRegisterConstants';
import ExperienceSubscriptionDialog from '../../ExperienceSubscriptionDialog';
import { ExperienceSubscriptionLimitErrorMessage } from '../../ExperienceSubscriptionFormMessages';
import ExperienceSubscriptionFormErrorText from '../../ExperienceSubscriptionFormErrorText';

type ConfigureSubscriptionInFiatFormV2UIProps = {
  // Styles
  formContainer: string;
  createButton: string;
  errorMessageStyle: string;
  inputFormPadding: string;
  buttonContainerStyle: string;
  copyIconStyle: string;
  revshareCard: string;
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
  // Component state
  canUpdateDescription: boolean;
  subscriptionErrorMsg: string;
  subscriptionBackendErrorMessage: string;
  isConfigureDialogShown: boolean;
  // Callbacks
  copyToClipboard: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  handleFileChange: (file: File | null) => void;
  handleFormCancel: () => void;
  renderRevShareCalculationSelectedPrice: () => React.ReactNode;
  handleSubmit: (
    onSubmit: SubmitHandler<CreateSubscriptionFormType>,
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  handleFormSubmit: SubmitHandler<CreateSubscriptionFormType>;
  setIsConfigureDialogShown: (value: boolean) => void;
  // Links
  communityStandardsLink: (chunks: React.ReactNode) => React.ReactNode;
  termsOfUseLink: (chunks: React.ReactNode) => React.ReactNode;
  // Demo component
  revshareStatDemo: React.ReactNode;
  // Display-only price (formatted string like "$7.99")
  displayPrice: string;
};

function ConfigureSubscriptionInFiatFormV2UI({
  formContainer,
  createButton,
  errorMessageStyle,
  inputFormPadding,
  buttonContainerStyle,
  copyIconStyle,
  revshareCard,
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
  canUpdateDescription,
  subscriptionErrorMsg,
  subscriptionBackendErrorMessage,
  isConfigureDialogShown,
  copyToClipboard,
  handleFileChange,
  handleFormCancel,
  renderRevShareCalculationSelectedPrice,
  handleSubmit,
  handleFormSubmit,
  setIsConfigureDialogShown,
  communityStandardsLink,
  termsOfUseLink,
  revshareStatDemo,
  displayPrice,
}: ConfigureSubscriptionInFiatFormV2UIProps) {
  return (
    <Fragment>
      <Grid container item direction='column' classes={{ root: formContainer }}>
        <Typography variant={isCompactView ? 'h3' : 'h1'}>
          {translate('Heading.UpdateSubscription')}
        </Typography>

        <Grid container item direction='row' marginTop={-2}>
          <Grid container item direction='row' alignItems='center'>
            <Typography color='primary' variant='subtitle1'>
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
          <Grid item Large={7} XLarge={8} XXLarge={8}>
            <Controller
              name='name'
              control={control}
              rules={CreateSubscriptionRegisterOptions.name}
              render={({ field }) => (
                <TextField
                  {...field}
                  error={!!errors.name}
                  fullWidth
                  multiline
                  required
                  disabled
                  id='name'
                  label={translate('Label.SubscriptionName')}
                  inputProps={{
                    maxLength: CreateSubscriptionRegisterOptions.name.maxLength,
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        <Grid container item direction='row' classes={{ root: inputFormPadding }}>
          <Grid item XSmall={12} Medium={12} XXLarge={8} Large={7} XLarge={8}>
            <Grid container item direction='row' classes={{ root: inputFormPadding }}>
              <Grid item XSmall={12}>
                <Controller
                  name='description'
                  control={control}
                  rules={CreateSubscriptionRegisterOptions.description}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      error={!!errors.description}
                      fullWidth
                      disabled={!canUpdateDescription}
                      multiline
                      minRows={6}
                      id='description'
                      label={translate('Label.Description')}
                      inputProps={{
                        maxLength: CreateSubscriptionRegisterOptions.description.maxLength,
                      }}
                      helperText={
                        canUpdateDescription && (
                          <ExperienceSubscriptionLimitErrorMessage
                            error={errors.description}
                            charCount={field.value.length}
                            limit={CreateSubscriptionRegisterOptions.description.maxLength}
                          />
                        )
                      }
                    />
                  )}
                />
              </Grid>

              <Grid item XSmall={12}>
                <Controller
                  name='productType'
                  control={control}
                  rules={CreateSubscriptionRegisterOptions.productType}
                  render={({ field }) => (
                    <Select
                      {...field}
                      fullWidth
                      disabled
                      error={!!errors.productType}
                      id='productType'
                      label={translate('Label.ProductType')}
                      required
                      InputProps={{
                        'aria-label': 'productType',
                      }}
                      sx={{
                        '& .MuiSelect-icon': {
                          fontSize: '0',
                        },
                      }}>
                      {ProductTypeMenuSelection.map((menuItem) => {
                        return (
                          <MenuItem
                            data-testid={`product${menuItem.value}`}
                            key={menuItem.value}
                            value={menuItem.value}>
                            <Grid container item direction='column'>
                              <Typography>{translate(menuItem.name)}</Typography>
                              <Typography variant='captionBody' color='secondary' display='block'>
                                {translate(menuItem.description)}
                              </Typography>
                            </Grid>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  )}
                />
              </Grid>

              <Grid item XSmall={12}>
                {renderRevShareCalculationSelectedPrice()}
                <TextField
                  value={displayPrice}
                  fullWidth
                  multiline
                  required
                  disabled
                  id='price'
                  label={translate('Label.Price')}
                />
              </Grid>
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

              <Grid item XSmall={12}>
                <Controller
                  name='period'
                  control={control}
                  rules={CreateSubscriptionRegisterOptions.period}
                  render={({ field }) => (
                    <Select
                      {...field}
                      fullWidth
                      error={!!errors.period}
                      id='period'
                      label={translate('Label.SubscriptionPeriod')}
                      required
                      disabled // Monthly is the only currently available recurrence cadence
                      sx={{
                        '& .MuiSelect-icon': {
                          fontSize: '0',
                        },
                      }}>
                      {SubscriptionPeriodMenuSelection.map((menuItem) => {
                        return (
                          <MenuItem key={menuItem.value} value={menuItem.value}>
                            {translate(menuItem.name)}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
          {!shouldFoldRevshareDemoInConfigurationForm && (
            <Grid
              item
              XXLarge={4}
              XLarge={4}
              XSmall={12}
              Medium={6}
              Large={5}
              classes={{ root: revshareCard }}>
              {revshareStatDemo}
            </Grid>
          )}
        </Grid>

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
                disabled={
                  (!isValidating && !isValid) ||
                  !isDirty ||
                  (inputDescription === experienceSubscriptionDetailsInfo.description &&
                    (inputFile === null || inputFile === undefined))
                }
                onClick={() => setIsConfigureDialogShown(true)}
                loading={isSubmitting}>
                {translate('Action.SaveChanges')}
              </Button>
            </Grid>
            <ExperienceSubscriptionFormErrorText
              subscriptionErrorMsg={subscriptionErrorMsg}
              subscriptionBackendErrorMessage={subscriptionBackendErrorMessage}
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
          <Fragment>
            <Typography color='primary' paragraph>
              {inputDescription !== experienceSubscriptionDetailsInfo.description &&
                translateHTML('Description.UpdateSubscriptionConfirmation', [
                  {
                    opening: 'LinkStart',
                    closing: 'LinkEnd',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- translateHTML callback type
                    content(chunks: any) {
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
          </Fragment>
        }
        confirmText='Action.YesConfirm'
        cancelText='Action.NoGoBack'
        loading={isSubmitting}
      />
    </Fragment>
  );
}

export default ConfigureSubscriptionInFiatFormV2UI;
