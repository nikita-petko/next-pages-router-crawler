import { Typography } from '@rbx/ui';
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
      <Typography variant='h4'>{translate('Description.GenericFetchError')}</Typography>
    </div>
  );
});

export default NoDataPage;
