import { useMemo } from 'react';
import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Button, makeStyles } from '@rbx/ui';
import { ListingItemBase } from '@modules/licenses/components/ListingItem';
import { convertMinDauToEnum } from '../../utils/dauEnum';
import type { FormStore } from './IpListingForm';
import type { LicenseFormData } from './LicenseForm';
import { MonitorType } from './licenseFormTypes';
import { PreviewLicenseTable } from './LicenseTable';

const useStyles = makeStyles()(() => ({
  listingPreviewContainer: {
    // ListingItemBase doesn't itself have a width, and relies
    // on the parent container or other styles to set its width.
    // In licenses modules, it's used as part of a grid layout and
    // the grid controls the width.
    width: 322,
  },
}));

interface Props {
  onPrev: () => void;
  onSubmit: () => void;
  listingFormData: FormStore | null;
  licenseFormData: LicenseFormData | null;
  isSubmitting: boolean;
}

/**
 * Step 3: Review the IP Listing and License before submission
 */
const ReviewStep = ({
  onPrev,
  onSubmit,
  listingFormData,
  licenseFormData,
  isSubmitting,
}: Props) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  // Create a mock IPListing object from the form data for the ListingItem component
  const previewListing = listingFormData
    ? {
        id: '',
        name: listingFormData.name,
        description: listingFormData.description,
        thumbnails:
          listingFormData.thumbnails?.filter((thumbnail) => thumbnail.type === 'existing') ?? [],
      }
    : undefined;

  // Handle both cases of existing and new primary thumbnail
  // For now we'll only expect the new path to be used.
  const { thumbnailAssetId, thumbnailUrl } = useMemo(() => {
    if (!listingFormData?.thumbnails) {
      return { thumbnailAssetId: undefined, thumbnailUrl: undefined };
    }
    if (listingFormData.thumbnails[0].type === 'existing') {
      return {
        thumbnailAssetId: listingFormData.thumbnails[0].assetId,
        thumbnailUrl: undefined,
      };
    }
    return {
      thumbnailAssetId: undefined,
      thumbnailUrl: URL.createObjectURL(listingFormData.thumbnails[0].file),
    };
  }, [listingFormData]);

  // Create a mock License object from the license form data
  const previewLicenses: LicenseResponse[] = licenseFormData
    ? [
        {
          id: 'temp-id',
          name: licenseFormData.name,
          description: licenseFormData.description,
          royaltyRate: licenseFormData.revenueShare,
          maxAgeRating: licenseFormData.maxMaturityRating,
          dau7DayThreshold: convertMinDauToEnum(licenseFormData.minimumDAU),
          visibility: licenseFormData.visibility,
          accountId: '',
          listingId: '',
          enableMonetization: licenseFormData.monitorType === MonitorType.MonitorAndRevshare,
          archived: false,
          contentStandardsDocumentId: undefined,
          countries: undefined,
          creatorDau7DayThreshold: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          contentStandardsScope: licenseFormData.contentStandardScope || '',
          contentStandardAnswers: licenseFormData.contentStandardAnswers || [],
        },
      ]
    : [];

  return (
    <Grid container direction='column' spacing={4}>
      {previewListing && (
        <Grid item>
          <Typography variant='h5' component='h2' gutterBottom>
            {translate('Heading.Listing')}
          </Typography>
          <div className={classes.listingPreviewContainer}>
            <ListingItemBase
              listing={previewListing}
              thumbnailAssetId={thumbnailAssetId}
              thumbnailUrl={thumbnailUrl}
            />
          </div>
        </Grid>
      )}

      {licenseFormData ? (
        <Grid item>
          <Typography variant='h5' component='h2' gutterBottom>
            {translate('Label.Licenses')}
          </Typography>
          <PreviewLicenseTable licenses={previewLicenses} />
        </Grid>
      ) : (
        <Grid item>
          <Typography variant='h5' component='h2' gutterBottom>
            {translate('Label.Licenses')}
          </Typography>
          <Typography color='secondary'>
            {translate('Description.NoLicenseAddedWithIpListingCreation')}
          </Typography>
        </Grid>
      )}
      <Grid item container spacing={2}>
        <Grid item>
          <Button variant='outlined' onClick={onPrev} color='secondary' disabled={isSubmitting}>
            {translate('Action.Back')}
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant='contained'
            onClick={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}>
            {translate('Action.Create')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ReviewStep;
