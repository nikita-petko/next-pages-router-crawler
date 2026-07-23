import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  UIEvent,
  forwardRef,
  ForwardRefRenderFunction,
  SyntheticEvent,
} from 'react';
import {
  IconButton,
  MobileStepper,
  NavigateBeforeIcon,
  NavigateNextIcon,
  makeStyles,
} from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';

const buttonWidth = 24;

const useStyles = makeStyles()((theme) => ({
  sliderButtonV2: {
    alignSelf: 'center',
    width: `${buttonWidth}px`,
    height: `${buttonWidth}px`,
    position: 'absolute',
  },
  sliderPrevButtonV2: {
    left: 2,
  },
  sliderNextButtonV2: {
    right: 2,
  },
  carouselV2: {
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    flexDirection: 'column',
  },
  carouselContainerV2: {
    display: 'flex',
    overflowX: 'scroll',
    whiteSpace: 'nowrap',
    scrollSnapType: 'x mandatory',
    msScrollSnapType: 'mandatory',
    scrollSnapTypeX: 'mandatory',
    scrollSnapPointsX: 'repeat(100%)',
    msScrollSnapPointsX: 'repeat(100%)',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    margin: `0`,
  },
  carouselImage: {
    scrollSnapAlign: 'center',
    flex: '0 0 auto',
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: theme.palette.surface[400],
  },
  stepperV2: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: theme.palette.content.standard,
    height: '16px',
  },
}));

const StepButton = ({
  isBackButton,
  disabled,
  onClick,
}: {
  isBackButton: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => {
  const {
    classes: { sliderButtonV2, sliderNextButtonV2, sliderPrevButtonV2 },
    cx,
  } = useStyles();

  const stopPropagation = useCallback((event: SyntheticEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  }, []);

  return (
    <IconButton
      classes={{
        root: cx(sliderButtonV2, {
          [sliderNextButtonV2]: !isBackButton,
          [sliderPrevButtonV2]: isBackButton,
        }),
      }}
      size='small'
      disableRipple
      onClick={onClick}
      // NOTE(tyin, 02/28/2025): Unclear why onblur event is sometimes triggered
      // when clicking on this button. Maybe caused by unexpected usage of the button component in a
      // MUI Tooltip component. For now, we are stopping the propagation of these events to prevent
      // unwanted side effects on its parent tooltip component
      onBlur={stopPropagation}
      disabled={disabled}
      aria-label=''
      variant='contained'>
      {isBackButton ? (
        <NavigateBeforeIcon fontSize='large' color={disabled ? 'disabled' : 'action'} />
      ) : (
        <NavigateNextIcon fontSize='large' color={disabled ? 'disabled' : 'action'} />
      )}
    </IconButton>
  );
};

type MiniImageCarouselProps = {
  imageUrls: string[];
  imageWidth: number;
  imageHeight: number;
};

const MiniImageCarousel: ForwardRefRenderFunction<HTMLDivElement, MiniImageCarouselProps> = (
  { imageUrls, imageWidth, imageHeight },
  ref,
) => {
  const {
    classes: { stepperV2, carouselV2, carouselContainerV2, carouselImage },
  } = useStyles();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // updating selected index based on the scroll position
  //   image1   [   image2   ]   image3
  //                  ⬆
  //          carousel container
  // when scrolling left, image1 is halfway through the container, selected index should be updated to 1
  // when scrolling right, image3 is halfway through the container, selected index should be updated to 2
  const onScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      const { scrollLeft } = e.currentTarget;
      setSelectedIndex(Math.floor((scrollLeft - imageWidth / 2) / imageWidth) + 1);
    },
    [imageWidth],
  );

  const hasMultipleImages = imageUrls.length > 1;
  const { carouselContainerWidthStyle } = useMemo(() => {
    return {
      carouselContainerWidthStyle: {
        width: `${imageWidth}px`,
      },
    };
  }, [imageWidth]);

  const images = useMemo(
    () =>
      imageUrls.map((url) => (
        <div
          key={url}
          className={carouselImage}
          style={{
            backgroundImage: `url("${url}")`,
            width: imageWidth,
            height: imageHeight,
          }}
        />
      )),
    [carouselImage, imageHeight, imageUrls, imageWidth],
  );

  const onClickBack = useCallback(() => {
    sliderContainerRef.current?.scrollBy({
      left: -imageWidth / 2,
      behavior: 'smooth',
    });
  }, [imageWidth]);
  const backButton = useMemo(() => {
    return (
      hasMultipleImages && (
        <StepButton isBackButton onClick={onClickBack} disabled={selectedIndex === 0} />
      )
    );
  }, [hasMultipleImages, onClickBack, selectedIndex]);

  const onClickForward = useCallback(() => {
    sliderContainerRef.current?.scrollBy({
      left: imageWidth / 2 + 1,
      behavior: 'smooth',
    });
  }, [imageWidth]);
  const forwardButton = useMemo(() => {
    return (
      hasMultipleImages && (
        <StepButton
          isBackButton={false}
          onClick={onClickForward}
          disabled={selectedIndex === imageUrls.length - 1}
        />
      )
    );
  }, [hasMultipleImages, imageUrls.length, onClickForward, selectedIndex]);

  return (
    <div ref={ref} className={carouselV2}>
      <Flex>
        {backButton}
        <div
          ref={sliderContainerRef}
          className={carouselContainerV2}
          style={carouselContainerWidthStyle}
          onScroll={onScroll}>
          {images}
        </div>
        {forwardButton}
      </Flex>
      {hasMultipleImages && (
        <MobileStepper
          position='static'
          variant='dots'
          backButton={undefined}
          nextButton={undefined}
          steps={imageUrls.length}
          classes={{
            root: stepperV2,
          }}
          activeStep={selectedIndex}
        />
      )}
    </div>
  );
};

export default forwardRef(MiniImageCarousel);
