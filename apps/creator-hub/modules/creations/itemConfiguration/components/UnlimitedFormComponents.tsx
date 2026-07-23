import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import useItemConfigureFormStyles from './ItemConfigureForm.styles';

function CreatorEarningsMessage({
  creatorEarningsPercentage,
}: {
  creatorEarningsPercentage: number;
}) {
  const {
    classes: { earningMessage },
  } = useItemConfigureFormStyles();
  const { translate } = useTranslation();
  return (
    <Typography variant='body2' color='secondary' className={earningMessage}>
      {translate('Message.CreatorEarnings', {
        percentage: `${creatorEarningsPercentage}%`,
      })}
    </Typography>
  );
}

export { CreatorEarningsMessage };
