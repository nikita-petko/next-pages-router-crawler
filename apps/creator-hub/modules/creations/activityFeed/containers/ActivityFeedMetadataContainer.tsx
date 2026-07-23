import type { FunctionComponent } from 'react';
import React from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
import ActivityFeedContainer from './ActvityFeedContainer';

const ActivityFeedMetadataContainer: FunctionComponent<React.PropsWithChildren> = () => (
  <GameProvider>
    <ActivityFeedContainer />
  </GameProvider>
);

export default ActivityFeedMetadataContainer;
