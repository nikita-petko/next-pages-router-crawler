import React, { useEffect } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import {
  IPFamilyLicensingEligibilityReasonsEnum,
  IPFamilyOwnershipTypesEnum,
  IPFamilyRightsScopesEnum,
} from '@rbx/clients/rightsV1/v1';
import { useRouter } from 'next/router';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import { useIpLayoutContext } from '../../IpAppNavigationLayout';
import IpFamiliesBreadcrumbs from '../components/IpFamiliesBreadcrumbs';
import { IP_FAMILIES_HREF } from '../urls';
import { useIpFamilyQuery, useUpdateIpFamilyMutation } from '../hooks/ipFamily';
import IpFamilyCreateEditForm, { IPFormData } from '../components/IpFamilyCreateEditForm';

enum IpFamilyInterest {
  LicensingAndAdvancedTooling = 'LICENSING_AND_ADVANCED_TOOLING',
  AdvancedTooling = 'ADVANCED_TOOLING',
}

/**
 * Page to edit a rejected IP family.
 */
const IpFamilyEditContainer = () => {
  const { translate } = useTranslation();
  const { enqueueErrorSnackbar, enqueueSuccessSnackbar } = useIpSnackbar();
  const router = useRouter();
  const { id } = router.query;

  const { setPageTitle } = useIpLayoutContext();
  const ipFamilyRequest = useIpFamilyQuery(id as string);
  const updateIpFamilyMutation = useUpdateIpFamilyMutation();

  const isSubmitting = updateIpFamilyMutation.isPending;

  const handleEditSave = (data: IPFormData) => {
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

    updateIpFamilyMutation.mutate(
      {
        ipFamilyId: id as string,
        name: data.name,
        newDocuments: data.documents,
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
        onSuccess: (_, variables) => {
          router.push(IP_FAMILIES_HREF);
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
      <IpFamiliesBreadcrumbs pages={[{ title: translate('Heading.EditIpOwnership') }]} />,
    );
  }, [setPageTitle, translate]);

  if (ipFamilyRequest.isError) {
    return (
      <FailureView
        title={translate('Heading.PageNotFound')}
        message={translate('Message.PageNotFound')}
      />
    );
  }

  if (ipFamilyRequest.isPending) {
    return <PageLoading />;
  }

  const ipFamily = ipFamilyRequest.data;
  return (
    <IpFamilyCreateEditForm
      isEditing
      ipFamily={ipFamily}
      handleSave={handleEditSave}
      isSubmitting={isSubmitting}
    />
  );
};

export default withTranslation(IpFamilyEditContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.RightsPortal,
]);
