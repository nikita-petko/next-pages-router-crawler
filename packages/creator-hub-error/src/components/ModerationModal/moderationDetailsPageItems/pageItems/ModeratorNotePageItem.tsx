import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import useModerationModalStyles from '../../ModerationModal.styles';

type TModeratorNoteProps = {
  messageToUser?: string;
};

/**
 * Notes moderators left when making a consequence decision
 */
const ModeratorNotePageItem: React.FC<TModeratorNoteProps> = ({ messageToUser }) => {
  const { translate } = useTranslation();
  const {
    classes: { moderatorNote },
  } = useModerationModalStyles();

  return (
    <Grid container direction='column' rowGap='8px' data-testid='moderator-note'>
      <Typography variant='h6'>{translate('Label.Details')}</Typography>
      <Typography variant='body2' className={moderatorNote}>
        {messageToUser}
      </Typography>
    </Grid>
  );
};

export default ModeratorNotePageItem;
