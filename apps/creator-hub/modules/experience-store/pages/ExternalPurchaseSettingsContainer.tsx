import { StatusCodes } from '@rbx/core';
import { withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniversePermissions } from '@modules/react-query/organizations';
import { useGetExperienceStoreState } from '@modules/experience-store/queries/useGetExperienceStoreState';
import { ExternalPurchaseSettings } from '../components/ExternalPurchaseSettings';

function ExternalPurchaseSettingsContainer({ universeId }: { universeId: number }) {
  const { data: permissions, isLoading: isLoadingPermissions } = useUniversePermissions(universeId);
  const { data: experienceStoreState, isLoading: isLoadingExperienceStoreState } =
    useGetExperienceStoreState(universeId, { enabled: !!universeId });

  if (permissions?.monetizeExperience === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (isLoadingPermissions || isLoadingExperienceStoreState || !experienceStoreState) {
    return (
      <EmptyGrid>
        <CircularProgress color='secondary' />
      </EmptyGrid>
    );
  }

  return <ExternalPurchaseSettings universeId={universeId} releaseState={experienceStoreState} />;
}

export default withTranslation(ExternalPurchaseSettingsContainer, [
  TranslationNamespace.DeveloperProducts,
]);
