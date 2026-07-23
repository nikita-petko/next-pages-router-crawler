import { FC, useMemo } from 'react';
import { Container, Slider } from '@rbx/ui';
import { SelectStatusEnum } from '@rbx/clients/coreContentApi';
import { useTranslation } from '@rbx/intl';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import EligibilitySliderThumb from './EligibilitySliderThumb';
import useEligibilityCardStyles from './EligibilityCard.styles';

const MAX_SLIDER_VALUE = 1; // currently we're just doing percentages, may change

export type EligibilitySliderTick = {
  position: number;
  label: string;
};

export type EligibilitySliderProps = {
  value: number;
  selectStatus: SelectStatusEnum;
};

/**
 * V2 Benchmark slider component using a single MUI Slider with visual segments.
 * This approach solves animation issues by having one continuous slider element
 * with CSS styling to create the appearance of separate segments.
 *
 * Benefits:
 * - Smooth animations across segment boundaries
 * - Single slider component (simpler architecture)
 * - Better performance
 * - Leverages MUI's built-in animations
 *
 */
const EligibilitySlider: FC<EligibilitySliderProps> = ({ value, selectStatus }) => {
  const {
    classes: {
      benchmarkSliderContainer,
      benchmarkSlider,
      thumb,
      rail,
      track,
      mark,
      markLabel,
      valueLabel,
      valueLabelMax,
      valueLabelMin,
      colorPrimary,
    },
  } = useEligibilityCardStyles();
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();

  const sliderPosition = useMemo(() => {
    if (selectStatus === SelectStatusEnum.Eligible) {
      return 1;
    }
    return Math.min(value, 1);
  }, [selectStatus, value]);
  const sliderPercentage = Math.min((sliderPosition / MAX_SLIDER_VALUE) * 100, 100);

  // Create marks at segment boundaries
  const marks = useMemo(() => {
    return [{ value: 1, label: translate('Label.EligibilityThreshold') }];
  }, [translate]);

  const trackStyle = useMemo(() => {
    const baseStyle = {
      left: 0,
      width: `${sliderPercentage}%`,
    };

    const backgroundStyle = '#335fff'; // todo: tokenize
    return {
      ...baseStyle,
      background: backgroundStyle,
    };
  }, [sliderPercentage]);

  const valueLabelStyle = useMemo(() => {
    if (sliderPosition < 0.1) {
      return valueLabelMin;
    }
    if (sliderPosition > 0.9) {
      return valueLabelMax;
    }
    return valueLabel;
  }, [sliderPosition, valueLabel, valueLabelMax, valueLabelMin]);

  return (
    <Container classes={{ root: benchmarkSliderContainer }} disableGutters maxWidth={false}>
      <div className={benchmarkSlider}>
        <Slider
          data-testid='eligibility-slider'
          aria-label='eligibility-slider'
          value={sliderPosition}
          track='normal'
          classes={{
            thumb,
            rail,
            track,
            colorPrimary,
            mark,
            markLabel,
            valueLabel: valueLabelStyle,
          }}
          slots={{
            thumb: EligibilitySliderThumb,
          }}
          slotProps={{
            track: {
              style: trackStyle,
            },
            thumb: {
              // color,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MUI will inject missing props at runtime
            } as any,
          }}
          marks={marks}
          max={1}
          min={0}
          valueLabelDisplay='on'
          valueLabelFormat={gameDetails?.name ?? translate('Label.YourGame')}
        />
      </div>
    </Container>
  );
};

export default EligibilitySlider;
