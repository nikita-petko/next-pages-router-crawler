import { createContext } from 'react';
import type { Creator } from '@modules/miscellaneous/common';

type SelectedCreatorContextType = {
  selectedCreator: Creator | null;
  setSelectedCreator: ((creator: Creator) => void) | null;
};

const SelectedCreatorContext = createContext<SelectedCreatorContextType>({
  selectedCreator: null,
  setSelectedCreator: null,
});

export default SelectedCreatorContext;
