import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useThemeMode } from '@rbx/settings';
import { Button, Grid, Typography } from '@rbx/ui';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { BoldTag, ListItemTag, ListTag } from '@modules/charts-generic/utils/translateHTMLTags';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useRecommendedEventsZeroStateStyles from './RecommendedEventsZeroState.styles';

type RecommendedEventsZeroStateProps = {
  headingKey: TranslationKey;
  descriptionKey: TranslationKey;
  primaryHref: string;
  image: {
    src: string;
    altKey: TranslationKey;
    absolute?: boolean;
    lightModeSrc?: string;
  };
};

// NOTE(shumingxu, 05/13/2024): Briefly looked into the Banner component but not using it
// due to limitations on description being strictly a string. Will negotiate on the exact prop
// in webblox but will use this component for now to unblock funnels beta.
const RecommendedEventsZeroState = ({
  headingKey,
  descriptionKey,
  primaryHref,
  image,
}: RecommendedEventsZeroStateProps): ReactElement => {
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();
  const {
    classes: {
      grid,
      zeroStateImage,
      zeroStateImageContainer,
      zeroStateImageCentered,
      actionButton,
      textContainer,
    },
  } = useRecommendedEventsZeroStateStyles();

  const { themeMode } = useThemeMode();
  const imageSrc = useMemo(() => {
    return themeMode === 'light' && image.lightModeSrc ? image.lightModeSrc : image.src;
  }, [image.lightModeSrc, image.src, themeMode]);

  return (
    <Grid item XSmall={12}>
      <Grid
        container
        direction='row'
        justifyContent='space-between'
        className={grid}
        data-testid='recommended-events-zero-state'>
        <Grid
          item
          XSmall
          container
          direction='column'
          justifyContent='center'
          alignItems='flex-start'
          className={textContainer}>
          <Grid item>
            <Typography variant='h3' paragraph>
              {translate(headingKey)}
            </Typography>
            <Typography variant='body1' color='secondary' paragraph>
              {translateHTML(descriptionKey, [ListTag, ListItemTag, BoldTag])}
            </Typography>
          </Grid>
          <Grid item className={actionButton}>
            <Button size='large' variant='contained' color='primary' href={primaryHref}>
              {translate(translationKey('Action.GetStarted', TranslationNamespace.Analytics))}
            </Button>
          </Grid>
        </Grid>
        {image.absolute ? (
          <Grid
            Large={6}
            Medium={12}
            item
            className={zeroStateImageContainer}
            justifyContent='center'
            alignItems='center'>
            <img className={zeroStateImage} src={imageSrc} alt={translate(image.altKey)} />
          </Grid>
        ) : (
          <Grid Large={6} Medium={12} item container justifyContent='end' alignItems='center'>
            <img className={zeroStateImageCentered} src={imageSrc} alt={translate(image.altKey)} />
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default RecommendedEventsZeroState;
