import { useTranslation } from '@rbx/intl';
import React, { FunctionComponent } from 'react';

const NavigationTranslate: FunctionComponent<{ content: string }> = ({ content }) => {
  const { translate } = useTranslation();
  return <React.Fragment>{translate(content)}</React.Fragment>;
};

export default NavigationTranslate;
