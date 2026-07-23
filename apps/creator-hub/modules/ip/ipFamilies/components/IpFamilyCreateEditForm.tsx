import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import type { IPFamily } from '@rbx/client-rights/v1';
import {
  IPFamilyLicensingEligibilityReasonsEnum,
  IPFamilyOwnershipTypesEnum,
  IPFamilyRightsScopesEnum,
} from '@rbx/client-rights/v1';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { Radio, RadioGroup, Checkbox } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Grid,
  Typography,
  makeStyles,
  TextField,
  Button,
  FormControlLabel,
  Link as MuiLink,
} from '@rbx/ui';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import type { Doc } from '@modules/miscellaneous/components/uploaders/components/MultiDocumentUploader/MultiDocumentUploader';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { LicenseManagerLegalAgreement } from '../../common/TermsOfUseLink';
import { useCurrentAccountContext } from '../../components/AccountProvider';
import {
  getMaxLengthValidationRule,
  TextFieldWithEnhancedHelperText,
} from '../../components/TextFieldWithEnhancedHelperText';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import { DocumentUploader } from '../../rights/components/documents/DocumentForm';
import { MAX_IP_FAMILY_NAME_LENGTH } from '../constants';
import { IP_FAMILIES_HREF, ROBLOX_CUBE_ANNOUNCEMENT_HREF } from '../urls';
import IpFamiliesBreadcrumbs from './IpFamiliesBreadcrumbs';

enum IpFamilyInterest {
  LicensingAndAdvancedTooling = 'LICENSING_AND_ADVANCED_TOOLING',
  AdvancedTooling = 'ADVANCED_TOOLING',
}

interface IpFamilyRegisterProps {
  isEditing: boolean;
  ipFamily?: IPFamily;
  handleSave: (data: IPFormData) => void;
  isSubmitting: boolean;
}

export type IPFormData = {
  name: string;
  interest: string;
  hasIpPortfolio: boolean;
  existingLicense: boolean;
  exclusiveRights: boolean;
  worldwideRights: boolean;
  hasRegisteredCopyright: boolean;
  hasRegisteredTrademark: boolean;
  documents: Doc[];
  ownershipUrls: string;
  ownershipContext: string;
  licensingTerms: boolean;
  genAiOptOut: boolean;
};

const useStyles = makeStyles()(() => ({
  main: {
    paddingRight: 36,
  },
  gapBottomSmall: {
    marginBottom: 8,
  },
  radioLabel: {
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 24,
  },
  gapTop: {
    marginTop: 8,
  },
  gapBottom: {
    marginBottom: 16,
  },
  error: {
    display: 'block',
    marginLeft: 16,
    marginTop: 8,
  },
  gapLeft: {
    marginLeft: 1,
  },
  sectionError: {
    display: 'block',
    marginTop: 8,
  },
}));

/**
 * Form to create / edit a new IP family.
 */
