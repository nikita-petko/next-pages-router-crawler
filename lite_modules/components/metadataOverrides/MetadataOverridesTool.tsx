import { useCallback, useEffect, useState } from 'react';

import DevToolsPanel from '@components/devtools/DevToolsPanel';
import MetadataOverridesPanel from '@components/metadataOverrides/MetadataOverridesPanel';
import useMediaQuery from '@hooks/useMediaQuery';
import { useAppStore } from '@stores/appStoreProvider';
import { IsMetadataOverridesEnabled } from '@utils/env';
import { getMetadataBooleanOverrides } from '@utils/metadataOverrides';

const MetadataOverridesTool = () => {
  const { isMedium } = useMediaQuery();
  const enableFrontendDevTools = useAppStore(
    (state) => state.appMetadataBaseData?.enableFrontendDevTools === true,
  );
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [overrideCount, setOverrideCount] = useState<number>(0);

  useEffect(() => {
    setHasMounted(true);
    setOverrideCount(Object.keys(getMetadataBooleanOverrides(enableFrontendDevTools)).length);
  }, [enableFrontendDevTools]);

  const handleOverrideCountChange = useCallback((count: number) => {
    setOverrideCount(count);
  }, []);

  if (!hasMounted || !IsMetadataOverridesEnabled(enableFrontendDevTools) || !isMedium) {
    return null;
  }

  return (
    <DevToolsPanel
      badge={{ count: overrideCount, type: 'count' }}
      closeLabel='Close'
      openLabel='Flags'
      positionVariant='metadataOverrides'
      title='Flags'>
      <MetadataOverridesPanel
        enableFrontendDevTools={enableFrontendDevTools}
        onOverrideCountChange={handleOverrideCountChange}
      />
    </DevToolsPanel>
  );
};

export default MetadataOverridesTool;
