import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { commerceCreationIconPath } from '../configs/assets';
import CommerceEmptyView from './CommerceEmptyView';

const CommerceIneligibleView = () => {
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
