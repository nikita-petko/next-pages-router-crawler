import React, { FunctionComponent } from 'react';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import getProductTitle from '../../utils/getProductTitle';
import NavigationTranslate from '../../hooks/NavigationTranslate';

const CurrentProductName: FunctionComponent = () => {
  const { currentProduct } = useNavigationConfigs();
  const productTitle = getProductTitle(currentProduct);

  return <NavigationTranslate content={productTitle} />;
};

export default CurrentProductName;
