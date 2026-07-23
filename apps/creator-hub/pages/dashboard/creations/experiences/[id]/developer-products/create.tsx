import type { NextLayoutPage } from 'next';
import {
  CreateDeveloperProductContainer,
  getDeveloperProductCreationLayout,
} from '@modules/creations/developerProduct';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';

const CreateDeveloperProductPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  if (!universeId) return null;

  return <CreateDeveloperProductContainer universeId={universeId} />;
};

CreateDeveloperProductPage.getPageLayout = getDeveloperProductCreationLayout;

export default CreateDeveloperProductPage;
