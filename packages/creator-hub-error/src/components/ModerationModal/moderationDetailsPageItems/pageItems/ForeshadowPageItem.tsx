import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import getForeshadowTranslationText from '../../../../utils/getForeshadowTranslationText';
import useModerationModalStyles from '../../ModerationModal.styles';

type TForeshadowProps = {
  context?: {
    [key: string]: object;
  };
  isForeshadowingConsequenceEnabled?: boolean;
};

/**
 * Experimental message to warn users of more severe consequence if they continue violation
 */
const ForeshadowPageItem: React.FC<TForeshadowProps> = ({
  context,
  isForeshadowingConsequenceEnabled,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { boldText },
  } = useModerationModalStyles();
  const foreshadowType = context?.NEXT_CONSEQUENCE_TYPE;
  const foreshadowDuration = context?.NEXT_CONSEQUENCE_DURATION;
  const foreshadowtext = getForeshadowTranslationText(
    foreshadowType,
    foreshadowDuration,
    translate,
  );

  if (!isForeshadowingConsequenceEnabled) {
    return null;
  }

  return (
    <div data-testid='foreshadow'>
      <Typography variant='body2' color='error' className={boldText}>
        {translate('Foreshadow.Title')}{' '}
      </Typography>
      <Typography variant='body2'>{foreshadowtext}</Typography>
    </div>
  );
};

export default ForeshadowPageItem;
