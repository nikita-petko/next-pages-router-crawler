import { useFlag } from '@rbx/flags';
import { enableUgcFolders } from '@generated/flags/avatarMarketplace';

const useUGCFoldersGate = (): boolean | undefined => {
  const { ready, value } = useFlag(enableUgcFolders);

  if (!ready) {
    return undefined;
  }

  return value;
};

export default useUGCFoldersGate;
