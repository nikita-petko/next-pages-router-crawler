import { Fragment, useEffect, useState, useRef } from 'react';
import { Button, Grid, Step, StepLabel, Stepper, Typography } from '@rbx/ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DauBucket, LicenseVisibility } from '@rbx/clients/contentLicensingApi/v1';
import { useRouter } from 'next/router';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import { IP_LISTINGS_HREF } from '../urls';
import { useCreateIpListingMutation, useAddLicenseMutation } from './hooks/ipListings';
import { FormStore } from './components/IpListingForm';
import { LicenseFormData } from './components/LicenseForm';
import IpListingsBreadcrumbs from './components/IpListingsBreadcrumbs';
import CreateListingStep from './components/CreateListingStep';
import AddLicenseStep from './components/AddLicenseStep';
import ReviewStep from './components/ReviewStep';
import { MonitorType } from './components/licenseFormTypes';
import { convertContentStandardsQuestionAnswerToRequest } from '../utils/guidelinesAndRestrictions';

enum Steps {
  CreateListing,
  AddLicense,
  Review,
}

/**
 * Create a new IP Listing / License Listing using a wizard approach
 */
const IpListingsCreateContainer = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const [activeStep, setActiveStep] = useState(Steps.CreateListing);
  const [listingFormData, setListingFormData] = useState<FormStore | null>(null);
  const [licenseFormData, setLicenseFormData] = useState<LicenseFormData | null>(null);
  const stepperRef = useRef<HTMLDivElement>(null);

  const createIpListingMutation = useCreateIpListingMutation();
  const addLicenseMutation = useAddLicenseMutation();

  const { setPageTitle } = useIpLayoutContext();

  useEffect(() => {
    setPageTitle(<IpListingsBreadcrumbs pages={[{ title: translate('Heading.Create') }]} />);
  }, [setPageTitle, translate]);

  useEffect(() => {
    // Since forms can be long and have scrollbars, we'll want to scoll back to the top of the form
    // when changing steps.
    if (stepperRef.current) {
      stepperRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeStep]);

  const handleSubmit = async () => {
    if (!listingFormData) {
      // Make TS happy. Should never happen.
      return;
    }

    try {
      const createdListing = await createIpListingMutation.mutateAsync({
        ipFamilyId: listingFormData.ipFamilyId,
        name: listingFormData.name,
        description: listingFormData.description,
        thumbnails: listingFormData.thumbnails,
      });

      if (licenseFormData && createdListing.id) {
        await addLicenseMutation.mutateAsync({
          listingId: createdListing.id,
          royaltyRate: licenseFormData.revenueShare,
          maxAgeRating: licenseFormData.maxMaturityRating,
          dau7DayThreshold: licenseFormData.minimumDAU,
          name: licenseFormData.name,
          description: licenseFormData.description,
          visibility: licenseFormData.visibility ?? LicenseVisibility.Private,
          enableMonetization: licenseFormData.monitorType === MonitorType.MonitorAndRevshare,
          contentStandardsDocument: licenseFormData.contentStandardsFile,
          contentStandardScope: licenseFormData.contentStandardScope,
          contentStandardAnswers: convertContentStandardsQuestionAnswerToRequest(
            licenseFormData.contentStandardAnswers,
          ),
          creatorDau7DayThreshold: DauBucket.None,
          countries: [],
        });
      }

      router.push(IP_LISTINGS_HREF);
    } catch {
      // Error handling is done through mutation hooks
    }
  };

  const error = createIpListingMutation.error || addLicenseMutation.error;

  return (
    <Grid container direction='column' spacing={4} data-testid='ip-listings-create-container'>
      <Grid item>
        <Typography variant='h1' component='h1'>
          {translate('Heading.CreateLicenseListing')}
        </Typography>
      </Grid>
      <Grid item ref={stepperRef} marginBottom={4}>
        <Stepper activeStep={activeStep}>
          <Step>
            <StepLabel>{translate('Heading.CreateListing')}</StepLabel>
          </Step>
          <Step>
            <StepLabel>{translate('Heading.AddLicense')}</StepLabel>
          </Step>
          <Step>
            <StepLabel>{translate('Heading.Review')}</StepLabel>
          </Step>
        </Stepper>
      </Grid>

      <Grid item>
        {activeStep === Steps.CreateListing && (
          <CreateListingStep
            onListingCreate={(data: FormStore) => {
              setListingFormData(data);
              setActiveStep((prevStep) => prevStep + 1);
            }}
            onCancel={() => router.push(IP_LISTINGS_HREF)}
            listingFormData={listingFormData}
          />
        )}
        {activeStep === Steps.AddLicense && (
          <AddLicenseStep
            onLicenseAdd={(data: LicenseFormData) => {
              setLicenseFormData(data);
              setActiveStep((prevStep) => prevStep + 1);
            }}
            onPrev={() => setActiveStep((prevStep) => prevStep - 1)}
            onSkip={() => setActiveStep(Steps.Review)}
            licenseFormData={licenseFormData}
          />
        )}
        {activeStep === Steps.Review && (
          <Fragment>
            {createIpListingMutation.error && (
              <Grid item>
                <FailureView message={translate('Error.CreateIpListingFailed')} />
              </Grid>
            )}
            {addLicenseMutation.error && (
              <Grid item justifyItems='center'>
                <FailureView message={translate('Error.ListingWorkedButCreateLicenseFailed')} />
                <Button variant='outlined' color='secondary' href={IP_LISTINGS_HREF}>
                  {translate('Button.ViewListings')}
                </Button>
              </Grid>
            )}
            {!error && (
              <ReviewStep
                onPrev={() => setActiveStep((prevStep) => prevStep - 1)}
                onSubmit={handleSubmit}
                listingFormData={listingFormData}
                licenseFormData={licenseFormData}
                isSubmitting={createIpListingMutation.isPending || addLicenseMutation.isPending}
              />
            )}
          </Fragment>
        )}
      </Grid>
    </Grid>
  );
};

export default withTranslation(IpListingsCreateContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
]);
