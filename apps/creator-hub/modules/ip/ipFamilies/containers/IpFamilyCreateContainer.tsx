import React, { useEffect } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  IPFamilyLicensingEligibilityReasonsEnum,
  IPFamilyOwnershipTypesEnum,
  IPFamilyRightsScopesEnum,
} from '@rbx/clients/rightsV1/v1';
import { useRouter } from 'next/router';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import IpFamiliesBreadcrumbs from '../components/IpFamiliesBreadcrumbs';
import { IP_FAMILY_DETAILS_HREF } from '../urls';
import { useCreateIpFamilyMutation } from '../hooks/ipFamily';
import IpFamilyCreateEditForm, { IPFormData } from '../components/IpFamilyCreateEditForm';

enum IpFamilyInterest {
  LicensingAndAdvancedTooling = 'LICENSING_AND_ADVANCED_TOOLING',
  AdvancedTooling = 'ADVANCED_TOOLING',
}

/**
 * Page to create a new IP family.
 */
const IpFamilyCreateContainer = () => {
  const { translate } = useTranslation();
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();
  const router = useRouter();

  const { setPageTitle } = useIpLayoutContext();

  const createIpFamilyMutation = useCreateIpFamilyMutation();

  const isSubmitting = createIpFamilyMutation.isPending;

  const handleCreateSave = (data: IPFormData) => {
    const ownershipUrls = data.ownershipUrls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => !!url);
    const ownershipContext = data.ownershipContext.trim();

    const interestedInLicensing = data.interest === IpFamilyInterest.LicensingAndAdvancedTooling;

    const licensingReasons: IPFamilyLicensingEligibilityReasonsEnum[] = [];
    const rightsScopes: IPFamilyRightsScopesEnum[] = [];
    const ownershipTypes: IPFamilyOwnershipTypesEnum[] = [];

    if (interestedInLicensing) {
      if (data.hasIpPortfolio) {
        licensingReasons.push(IPFamilyLicensingEligibilityReasonsEnum.SubstantialPortfolio);
      }
      if (data.existingLicense) {
        licensingReasons.push(
          IPFamilyLicensingEligibilityReasonsEnum.ExistingLicenseWithRobloxCreators,
        );
      }

      if (data.exclusiveRights) {
        rightsScopes.push(IPFamilyRightsScopesEnum.Exclusive);
        rightsScopes.push(IPFamilyRightsScopesEnum.Worldwide);
      }
    } else {
      if (data.hasRegisteredCopyright) {
        ownershipTypes.push(IPFamilyOwnershipTypesEnum.Copyright);
      }
      if (data.hasRegisteredTrademark) {
        ownershipTypes.push(IPFamilyOwnershipTypesEnum.Trademark);
      }
    }

    createIpFamilyMutation.mutate(
      {
        name: data.name,
        documents: data.documents,
        licensingEligilityReasons: licensingReasons,
        licensingInterest: interestedInLicensing,
        ownershipContext,
        ownershipTypes,
        rightsScopes,
        ownershipUrls,
        genAiOptOut: data.genAiOptOut,
        licTermsAccepted: data.licensingTerms,
      },
      {
        onSuccess: (ipFamily, variables) => {
          router.push(IP_FAMILY_DETAILS_HREF(ipFamily.id as string));
          enqueueSuccessSnackbar('Message.YourIPFamilySubmitted', { ipFamilyName: variables.name });
        },
        onError: () => {
          enqueueErrorSnackbar();
        },
      },
    );
  };
  useEffect(() => {
    setPageTitle(
      <IpFamiliesBreadcrumbs pages={[{ title: translate('Heading.CreateIpFamily') }]} />,
    );
  }, [setPageTitle, translate]);

  return (
    <IpFamilyCreateEditForm
      isEditing={false}
      handleSave={handleCreateSave}
      isSubmitting={isSubmitting}
    />
  );
};

export default withTranslation(IpFamilyCreateContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.RightsPortal,
]);
