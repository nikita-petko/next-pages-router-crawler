import type { NextLayoutPage } from 'next';
import getDeveloperProductCreationLayout from '@modules/creations/developerProduct/layouts/getDeveloperProductCreationLayout';
import CreateDeveloperProductContainer from '@modules/creations/developerProduct/pages/CreateDeveloperProductContainer';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const CreateDeveloperProductPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) {
    return null;
  }

  return <CreateDeveloperProductContainer universeId={universeId} />;
};

CreateDeveloperProductPage.getPageLayout = getDeveloperProductCreationLayout;
CreateDeveloperProductPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default CreateDeveloperProductPage;
