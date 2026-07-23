import React, { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { commerceCreationIconPath } from '../configs/assets';
import CommerceEmptyView from './CommerceEmptyView';

const CommerceIneligibleView: FunctionComponent = () => {
  const { translate } = useTranslation();

  return (
    <CommerceEmptyView
      iconPath={commerceCreationIconPath}
      message={translate('Heading.Ineligible')}
      description={translate('Message.Ineligible')}
    />
  );
};

export default withTranslation(CommerceIneligibleView, [TranslationNamespace.Commerce]);
