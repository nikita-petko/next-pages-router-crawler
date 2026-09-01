import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { useMediaQuery, Grid, Button, Typography } from '@rbx/ui';
import useLocalizationLayoutStyles from '../../common/components/LocalizationLayout.styles';

const LocalizationTitle: FunctionComponent<React.PropsWithChildren> = () => {
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const isLargeView = useMediaQuery((theme) => theme.breakpoints.up('XLarge'));
  const {
    classes: { title, container },
  } = useLocalizationLayoutStyles();
  const { translate } = useTranslation();
  const router = useRouter();

  const handleClickTranslate = useCallback(() => {
    const { id } = router.query;
    router.push({
      pathname: `${router.pathname}/translation`,
      query: { id },
    });
  }, [router]);

  return (
    <Grid className={title} container direction='row' alignItems='center' wrap='nowrap'>
      <Grid item container justifyContent='flex-start'>
        <Typography variant={isCompactView ? 'h3' : 'h1'}>
          {translate('Heading.Localization')}
        </Typography>
      </Grid>

      <Grid item justifyContent='flex-end' className={isLargeView ? container : undefined}>
        <Button
          variant='contained'
          size={isCompactView ? 'small' : 'large'}
          onClick={handleClickTranslate}>
          {translate('Action.Translate')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default LocalizationTitle;
