import { useFlag } from '@rbx/flags';
import {
  isProductArchiveEnabled,
  mockHardCodedPrices,
  mockManagedPricingEvents,
  mockManagedPricingProductWrites,
  mockManagedPricingSummary,
} from '@generated/flags/monetization';

const monetizationFlags = {
  isProductArchiveEnabled,
  mockHardCodedPrices,
  mockManagedPricingEvents,
  mockManagedPricingProductWrites,
  mockManagedPricingSummary,
} as const;

type MonetizationFlagName = keyof typeof monetizationFlags;

type UseMonetizationFlagsReturn<TFlagName extends MonetizationFlagName> = Record<
  TFlagName,
  boolean | null
> & {
  ready: boolean;
};

/**
 * Strictly-typed accessor for generated Monetization flags.
 *
 * This keeps Monetization consumers on a uniform module-level hook, so callsites
 * do not need to import generated flag references or alias every `useFlag` call.
 * The returned object is keyed by the requested flag name and mirrors
 * `useFlag` readiness: the flag value is `null` until `ready` is true.
 *
 * @example
 * ```tsx
 * const { mockManagedPricingEvents, ready } = useMonetizationFlags(
 *   'mockManagedPricingEvents',
 * );
 *
 * if (!ready) return <Loading />;
 * return mockManagedPricingEvents ? <MockEventsFeed /> : <LiveEventsFeed />;
 * ```
 */
function useMonetizationFlags<TFlagName extends MonetizationFlagName>(
  flagName: TFlagName,
): UseMonetizationFlagsReturn<TFlagName> {
  const { ready, value } = useFlag(monetizationFlags[flagName]);

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- TypeScript cannot infer the computed generic key.
  return {
    [flagName]: value,
    ready,
  } as UseMonetizationFlagsReturn<TFlagName>;
}

export { useMonetizationFlags };
