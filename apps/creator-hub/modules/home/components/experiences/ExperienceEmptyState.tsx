import type { FunctionComponent } from 'react';
import React, { useRef, useEffect, useState } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { makeStyles, CardContent, Typography, Button, StudioIcon, useMediaQuery } from '@rbx/ui';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { studioUpsellImage } from '../../constants/assetConstants';
import {
  ExperienceWithAnalyticsTileSizeV2,
  StudioUpsellImageSize,
} from '../../constants/tileConstants';
import type { TExperience } from '../../providers/ExperienceProvider';
import Card from '../common/Card';
import ExperienceDataTileV2 from './ExperienceDataTileV2';

const useStyles = makeStyles<{ height: number; isV2: boolean }>()((theme, { height, isV2 }) => ({
  tileContainer: {
    display: 'flex',
    flexWrap: 'nowrap',
    width: '100%',
    '& > *': {
      marginRight: 16,
    },
    '& > *:last-child': {
      marginRight: 0,
    },
  },
  tileCard: {
    flexShrink: 0,
    minHeight: ExperienceWithAnalyticsTileSizeV2.height,
  },
  upsellCard: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...(isV2 && {
      background:
        'linear-gradient(var(--color-shift-100), var(--color-shift-100)), var(--color-surface-0)',
      border: `1px solid ${theme.palette.surface.outline}`,
      borderRadius: 12,
      '&:hover, &:focus-within': {
        border: `1px solid ${theme.palette.surface.outline}`,
      },
    }),
    [theme.breakpoints.down('Medium')]: {
      flexDirection: 'column',
      justifyContent: 'center',
    },
    [theme.breakpoints.up('Medium')]: {
      height,
    },
  },
  upsellContent: {
    display: 'flex',
    minWidth: 400,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 48,
    paddingRight: 48,
    [theme.breakpoints.down('Medium')]: {
      paddingLeft: 24,
      paddingRight: 24,
      minWidth: 0,
    },
  },
  header: {
    zIndex: theme.zIndex.mobileStepper,
    marginBottom: 6,
  },
  description: {
    zIndex: theme.zIndex.mobileStepper,
    marginBottom: 12,
  },
  openStudioButton: {
    [theme.breakpoints.down('Medium')]: {
      width: '100%',
    },
  },
  upsellXsImage: {
    width: 'auto',
    objectFit: 'cover',
    height: '40%',
  },
  upsellLgImage: {
    objectFit: 'contain',
    width: 'auto',
    height: '100%',
  },
}));

type TExperienceCarouselProps = {
  data?: TExperience;
  isBeta?: boolean;
};

export const ExperienceUpsellCarousel: FunctionComponent<
  React.PropsWithChildren<TExperienceCarouselProps>
> = ({ data, isBeta = false }) => {
  const [tileHeight, setTileHeight] = useState<number>(ExperienceWithAnalyticsTileSizeV2.height);
  const {
    classes: {
      tileContainer,
      tileCard,
      upsellCard,
      upsellContent,
      upsellLgImage,
      header,
      description,
      openStudioButton,
    },
  } = useStyles({ height: tileHeight, isV2: true });
  const { translate } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const isXs = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { open, dialog, isCompatible } = useStudio();
  const showUpsell = !data || (data && !isXs);

  const calculateTileHeight = (entries: ResizeObserverEntry[]) => {
    setTileHeight(entries[0].target.clientHeight);
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(calculateTileHeight);
    const currentElement = ref?.current;
    if (currentElement) {
      resizeObserver.observe(currentElement);
    }
    return () => {
      if (currentElement) {
        resizeObserver.unobserve(currentElement);
      }
    };
  }, []);

  return (
    <div>
      <div className={tileContainer}>
        {data && (
          <div ref={ref} className={tileCard}>
            <ExperienceDataTileV2 data={data} isBeta={isBeta} />
          </div>
        )}
        {showUpsell && (
          <Card classes={{ root: upsellCard }} variant='outlined'>
            <CardContent classes={{ root: upsellContent }}>
              <Typography classes={{ root: header }} variant='h3'>
                {translate('Heading.StudioUpsell')}
              </Typography>
              <Typography classes={{ root: description }} variant='body2'>
                {translate('Description.StudioUpsell')}
              </Typography>
              {isCompatible && (
                <Button
                  className={openStudioButton}
                  onClick={() => {
                    open({ task: EStudioTaskType.Default });
                  }}
                  color='primary'
                  size='medium'
                  variant='contained'
                  startIcon={<StudioIcon />}>
                  {translate('Label.GetStarted')}
                </Button>
              )}
            </CardContent>
            {!isXs && (
              <img
                src={studioUpsellImage}
                alt='studio upsell'
                className={upsellLgImage}
                width={StudioUpsellImageSize.width}
                height={StudioUpsellImageSize.height}
              />
            )}
          </Card>
        )}
      </div>
      {dialog}
    </div>
  );
};

export default withTranslation(ExperienceUpsellCarousel, [
  TranslationNamespace.Creations,
  TranslationNamespace.Home,
]);
