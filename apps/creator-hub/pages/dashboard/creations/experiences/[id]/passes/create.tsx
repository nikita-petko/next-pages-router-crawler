import type { NextLayoutPage } from 'next';
import { CreatePassContainer, getPassCreationLayout } from '@modules/creations/pass';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const CreatePassPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) return null;

  return <CreatePassContainer universeId={universeId} />;
};

CreatePassPage.getPageLayout = getPassCreationLayout;

export default CreatePassPage;
