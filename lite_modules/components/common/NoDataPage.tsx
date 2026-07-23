import { memo } from 'react';

import useNoDataPageStyles from '@components/common/NoDataPage.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const NoDataPage = memo(() => {
  const {
    classes: { centered },
  } = useNoDataPageStyles();
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  return (
    <div className={centered}>
      <span className='text-heading-medium'>{translate('Description.GenericFetchError')}</span>
    </div>
  );
});

export default NoDataPage;
