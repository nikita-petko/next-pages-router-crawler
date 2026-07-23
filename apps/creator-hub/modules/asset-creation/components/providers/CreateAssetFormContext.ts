import { createContext } from 'react';

export interface CreateAssetFormContextValue {
  droppedFile: File | undefined; // the file the user dropped
  updateDroppedFile: (f?: File) => void;
}

const createAssetFormContext = createContext<CreateAssetFormContextValue>({
  droppedFile: undefined,
  updateDroppedFile: () => {},
});
createAssetFormContext.displayName = 'CreateAssetForm';

export default createAssetFormContext;
