import { useEffect } from 'react';
import type { NextLayoutPage } from 'next';
import { useRouter } from 'next/router';
import { PageLoading } from '@modules/miscellaneous/components';

/**
 * Legacy `/roadmap` route: Creator roadmap now lives under Updates at `/updates/roadmap`.
 */
const RoadMap: NextLayoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/updates/roadmap').catch(() => {});
  }, [router]);

  return <PageLoading />;
};

RoadMap.loggerConfig = { rosId: RosTeams.Knowledge };
export default RoadMap;
