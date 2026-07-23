import { useFlag } from '@rbx/flags';
import { enableExpeditedReview, enablePlayerSupport } from '@generated/flags/creatorGameops';

const creatorGameopsFlags = {
  enablePlayerSupport,
  enableExpeditedReview,
} as const;

type CreatorGameopsFlagName = keyof typeof creatorGameopsFlags;

type UseCreatorGameopsFlagsReturn<TFlagName extends CreatorGameopsFlagName> = Record<
  TFlagName,
  boolean | null
> & {
  ready: boolean;
};

type TUniverseContext = {
  universeId: number;
};

/**
 * Strictly-typed accessor for generated Creator GameOps flags.
 */
function useCreatorGameopsFlags<TFlagName extends CreatorGameopsFlagName>(
  flagName: TFlagName,
  context?: TUniverseContext,
): UseCreatorGameopsFlagsReturn<TFlagName> {
  const playerSupportResult = useFlag(enablePlayerSupport, {
    universeId: context?.universeId ?? 0,
  });
  const expeditedReviewResult = useFlag(enableExpeditedReview);

  const results = {
    enablePlayerSupport: playerSupportResult,
    enableExpeditedReview: expeditedReviewResult,
  } as const;

  const { ready, value } = results[flagName];

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- TypeScript cannot infer the computed generic key.
  return {
    [flagName]: value,
    ready,
  } as UseCreatorGameopsFlagsReturn<TFlagName>;
}

export { useCreatorGameopsFlags };
