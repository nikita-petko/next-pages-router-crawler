import type { FunctionComponent } from 'react';
import React, { useState, useMemo } from 'react';
import CreateAssetFormContext from './CreateAssetFormContext';

const CreateAssetFormProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const [droppedFile, setDroppedFile] = useState<File | undefined>();

  const updateDroppedFile = (f?: File) => {
    setDroppedFile(f);
  };

  const value = useMemo(() => ({ droppedFile, updateDroppedFile }), [droppedFile]);

  return (
    <CreateAssetFormContext.Provider value={value}>{children}</CreateAssetFormContext.Provider>
  );
};

export default CreateAssetFormProvider;
