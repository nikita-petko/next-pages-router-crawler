import { Typography } from '@rbx/ui';
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
      <Typography variant='h3'>{translate('Description.NoDataInDateRange')}</Typography>
    </div>
  );
});

export default DateFilteringNoDataPage;
