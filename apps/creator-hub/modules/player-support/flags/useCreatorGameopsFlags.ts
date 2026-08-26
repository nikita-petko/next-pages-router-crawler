import { useFlag } from '@rbx/flags';
import { enablePlayerHostedEvents, enablePlayerSupport } from '@generated/flags/creatorGameops';

const creatorGameopsFlags = {
  enablePlayerHostedEvents,
  enablePlayerSupport,
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
  const playerHostedEventsResult = useFlag(enablePlayerHostedEvents);

  const results = {
    enablePlayerSupport: playerSupportResult,
    enablePlayerHostedEvents: playerHostedEventsResult,
  } as const;

  const { ready, value } = results[flagName];

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- TypeScript cannot infer the computed generic key.
  return {
    [flagName]: value,
    ready,
  } as UseCreatorGameopsFlagsReturn<TFlagName>;
}

export { useCreatorGameopsFlags };
