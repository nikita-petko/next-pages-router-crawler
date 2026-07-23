import type { FC } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const SentTab: FC = () => {
  const { translateWithNamespace } = useTranslation();

  // TODO: implement Sent tab — needs a separate API endpoint for submitted requests
  return (
    <Grid container justifyContent='center' padding={4}>
      <Typography variant='body1'>
        {translateWithNamespace(TranslationNamespace.AssetPermissions, 'Message.SentPlaceHolder')}
      </Typography>
    </Grid>
  );
};

export default SentTab;
