import type { NextLayoutPage } from 'next';
import { Translate } from '@rbx/intl';
import Authenticated from '@modules/authentication/Authenticated';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import SafetyCollaboratorsPage from '@modules/creations-overview/components/SafetyCollaboratorsPage';
import CollaboratorPageContent from '@modules/creations/collaborators/CollaboratorPageContent';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import { PageLoading } from '@modules/miscellaneous/components';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';

const SafetyCollaborators: NextLayoutPage = () => {
  const {
    params: { enableCollaboratorsPageV2 },
    isFetched,
  } = useIXPParameters(IXPLayers.CreatorDashboard);

  if (!isFetched) {
    return <PageLoading />;
  }

  return (
    <Authenticated>
      {enableCollaboratorsPageV2 ? <CollaboratorPageContent /> : <SafetyCollaboratorsPage />}
    </Authenticated>
  );
};

SafetyCollaborators.getPageLayout = (page) =>
  getCreationsPageLayout(page, {
    title: <Translate namespace='CreatorDashboard.Creations' translationKey='Tab.Collaborators' />,
  });
SafetyCollaborators.loggerConfig = { rosId: RosTeams.Safety };

export default SafetyCollaborators;
