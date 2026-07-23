import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';

const NavigationTranslate: FunctionComponent<{ content: string }> = ({ content }) => {
  const { translate } = useTranslation();
  return <>{translate(content)}</>;
};

export default NavigationTranslate;
