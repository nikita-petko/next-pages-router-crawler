import { useFlag } from '@rbx/flags';
import { isMomentsUploadLanguageSelectEnabled } from '@generated/flags/creatorCreations';

/** Whether the Moments upload language dropdown and publish language field are enabled. */
const useMomentsUploadLanguageSelectEnabled = (): boolean => {
  const { ready, value } = useFlag(isMomentsUploadLanguageSelectEnabled);

  return ready && (value ?? false);
};

export default useMomentsUploadLanguageSelectEnabled;
