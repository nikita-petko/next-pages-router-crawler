import type { FunctionComponent } from 'react';
import React from 'react';
import NavigationTranslate from '../../hooks/NavigationTranslate';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import getProductTitle from '../../utils/getProductTitle';

const CurrentProductName: FunctionComponent = () => {
  const { currentProduct } = useNavigationConfigs();
  const productTitle = getProductTitle(currentProduct);

  return <NavigationTranslate content={productTitle} />;
};

export default CurrentProductName;
