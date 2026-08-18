import { useFlag } from '@rbx/flags';
import { enableCreatorShowcases } from '@generated/flags/avatarMarketplace';

/**
 * Gates every showcase surface. Returns `undefined` while the flag is still
 * resolving so callers can hold a loading state instead of flashing a disabled UI.
 */
const useShowcasesGate = (): boolean | undefined => {
  const { ready, value } = useFlag(enableCreatorShowcases);

  if (!ready) {
    return undefined;
  }

  return value;
};

export default useShowcasesGate;
