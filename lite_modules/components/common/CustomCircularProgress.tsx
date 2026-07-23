import { ProgressCircle, TProgressCircleSize } from '@rbx/foundation-ui';
import { memo } from 'react';

import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface CustomCircularProgressProps {
  ariaLabel?: string;
  className?: string;
  'data-testid'?: string;
  size?: TProgressCircleSize;
}

const CustomCircularProgress = memo(
  ({
    ariaLabel,
    className,
    'data-testid': dataTestId,
    size = 'Medium',
  }: CustomCircularProgressProps) => {
    const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
    return (
      <ProgressCircle
        ariaLabel={ariaLabel ?? translate('Label.Loading')}
        className={className}
        data-testid={dataTestId}
        size={size}
        variant='Indeterminate'
      />
    );
  },
);

export default CustomCircularProgress;
