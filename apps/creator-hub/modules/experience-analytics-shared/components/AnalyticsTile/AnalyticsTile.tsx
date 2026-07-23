import type { FC } from 'react';
import React from 'react';
import { Card, CardActionArea, Divider, Grid, Typography } from '@rbx/ui';
import GenericCardContentWrapper from '@modules/charts-generic/cards/GenericCardContentWrapper';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import type { TCardStyleConfig } from '@modules/charts-generic/types/CardStyleConfig';
import type { TTileStyleConfig } from '../../constants/tileConstants';
import useAnalyticsTileStyles from './AnalyticsTile.styles';

type AnalyticsTileSpec = {
  thumbnail: React.ReactNode;
  title: React.ReactNode;
  actionButton: React.ReactNode;
  subtitle: React.ReactNode;
  subtitleStats: React.ReactNode;
  floatingChildren?: React.ReactNode;
  styleConfig: TTileStyleConfig;
} & GenericChartState;

const statsBodyStyleConfig: TCardStyleConfig = { loadingBodyHeight: '100%' };

const AnalyticsTile: FC<React.PropsWithChildren<AnalyticsTileSpec>> = ({
  thumbnail,
  title,
  actionButton,
  subtitle,
  subtitleStats,
  isDataLoading,
  isResponseFailed,
  isUserForbidden,
  children,
  floatingChildren,
  styleConfig,
}) => {
  const {
    classes: { analyticsTileCard, titleDisplay, actionBorderRadius, cardContent },
  } = useAnalyticsTileStyles(styleConfig);

  return (
    <Card className={analyticsTileCard}>
      {thumbnail}
      <CardActionArea
        disableRipple
        className={actionBorderRadius}
        // NOTE(shumingxu, 10/31/2023): Using div instead of button to prevent centering content
        component='div'>
        <GenericCardContentWrapper
          cardContentClass={cardContent}
          isDataLoading={isDataLoading}
          isResponseFailed={isResponseFailed}
          isUserForbidden={isUserForbidden}
          styleConfig={statsBodyStyleConfig}>
          <Grid container direction='column' spacing={2}>
            <Grid item>
              <Grid container direction='column' spacing={1}>
                <Grid item>
                  <Grid container justifyContent='space-between' wrap='nowrap' spacing={2}>
                    <Grid item XSmall zeroMinWidth>
                      <Typography
                        variant={styleConfig.titleTypographyVariant}
                        noWrap
                        className={titleDisplay}>
                        {title}
                      </Typography>
                    </Grid>
                    <Grid item>{actionButton}</Grid>
                  </Grid>
                </Grid>
                <Grid item>
                  <Typography variant='captionHeader' color='secondary'>
                    {subtitle}
                  </Typography>
                </Grid>
                <Grid item>
                  <Typography variant='captionHeader' color='secondary'>
                    {subtitleStats}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            {children && (
              <>
                <Grid item>
                  <Divider data-testid='divider' />
                </Grid>
                <Grid item>{children}</Grid>
              </>
            )}
          </Grid>
        </GenericCardContentWrapper>
      </CardActionArea>
      {floatingChildren}
    </Card>
  );
};

export default AnalyticsTile;
