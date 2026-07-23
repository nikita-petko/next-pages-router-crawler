import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { CreatorType } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCloudPricingClient } from '../../CloudPricingClientProvider';
import EligibilityForm from '../../components/EligibilityForm/EligibilityForm';
import type { EligibilityRequirementResult } from '../../types';

const ServiceEfficiencyEligibilityContainer: FunctionComponent = () => {
  const { reload: routerReload } = useRouter();
  const cloudPricingClient = useCloudPricingClient();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPageInitFailed, setIsPageInitFailed] = useState<boolean>(false);
  const { translate } = useTranslationWrapper(useTranslation());
  const [eligibilityRequirements, setEligibilityRequirements] =
    useState<EligibilityRequirementResult[]>();
  const { user } = useAuthentication();

  const loadPageData = useCallback(
    async (id: number) => {
      setIsLoading(true);
      try {
        // We only check user level here because we're in the settings page.
        const eligible = await cloudPricingClient.checkEligibility(CreatorType.User, id);
        setEligibilityRequirements(eligible);
        setIsPageInitFailed(false);
      } catch {
        setIsPageInitFailed(true);
      } finally {
        setIsLoading(false);
      }
    },
    [cloudPricingClient],
  );

  useEffect(() => {
    if (user && user.id) {
      loadPageData(user.id);
    } else {
      setIsPageInitFailed(true);
    }
  }, [loadPageData, user]);

  if (!isLoading && isPageInitFailed) {
    return (
      <FailureView
        title={translate(translationKey('Heading.FailedToLoadPage', TranslationNamespace.Error))}
        message={translate(translationKey('Message.FailedToLoadPage', TranslationNamespace.Error))}
        buttonText={translate(
          translationKey('Action.FailedToLoadPage', TranslationNamespace.Error),
        )}
        onReload={() => routerReload()}
      />
    );
  }

  if (!isLoading && !isPageInitFailed && eligibilityRequirements) {
    return <EligibilityForm eligibilityRequirements={eligibilityRequirements} />;
  }

  return (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};

export default withTranslation(ServiceEfficiencyEligibilityContainer, [
  TranslationNamespace.Table,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
