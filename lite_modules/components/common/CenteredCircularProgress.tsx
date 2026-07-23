import { ProgressCircle, TProgressCircleSize } from '@rbx/foundation-ui';
import { FC, memo } from 'react';

import useCenteredCircularProgressStyles from '@components/common/CenteredCircularProgress.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface Props {
  ariaLabel?: string;
  className?: string;
  'data-testid'?: string;
  size?: TProgressCircleSize;
}

const CenteredCircularProgress: FC<Props> = memo(
  ({
    ariaLabel,
    className,
    'data-testid': dataTestId = 'centered-circular-progress',
    size = 'Medium',
  }: Props) => {
    const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
    const {
      classes: { centered },
      cx,
    } = useCenteredCircularProgressStyles();
    return (
      <div className={cx(centered, className)}>
        <ProgressCircle
          ariaLabel={ariaLabel ?? translate('Label.Loading')}
          data-testid={dataTestId}
          size={size}
          variant='Indeterminate'
        />
      </div>
    );
  },
);

export default CenteredCircularProgress;
