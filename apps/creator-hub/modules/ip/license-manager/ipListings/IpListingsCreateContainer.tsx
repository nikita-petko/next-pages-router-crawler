import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import { IP_LISTING_DETAILS_HREF, IP_LISTINGS_HREF } from '../urls';
import type { FormStore } from './components/IpListingForm';
import IpListingForm from './components/IpListingForm';
import IpListingsBreadcrumbs from './components/IpListingsBreadcrumbs';
import { useCreateIpListingMutation } from './hooks/ipListings';

/**
 * Create a new IP listing. Licenses are added separately from the listing details page.
 */
const IpListingsCreateContainer = () => {
  const router = useRouter();
  const { translate } = useTranslation();
  const createIpListingMutation = useCreateIpListingMutation();
  const { setPageTitle } = useIpLayoutContext();

  useEffect(() => {
    setPageTitle(
      <IpListingsBreadcrumbs
        pages={[
          {
            title: translate('Heading.CreateLicenseListing'),
          },
        ]}
      />,
    );
  }, [setPageTitle, translate]);

  const handleSubmit = async (data: FormStore) => {
    try {
      const createdListing = await createIpListingMutation.mutateAsync({
        ipFamilyId: data.ipFamilyId,
        name: data.name,
        description: data.description,
        thumbnails: data.thumbnails,
      });

      if (createdListing.id) {
        await router.push(IP_LISTING_DETAILS_HREF(createdListing.id));
      }
    } catch {
      // Error handling is done through mutation hooks
    }
  };

  const handleCancel = () => {
    void router.push(IP_LISTINGS_HREF);
  };

  return (
    <Grid container direction='column' spacing={4} data-testid='ip-listings-create-container'>
      <Grid item>
        <Typography variant='h1' component='h1'>
          {translate('Heading.CreateLicenseListing')}
        </Typography>
      </Grid>

      <Grid item>
        <IpListingForm
          defaultValues={{
            ipFamilyId: '',
            name: '',
            description: '',
            thumbnails: [],
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitButtonText={translate('Action.Create')}
          isSubmitting={createIpListingMutation.isPending}
        />
      </Grid>

      {createIpListingMutation.error && (
        <Grid item>
          <FailureView message={translate('Error.CreateIpListingFailed')} />
        </Grid>
      )}
    </Grid>
  );
};

export default withTranslation(IpListingsCreateContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.Licenses,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.Controls,
]);
