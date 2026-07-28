import type { ReactNode } from 'react';
import type { NextLayoutPage } from 'next';
import { useFlag } from '@rbx/flags';
import { isLeaderboardConfigsEnabled as isLeaderboardConfigsEnabledFlag } from '@generated/flags/leaderboards';
import Authenticated from '@modules/authentication/Authenticated';
import getCreationsPageLayout from '@modules/creations/common/implementations/getCreationsPageLayout';
import LeaderboardTitle from '@modules/creations/leaderboard/components/LeaderboardTitle';
import LeaderboardContainer from '@modules/creations/leaderboard/containers/LeaderboardContainer';
import { PageLoading } from '@modules/miscellaneous/components';
import { PageNotFound } from '@modules/miscellaneous/error';

const Leaderboard: NextLayoutPage = () => {
  const { ready: isFetched, value: isLeaderboardConfigsEnabledValue } = useFlag(
    isLeaderboardConfigsEnabledFlag,
  );
  const isLeaderboardConfigsEnabled = isLeaderboardConfigsEnabledValue === true;

  if (!isFetched) {
    return <PageLoading />;
  }

  if (!isLeaderboardConfigsEnabled) {
    return <PageNotFound />;
  }

  return (
    <Authenticated>
      <LeaderboardContainer />
    </Authenticated>
  );
};

Leaderboard.getPageLayout = (page: ReactNode) =>
  getCreationsPageLayout(page, { title: <LeaderboardTitle /> });
Leaderboard.loggerConfig = { rosId: RosTeams.Leaderboard };

export default Leaderboard;
