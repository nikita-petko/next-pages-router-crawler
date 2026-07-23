import { useEffect, useMemo, useState, type FC } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { initFlags } from '@rbx/flags';
import type { WidgetProps } from '@rbx/flags/widget';
import { generatedFlags } from '@generated/flags/allFlags';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';

let overridesReady: Promise<boolean> | null = null;

const FeatureFlagLocalOverrideWidgetLazy = dynamic<WidgetProps>(
  () => import('@rbx/flags/widget').then(({ FloatingDraggableWidget }) => FloatingDraggableWidget),
  { ssr: false },
);

const FeatureFlagLocalOverrideWidget: FC = () => {
  const router = useRouter();
  const currentGroup = useCurrentGroup();
  const [overridesEnabled, setOverridesEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function resolveOverrides(): Promise<void> {
      try {
        overridesReady ??= initFlags({
          // Must match `application-id` in `.github/workflows/feature-flags.yml`.
          applicationId: 'creator-dashboard',
          baseUrl: process.env.bedev2BaseUrl,
        }).enableOverrides(
          process.env.NODE_ENV === 'development'
            ? { mode: 'development' }
            : { mode: 'authorized-only', useDefault: true },
        );

        const enabled = await overridesReady;
        if (mounted) {
          setOverridesEnabled(enabled);
        }
      } catch {
        if (mounted) {
          setOverridesEnabled(false);
        }
      }
    }

    void resolveOverrides();

    return () => {
      mounted = false;
    };
  }, []);

  const contexts = useMemo(() => {
    const { id } = router.query;
    const parsedUniverseId = typeof id === 'string' ? parseInt(id, 10) : NaN;

    return {
      ...(Number.isNaN(parsedUniverseId) ? {} : { universeId: parsedUniverseId }),
      ...(currentGroup ? { groupId: currentGroup.id } : {}),
    };
  }, [currentGroup, router.query]);

  return overridesEnabled ? (
    <FeatureFlagLocalOverrideWidgetLazy flags={generatedFlags} contexts={contexts} />
  ) : null;
};

export default FeatureFlagLocalOverrideWidget;
