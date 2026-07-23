import { Button } from '@rbx/foundation-ui';
import { useTheme } from '@rbx/ui';
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
          <span className={`text-heading-large text-align-x-center ${title}`}>
            {translate('Heading.HeroTitle')}
          </span>
          <span className={`text-body-large text-align-x-center ${subtitle}`}>
            {translate('Description.HeroSubtitle')}
          </span>
          <div className={buttonContainer}>{ctaButtons}</div>
        </div>
        <div className={smallImage} />
      </>
    ) : (
      <div className={cx(headerOverlay, creatorHubLayoutOverlay)}>
        <div className={expandedViewContainer}>
          <h1 className={`text-heading-large content-inherit ${title}`}>
            {translate('Heading.HeroTitle')}
          </h1>
          <p className={`text-body-large content-inherit ${subtitle}`}>
            {translate('Description.HeroSubtitle')}
          </p>
          {ctaButtons}
        </div>
      </div>
    );
  },
);

export default LandingHeaderComponent;
