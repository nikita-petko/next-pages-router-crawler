import { memo } from 'react';

import AlertToast from '@components/billing/AlertToast';
import { TranslationNamespace } from '@constants/localization';
import { AlertToastLevel } from '@constants/toastConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const DisplayNameWarningToast = memo(() => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  return (
    <AlertToast
      header={translate('Heading.CannotCreateNewCampaign')}
      level={AlertToastLevel.Warning}
      text={translate('Description.BusinessNameNotMeetStandards')}
    />
  );
});

export default DisplayNameWarningToast;
