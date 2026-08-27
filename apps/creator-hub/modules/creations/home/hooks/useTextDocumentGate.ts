import { useFlag } from '@rbx/flags';
import { isTextDocumentEnabled } from '@generated/flags/creatorCreations';

const useTextDocumentGate = (): boolean | undefined => {
  const { ready, value } = useFlag(isTextDocumentEnabled);

  if (!ready) {
    return undefined;
  }

  return value;
};

export default useTextDocumentGate;
