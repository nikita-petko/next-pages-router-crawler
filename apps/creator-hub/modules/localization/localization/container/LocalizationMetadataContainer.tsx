import React, { FunctionComponent } from 'react';
import GameProvider from '@modules/providers/game/GameProvider';
import LocalizationContainer from './LocalizationContainer';

const LocalizationMetadataContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  return (
    <GameProvider>
      <LocalizationContainer />
    </GameProvider>
  );
};

export default LocalizationMetadataContainer;
