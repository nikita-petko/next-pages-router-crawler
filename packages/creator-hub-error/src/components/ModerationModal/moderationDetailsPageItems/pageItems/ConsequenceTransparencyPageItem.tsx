import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';

type TConsequenceTransparencyProps = {
  consequenceTransparencyMessage?: string;
};

/**
 * Message regarding DSA regulations that requires disclosure about automated process
 * involved in issuing consequence
 */
const ConsequenceTransparencyPageItem: React.FC<TConsequenceTransparencyProps> = ({
  consequenceTransparencyMessage,
}) => {
  const { translate } = useTranslation();

  if (!consequenceTransparencyMessage) {
    return null;
  }

  return (
    <Grid container direction='column' rowGap='8px' data-testid='consequence-transparency'>
      <Typography variant='h6'>{translate('Label.Decision')}</Typography>
      <Typography variant='body2'>{consequenceTransparencyMessage}</Typography>
    </Grid>
  );
};

export default ConsequenceTransparencyPageItem;
