import React, { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { makeStyles, Tooltip, TTooltipProps } from '@rbx/ui';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import { ExperimentFormData } from '../types/FormData';
import MinimumDetectableEffectCard from './MinimumDetectableEffectCard';

const useStlyes = makeStyles()((theme) => ({
  tooltipContainer: {
    padding: 0,
    backgroundColor: theme.palette.surface[100],
    ...theme.border.radius.large,
  },
  tooltipHidden: {
    visibility: 'hidden',
    pointerEvents: 'none',
  },
  cardContainer: {
    marginTop: '16px',
    maxWidth: '900px',
  },
}));

/**
 * Renders the MDE card as a persistent tooltip when possible.
 * If the tooltip would overflow (e.g., due to a small window size after resizing), the card is shown inline instead.
 * This component is intended for use in experiment creation/edit flows and depends on the form fields: exposurePercent and goalMetric.
 */
const MDECardInForm: React.FC<{ forceInSeparateContainer?: boolean }> = ({
  forceInSeparateContainer = false,
}) => {
  const {
    classes: { tooltipContainer, tooltipHidden, cardContainer },
    cx,
  } = useStlyes();
  const { control } = useFormContext<ExperimentFormData>();
  const [exposurePercent, selectedGoalMetric, durationDays, variants, matchmakingVariants, type] =
    useWatch({
      control,
      name: [
        'exposurePercent',
        'goalMetric',
        'durationDays',
        'variants',
        'matchmakingVariants',
        'type',
      ],
    });

  const [isOverflowing, setOverflowing] = useState(false);

  const card = useMemo(() => {
    if (!selectedGoalMetric || !type) {
      return null;
    }

    let baselineProportion: number;
    let variantProportions: number[];
    switch (type) {
      case ExperimentProductType.Configs:
        baselineProportion = variants?.find((variant) => variant.isBaseline)?.weight ?? 50;
        variantProportions =
          variants?.filter((variant) => !variant.isBaseline).map((variant) => variant.weight) ?? [];
        if (variantProportions.length === 0) {
          variantProportions.push(50);
        }
        break;
      case ExperimentProductType.Matchmaking: {
        // For matchmaking, all variants have equal relative weight (unit of 1)
        // Calculate actual proportions based on total count
        const totalVariantsCount = matchmakingVariants?.length || 2;
        const unitWeight = 100 / totalVariantsCount; // Convert to percentage
        const treatmentVariantsCount = totalVariantsCount - 1; // -1 for the baseline variant
        baselineProportion = 100 - unitWeight * treatmentVariantsCount;
        variantProportions = Array(treatmentVariantsCount).fill(unitWeight);
        break;
      }
      default: {
        const exhaustiveCheck: never = type;
        throw new Error(`Unknown experiment type: ${exhaustiveCheck}`);
      }
    }

    return (
      <MinimumDetectableEffectCard
        exposurePercent={exposurePercent}
        metric={selectedGoalMetric}
        durationDays={durationDays}
        baselineProportion={baselineProportion}
        variantProportions={variantProportions}
      />
    );
  }, [selectedGoalMetric, type, exposurePercent, durationDays, variants, matchmakingVariants]);

  const popperProps: TTooltipProps['PopperProps'] = useMemo(
    () => ({
      disablePortal: true,
      modifiers: [
        // Checks if the tooltip is overflowing the viewport. If so, updates isOverflowing
        // so the MDE card can be rendered inline instead of inside a tooltip.
        {
          name: 'detectOverflow',
          enabled: true,
          phase: 'write', // This phase occurs after the DOM layout is complete
          fn({ state }) {
            const node = state.elements.popper as HTMLElement | undefined;
            if (!node) return;

            const rect = node.getBoundingClientRect();
            const overflowed =
              rect.top < 0 ||
              rect.left < 0 ||
              rect.bottom > window.innerHeight ||
              rect.right > window.innerWidth;

            setOverflowing((prev) => (prev === overflowed ? prev : overflowed));
          },
        },
        {
          name: 'offset',
          options: {
            offset: [0, 24],
          },
        },
        {
          name: 'flip',
          enabled: false,
        },
      ],
    }),
    [],
  );

  return (
    <React.Fragment>
      <Tooltip
        title={card}
        classes={{
          tooltip: cx(tooltipContainer, {
            [tooltipHidden]: isOverflowing || forceInSeparateContainer,
          }),
        }}
        placement='right'
        open
        PopperProps={popperProps}>
        <span />
      </Tooltip>
      <div className={cardContainer}>{isOverflowing || forceInSeparateContainer ? card : null}</div>
    </React.Fragment>
  );
};

export default MDECardInForm;
