import { memo } from 'react';

import useDateFilteringNoDataPageStyles from '@components/common/DateFilteringNoDataPage.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const DateFilteringNoDataPage = memo(() => {
  const {
    classes: { centered },
  } = useDateFilteringNoDataPageStyles();
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);

  return (
    <div className={centered}>
      <span className='text-heading-medium'>{translate('Description.NoDataInDateRange')}</span>
    </div>
  );
});

export default DateFilteringNoDataPage;
