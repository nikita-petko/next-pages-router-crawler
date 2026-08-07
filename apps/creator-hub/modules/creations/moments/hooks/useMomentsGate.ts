import { useFlag } from '@rbx/flags';
import { isMomentsUploadEnabled } from '@generated/flags/creatorCreations';

const useMomentsGate = (): boolean | undefined => {
  const { ready, value } = useFlag(isMomentsUploadEnabled);

  if (!ready) {
    return undefined;
  }

  return value;
};

export default useMomentsGate;
