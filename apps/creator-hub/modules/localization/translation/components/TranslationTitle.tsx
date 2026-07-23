import React, { FunctionComponent } from 'react';
import { Grid, Typography, useMediaQuery } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useLocalizationLayoutStyles from '../../common/components/LocalizationLayout.styles';

const TranslationTitle: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const {
    classes: { title },
  } = useLocalizationLayoutStyles();
  const { translate } = useTranslation();

  return (
    <Grid className={title} container direction='row' alignItems='center' wrap='nowrap'>
      <Grid item container justifyContent='flex-start'>
        <Typography variant={isCompactView ? 'h3' : 'h1'}>
          {translate('Heading.Translation')}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default TranslationTitle;
