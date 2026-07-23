import { Button } from '@rbx/foundation-ui';
import { Typography, useTheme } from '@rbx/ui';
import { memo } from 'react';

import { useLandingHeaderStyles } from '@components/onboarding/LandingHeaderComponent.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useWindowSize from '@hooks/useWindowSize';

interface LandingHeaderComponentInputProps {
  buttonDisabled: boolean;
  buttonOnClick: () => void;
  buttonText: string;
  isForecastEstimatorEnabled?: boolean;
  onForecastEstimatorClick?: () => void;
}

const LandingHeaderComponent = memo(
  ({
    buttonDisabled,
    buttonOnClick,
    buttonText,
    isForecastEstimatorEnabled = false,
    onForecastEstimatorClick,
  }: LandingHeaderComponentInputProps) => {
    const { translate } = useNamespacedTranslation(TranslationNamespace.Landing);
    const { width } = useWindowSize();
    const theme = useTheme();
    const breakpoint = theme.breakpoints.values.Large;
    const showCompactView = width! <= breakpoint;

    const { classes, cx } = useLandingHeaderStyles();
    const {
      button,
      buttonContainer,
      compactViewContainer,
      creatorHubLayoutOverlay,
      ctaRow,
      expandedViewContainer,
      headerOverlay,
      smallImage,
      subtitle,
      title,
    } = classes;

    const ctaButtons = (
      <div className={ctaRow}>
        <Button
          className={button}
          isDisabled={buttonDisabled}
          onClick={buttonOnClick}
          size={showCompactView ? 'Small' : 'Large'}
          variant='Emphasis'>
          {buttonText}
        </Button>
        {isForecastEstimatorEnabled ? (
          <Button
            className={button}
            isDisabled={buttonDisabled}
            onClick={onForecastEstimatorClick}
            size={showCompactView ? 'Small' : 'Large'}
            variant='Standard'>
            {translate('Action.GetStarted')}
          </Button>
        ) : null}
      </div>
    );

    return showCompactView ? (
      <>
        <div className={compactViewContainer}>
          <Typography align='center' className={title} variant='h1'>
            {translate('Heading.HeroTitle')}
          </Typography>
          <Typography align='center' className={subtitle} variant='body1'>
            {translate('Description.HeroSubtitle')}
          </Typography>
          <div className={buttonContainer}>{ctaButtons}</div>
        </div>
        <div className={smallImage} />
      </>
    ) : (
      <div className={cx(headerOverlay, creatorHubLayoutOverlay)}>
        <div className={expandedViewContainer}>
          <Typography className={title} color='inherit' component='h1' variant='h1'>
            {translate('Heading.HeroTitle')}
          </Typography>
          <Typography className={subtitle} color='inherit' paragraph variant='body1'>
            {translate('Description.HeroSubtitle')}
          </Typography>
          {ctaButtons}
        </div>
      </div>
    );
  },
);

export default LandingHeaderComponent;