const IpFamilyCreateEditForm: FunctionComponent<IpFamilyRegisterProps> = ({
  isEditing,
  ipFamily,
  handleSave,
  isSubmitting,
}) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useStyles();
  const {
    isFetched: isIXPFetched,
    params: { enableGenAiOptOut },
  } = useIXPParameters(IXPLayers.RightsManager, { restoreInitialValueFromCache: true });
  const { account } = useCurrentAccountContext();

  const { setPageTitle } = useIpLayoutContext();
  const [hasClickedLink, setHasClickedLink] = useState(false);

  const formMethods = useForm<IPFormData>({
    defaultValues: {
      name: '',
      interest: '',
      hasIpPortfolio: false,
      existingLicense: false,
      exclusiveRights: false,
      worldwideRights: false,
      hasRegisteredCopyright: false,
      hasRegisteredTrademark: false,
      documents: [],
      ownershipUrls: '',
      ownershipContext: '',
      licensingTerms: false,
    },
    mode: 'onSubmit',
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty },
  } = formMethods;
  const selectedInterest = watch('interest');

  const handleFormSubmit = (data: IPFormData) => {
    handleSave(data);
  };

  useEffect(() => {
    if (ipFamily) {
      const hasIpPortfolio =
        ipFamily.licensingEligibilityReasons?.includes(
          IPFamilyLicensingEligibilityReasonsEnum.SubstantialPortfolio,
        ) ?? false;
      const existingLicense =
        ipFamily.licensingEligibilityReasons?.includes(
          IPFamilyLicensingEligibilityReasonsEnum.ExistingLicenseWithRobloxCreators,
        ) ?? false;

      const exclusiveRights =
        ipFamily.rightsScopes?.includes(IPFamilyRightsScopesEnum.Exclusive) ?? false;
      const worldwideRights =
        ipFamily.rightsScopes?.includes(IPFamilyRightsScopesEnum.Worldwide) ?? false;

      const hasRegisteredCopyright =
        ipFamily.ownershipTypes?.includes(IPFamilyOwnershipTypesEnum.Copyright) ?? false;
      const hasRegisteredTrademark =
        ipFamily.ownershipTypes?.includes(IPFamilyOwnershipTypesEnum.Trademark) ?? false;

      const formDataForReset = {
        name: ipFamily.name,
        interest: ipFamily.licensingInterest
          ? IpFamilyInterest.LicensingAndAdvancedTooling
          : IpFamilyInterest.AdvancedTooling,
        hasIpPortfolio,
        existingLicense,
        exclusiveRights,
        worldwideRights,
        hasRegisteredCopyright,
        hasRegisteredTrademark,
        ownershipUrls: ipFamily.ownershipUrls?.join('\n') || '',
        ownershipContext: ipFamily.ownershipContext || '',
        documents: [],
        genAiOptOut: ipFamily.genAiOptOut ?? false,
      };
      reset(formDataForReset);
    }
  }, [ipFamily, reset]);

  useEffect(() => {
    setPageTitle(
      <IpFamiliesBreadcrumbs
        pages={[
          {
            title: isEditing
              ? translate('Heading.EditIpOwnership')
              : translate('Heading.CreateIpFamily'),
          },
        ]}
      />,
    );
  }, [setPageTitle, translate, isEditing]);

  if (!isIXPFetched || !account) {
    return null;
  }

  return (
    <FormProvider {...formMethods}>
      <Grid
        container
        direction='column'
        spacing={4}
        maxWidth={750}
        component='form'
        className={classes.main}
        onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid item>
          <Typography variant='h1' component='h1' className={classes.gapBottomSmall}>
            {isEditing ? translate('Heading.EditIpOwnership') : translate('Heading.CreateIpFamily')}
          </Typography>
          <Typography
            variant='body1'
            component='p'
            color='secondary'
            className={classes.gapBottomSmall}>
            {translateHTML('Description.CreateIpFamily2', [
              {
                opening: 'hereStart',
                closing: 'hereEnd',
                content(chunks) {
                  return (
                    <Link
                      href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/ip-licensing`}
                      passHref
                      target='_blank'
                      legacyBehavior>
                      <MuiLink color='primary'>{chunks}</MuiLink>
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </Grid>
        <Grid item>
          <Controller
            name='name'
            control={control}
            rules={{
              required: translate('Label.FieldIsRequired'),
              validate: getMaxLengthValidationRule(MAX_IP_FAMILY_NAME_LENGTH, translate),
            }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                id='ip-family-name'
                label={translate('Label.IpName')}
                fullWidth
                error={!!error}
                helperText={error?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        <Grid item>
          <Typography variant='h5' component='h2' className={classes.gapBottomSmall}>
            {translate('Heading.InterestedInLicensing')}
          </Typography>
          <Typography
            variant='body1'
            component='p'
            className={classes.gapBottomSmall}
            color='secondary'>
            {translate('Description.InterestedInLicensing')}
          </Typography>
          <Controller
            name='interest'
            control={control}
            rules={{ required: translate('Label.FieldIsRequired') }}
            render={({ field, fieldState: { error } }) => (
              <>
                <RadioGroup value={field.value} onValueChange={field.onChange} size='Medium'>
                  <Radio
                    value={IpFamilyInterest.LicensingAndAdvancedTooling}
                    label={translate('Label.Yes')}
                    isDisabled={isSubmitting}
                  />
                  <Radio
                    value={IpFamilyInterest.AdvancedTooling}
                    label={translate('Label.No')}
                    isDisabled={isSubmitting}
                  />
                </RadioGroup>
                {error && (
                  <Typography variant='caption' color='error' className={classes.gapTop}>
                    {error.message}
                  </Typography>
                )}
              </>
            )}
          />
        </Grid>

        {selectedInterest === IpFamilyInterest.LicensingAndAdvancedTooling && (
          <>
            <Grid item>
              <Typography variant='h5' component='h2' className={classes.gapBottomSmall}>
                {translate('Heading.LicenseHolderType')}
              </Typography>
              <Typography
                variant='body1'
                component='p'
                className={classes.gapBottomSmall}
                color='secondary'>
                {translate('Description.SelectAtLeastOne')}
              </Typography>
              <Grid container direction='column' spacing={1}>
                <Grid item>
                  <Controller
                    name='hasIpPortfolio'
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        size='Large'
                        placement='Start'
                        label={translate('Label.SubstantialIpPortfolio')}
                        isChecked={field.value}
                        isDisabled={isSubmitting}
                        onCheckedChange={field.onChange}
                        hint={translate('Description.SubstantialIpPortfolio')}
                      />
                    )}
                  />
                </Grid>
                <Grid item>
                  <Controller
                    name='existingLicense'
                    control={control}
                    rules={{
                      validate: (value, formValues) => {
                        if (!formValues.hasIpPortfolio && !value) {
                          return translate('Error.AtLeastOneRequired');
                        }
                        return true;
                      },
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <React.Fragment>
                        <Checkbox
                          size='Large'
                          placement='Start'
                          label={translate('Label.ExistingLicense')}
                          isChecked={field.value}
                          isDisabled={isSubmitting}
                          onCheckedChange={field.onChange}
                          hint={translate('Description.ExistingLicense')}
                        />
                        {error && (
                          <Typography variant='caption' color='error' className={classes.error}>
                            {error.message}
                          </Typography>
                        )}
                      </React.Fragment>
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              <Typography variant='h5' component='h2' className={classes.gapBottomSmall}>
                {translate('Heading.RightsScope')}
              </Typography>
              <Typography
                variant='body1'
                component='p'
                className={classes.gapBottomSmall}
                color='secondary'>
                {translate('Description.MustMeetCriteria')}
              </Typography>
              <Controller
                name='exclusiveRights'
                control={control}
                rules={{ required: translate('Label.FieldIsRequired') }}
                render={({ field, fieldState: { error } }) => (
                  <React.Fragment>
                    <Checkbox
                      size='Large'
                      placement='Start'
                      label={translate('Label.ExclusiveWorldwideRights')}
                      isChecked={field.value}
                      isDisabled={isSubmitting}
                      onCheckedChange={field.onChange}
                      hint={translate('Description.ExclusiveWorldwideRights')}
                    />
                    {error && (
                      <Typography variant='caption' color='error' className={classes.error}>
                        {error.message}
                      </Typography>
                    )}
                  </React.Fragment>
                )}
              />
            </Grid>
          </>
        )}

        {selectedInterest === IpFamilyInterest.AdvancedTooling && (
          <Grid item>
            <Typography variant='h5' component='h2' className={classes.gapBottomSmall}>
              {translate('Heading.RightsScope')}
            </Typography>
            <Grid container direction='column' spacing={1}>
              <Grid item>
                <Controller
                  name='hasRegisteredCopyright'
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      size='Large'
                      placement='Start'
                      label={translate('Label.RegisteredCopyright')}
                      isChecked={field.value}
                      isDisabled={isSubmitting}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </Grid>
              <Grid item>
                <Controller
                  name='hasRegisteredTrademark'
                  control={control}
                  rules={{
                    validate: (value, formValues) => {
                      if (!formValues.hasRegisteredCopyright && !value) {
                        return translate('Error.AtLeastOneRequired');
                      }
                      return true;
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <Checkbox
                        size='Large'
                        placement='Start'
                        label={translate('Label.RegisteredTrademark')}
                        isChecked={field.value}
                        isDisabled={isSubmitting}
                        onCheckedChange={field.onChange}
                      />
                      {error && (
                        <Typography variant='caption' color='error' className={classes.error}>
                          {error.message}
                        </Typography>
                      )}
                    </>
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
        )}

        {selectedInterest && (
          <Grid item>
            <Grid container direction='column' spacing={1.5}>
              <Grid item>
                <Typography variant='h5' component='h2' className={classes.gapBottomSmall}>
                  {translate('Heading.IpOwnershipDocumentation')}
                </Typography>
                <Typography
                  variant='body1'
                  component='p'
                  color='secondary'
                  className={classes.gapBottom}>
                  {selectedInterest === IpFamilyInterest.LicensingAndAdvancedTooling
                    ? translate('Description.SupportDocumentationExclusive')
                    : translate('Description.IPFamilyDocuments')}
                </Typography>
                <DocumentUploader
                  maxCount={3}
                  placeholder={translate('Label.DragAndDropFiles')}
                  acceptedMIMETypes={['application/pdf']}
                  translate={translate}
                  enableReactHookFormError
                  required={false}
                  maxSizeMB={20}
                />
              </Grid>

              <Grid item>
                <Controller
                  name='ownershipUrls'
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextFieldWithEnhancedHelperText
                      {...field}
                      id='ownership-urls'
                      label={translate('Label.IpDocumentationUrls')}
                      placeholder={`www.example.com\nwww.example.com/presskit`}
                      fullWidth
                      multiline
                      minRows={4}
                      style={{ minHeight: 100 }}
                      error={!!error}
                      helperText={error?.message ?? translate('Description.OwnershipUrls')}
                      disabled={isSubmitting}
                      showHelperTextOnlyOnFocusOrError
                    />
                  )}
                />
              </Grid>

              <Grid item>
                <Controller
                  name='ownershipContext'
                  control={control}
                  rules={{
                    validate: (_, formValues) => {
                      if (formValues.documents.length === 0 && !formValues.ownershipUrls) {
                        return translate('Error.DocumentOrUrl');
                      }
                      return true;
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <TextFieldWithEnhancedHelperText
                        {...field}
                        id='ownership-context'
                        label={translate('Label.AdditionalDetails')}
                        fullWidth
                        helperText={translate('Description.OwnershpContext')}
                        showHelperTextOnlyOnFocusOrError
                        disabled={isSubmitting}
                      />
                      {error && (
                        <Typography
                          variant='caption'
                          color='error'
                          className={classes.sectionError}>
                          {error.message}
                        </Typography>
                      )}
                    </>
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
        )}
        {selectedInterest === IpFamilyInterest.LicensingAndAdvancedTooling &&
          account.licTermsSeenAt === undefined && (
            <Grid item>
              <Typography variant='h5' component='h2' className={classes.gapBottomSmall}>
                {translate('Heading.LegalAgreements')}
              </Typography>
              <Grid container direction='column' spacing={1}>
                <Grid item>
                  <Controller
                    name='licensingTerms'
                    control={control}
                    rules={{
                      validate: (value) => {
                        if (
                          selectedInterest !== IpFamilyInterest.LicensingAndAdvancedTooling &&
                          account.licTermsSeenAt !== undefined
                        ) {
                          return true;
                        }

                        if (!hasClickedLink) {
                          return translate('Label.ViewTermsOfUse');
                        }

                        if (!value) {
                          return translate('Label.FieldIsRequired');
                        }

                        return true;
                      },
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <FormControlLabel
                          className={classes.gapLeft}
                          disabled={!hasClickedLink || isSubmitting}
                          control={
                            <Checkbox
                              size='Large'
                              placement='Start'
                              label=' '
                              isChecked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          }
                          label={translateHTML('Label.LicenseManagerAgreement', [
                            {
                              opening: 'linkStart',
                              closing: 'linkEnd',
                              content(chunks) {
                                return (
                                  <LicenseManagerLegalAgreement
                                    onClick={() => setHasClickedLink(true)}>
                                    {chunks}
                                  </LicenseManagerLegalAgreement>
                                );
                              },
                            },
                          ])}
                        />
                        {error && (
                          <Typography variant='caption' color='error' className={classes.error}>
                            {error.message}
                          </Typography>
                        )}
                      </>
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>
          )}

        {enableGenAiOptOut && (
          <Grid item>
            <Typography variant='h5' component='h2' gutterBottom>
              {translate('Heading.GenAiOptOut')}
            </Typography>
            <Controller
              name='genAiOptOut'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      size='Large'
                      placement='Start'
                      label=''
                      isChecked={field.value}
                      isDisabled={isSubmitting}
                      onCheckedChange={field.onChange}
                    />
                  }
                  label={translateHTML('Label.GenAiOptOut2', [
                    {
                      opening: 'linkStart',
                      closing: 'linkEnd',
                      content(chunks) {
                        return (
                          <Link href={ROBLOX_CUBE_ANNOUNCEMENT_HREF} target='_blank'>
                            {chunks}
                          </Link>
                        );
                      },
                    },
                  ])}
                />
              )}
            />
          </Grid>
        )}
        <Grid item className={classes.submitButton}>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant='contained'
                href={IP_FAMILIES_HREF}
                component={Link}
                color='secondary'
                disabled={isSubmitting}>
                {translate('Label.Cancel')}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant='contained'
                type='submit'
                color='primaryBrand'
                loading={isSubmitting}
                disabled={isSubmitting || isEditing ? !isDirty : false}>
                {isEditing ? translate('Action.ReSubmit') : translate('Action.SubmitForReview')}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </FormProvider>
  );
};

export default withTranslation(IpFamilyCreateEditForm, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.RightsPortal,
]);
