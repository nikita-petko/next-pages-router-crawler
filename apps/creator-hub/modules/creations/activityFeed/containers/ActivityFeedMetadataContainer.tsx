import React, { FunctionComponent } from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
import ActivityFeedContainer from './ActvityFeedContainer';

const ActivityFeedMetadataContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => (
  <GameProvider>
    <ActivityFeedContainer />
  </GameProvider>
);

export default ActivityFeedMetadataContainer;
