import type { NextLayoutPage } from 'next';
import getPassCreationLayout from '@modules/creations/pass/layout/getPassCreationLayout';
import CreatePassContainer from '@modules/creations/pass/pages/CreatePassContainer';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const CreatePassPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) {
    return null;
  }

  return <CreatePassContainer universeId={universeId} />;
};

CreatePassPage.getPageLayout = getPassCreationLayout;
CreatePassPage.loggerConfig = { rosId: RosTeams.MonetizationProducts };

export default CreatePassPage;
