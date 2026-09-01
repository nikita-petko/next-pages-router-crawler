import type { FunctionComponent } from 'react';
import React from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
import LocalizationContainer from './LocalizationContainer';

const LocalizationMetadataContainer: FunctionComponent<React.PropsWithChildren> = () => {
  return (
    <GameProvider>
      <LocalizationContainer />
    </GameProvider>
  );
};

export default LocalizationMetadataContainer;
