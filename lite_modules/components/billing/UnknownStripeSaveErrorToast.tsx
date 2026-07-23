import AlertToast from '@components/billing/AlertToast';
import { TranslationNamespace } from '@constants/localization';
import { AlertToastLevel } from '@constants/toastConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const UnknownStripeSaveErrorToast = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  return (
    <AlertToast
      header={translate('Heading.UnknownErrorWhileSavingCard')}
      level={AlertToastLevel.Error}
      text={translate('Error.TrySavingAgain')}
    />
  );
};

export default UnknownStripeSaveErrorToast;
