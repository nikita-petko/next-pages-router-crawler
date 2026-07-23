import { useCallback, useEffect, useState } from 'react';

import DevToolsPanel from '@components/devtools/DevToolsPanel';
import MetadataOverridesPanel from '@components/metadataOverrides/MetadataOverridesPanel';
import useMediaQuery from '@hooks/useMediaQuery';
import { IsMetadataOverridesEnabled } from '@utils/env';
import { getMetadataBooleanOverrides } from '@utils/metadataOverrides';

const MetadataOverridesTool = () => {
  const { isMedium } = useMediaQuery();
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [overrideCount, setOverrideCount] = useState<number>(0);

  useEffect(() => {
    setHasMounted(true);
    setOverrideCount(Object.keys(getMetadataBooleanOverrides()).length);
  }, []);

  const handleOverrideCountChange = useCallback((count: number) => {
    setOverrideCount(count);
  }, []);

  if (!hasMounted || !IsMetadataOverridesEnabled() || !isMedium) {
    return null;
  }

  return (
    <DevToolsPanel
      badge={{ count: overrideCount, type: 'count' }}
      closeLabel='Close'
      openLabel='Flags'
      positionVariant='metadataOverrides'
      title='Flags'>
      <MetadataOverridesPanel onOverrideCountChange={handleOverrideCountChange} />
    </DevToolsPanel>
  );
};

export default MetadataOverridesTool;
