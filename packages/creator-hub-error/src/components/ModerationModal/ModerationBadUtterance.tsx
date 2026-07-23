import React from 'react';
import { useTranslation } from '@rbx/intl';
import { HttpControllerGetNotApprovedResponseBadUtterance } from '@rbx/client-behavior-intervention/v1';
import { Card, CardContent, Grid, Typography } from '@rbx/ui';
import useModerationModalStyles from './ModerationModal.styles';

type TBadUtteranceProps = {
  badUtterance: HttpControllerGetNotApprovedResponseBadUtterance;
};

const ModerationBadUtterance: React.FunctionComponent<TBadUtteranceProps> = ({ badUtterance }) => {
  const { translate } = useTranslation();
  const {
    classes: { boldText },
  } = useModerationModalStyles();

  return (
    <Card variant='outlined'>
      <CardContent>
        <Grid container spacing={2}>
          <Grid container item direction='column'>
            <Typography variant='body2' className={boldText}>
              {translate('Label.Reason')}
            </Typography>
            <Typography variant='body2'>
              {badUtterance.labelTranslationKey
                ? translate(badUtterance.labelTranslationKey)
                : translate('Label.AbuseType.Other')}
            </Typography>
          </Grid>
          <Grid container item direction='column'>
            <Typography variant='body2' className={boldText}>
              {translate('Label.OffensiveItem')}
            </Typography>
            <Typography variant='body2'>{badUtterance.utteranceText}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ModerationBadUtterance;
