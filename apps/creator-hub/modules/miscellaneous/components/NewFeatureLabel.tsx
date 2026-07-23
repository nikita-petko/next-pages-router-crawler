import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Label } from '@rbx/ui';

const NewFeatureLabel: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();

  return <Label labelText={translate('Label.New')} variant='contained' severity='info' />;
};

export default NewFeatureLabel;
