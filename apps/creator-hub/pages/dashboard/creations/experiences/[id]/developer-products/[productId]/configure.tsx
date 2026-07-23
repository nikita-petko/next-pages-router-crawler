import type { NextLayoutPage } from 'next';
import {
  ConfigureDeveloperProductContainer,
  getDeveloperProductLayout,
} from '@modules/creations/developerProduct';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import { useProductId } from '@modules/monetization-shared/route/useProductId';

const ConfigureDeveloperProductPage: NextLayoutPage = () => {
  const { universeId } = useUniverseId();
  const { productId } = useProductId();
  if (!universeId || !productId) return null;

  return <ConfigureDeveloperProductContainer universeId={universeId} productId={productId} />;
};

ConfigureDeveloperProductPage.getPageLayout = (page) =>
  getDeveloperProductLayout(page, { title: 'Heading.Settings' });

export default ConfigureDeveloperProductPage;
