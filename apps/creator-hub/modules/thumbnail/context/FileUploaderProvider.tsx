import type { FC } from 'react';
import React, { useState, useRef, useMemo, createContext, useContext, useCallback } from 'react';
import { makeStyles } from '@rbx/ui';

export enum FileUploaderId {
  HomepageThumbnail = 'homepageThumbnail',
  ExperienceDetailPageThumbnail = 'experienceDetailPageThumbnail',
  ThumbnailTableFileReplacer = 'thumbnailTableFileReplacer',
}

type FileUploader = {
  acceptMimeTypes: string[];
  handleChange: (files: FileList | null) => void;
  size?: number;
  allowMultiple?: boolean;
};

type TFileUploaderContext = {
  register: (id: FileUploaderId, fileUploader: FileUploader) => () => void;
  openFileBrowser: (id: FileUploaderId) => void;
};
const FileUploaderContext = createContext<TFileUploaderContext>({
  register: () => {
    throw new Error('useFileUploader is invoked without FileUploaderProvider');
  },
  openFileBrowser: () => {
    throw new Error('useFileUploader is invoked without FileUploaderProvider');
  },
});

export const useFileUploader = () => {
  return useContext(FileUploaderContext);
};

const useStyles = makeStyles()(() => ({
  invisibleInput: {
    display: 'none',
  },
}));

export const FileUploaderProvider: FC<React.PropsWithChildren> = ({ children }) => {
  const {
    classes: { invisibleInput },
  } = useStyles();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileUploadersRegistryRef = useRef<Map<FileUploaderId, FileUploader>>(new Map());

  // setCurrentUploader should only be invoked by openFileBrowser
  const [currentUploader, setCurrentUploader] = useState<FileUploader>({
    acceptMimeTypes: [],
    handleChange: () => {},
  });

  const providerValue: TFileUploaderContext = useMemo(
    () => ({
      register: (id: FileUploaderId, fileUploader: FileUploader) => {
        fileUploadersRegistryRef.current.set(id, fileUploader);
        return () => {
          fileUploadersRegistryRef.current.delete(id);
        };
      },
      openFileBrowser: (id: FileUploaderId) => {
        const fileUploader = fileUploadersRegistryRef.current.get(id);
        if (!fileUploader) {
          throw new Error(`FileUploader with id ${id} does not exist`);
        }
        setCurrentUploader(fileUploader);
        // open the file browser in the next tick after fileUploader is set
        setTimeout(() => {
          inputRef.current?.click();
        }, 0);
      },
    }),
    [],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { target } = e;
      if (currentUploader.handleChange) {
        currentUploader.handleChange(target.files);
      }

      // clear the stored files
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [currentUploader],
  );

  return (
    <FileUploaderContext.Provider value={providerValue}>
      {children}
      <input
        data-testid='file-uploader-input'
        accept={currentUploader.acceptMimeTypes.join(', ')}
        ref={inputRef}
        type='file'
        size={currentUploader.size}
        onChange={onChange}
        className={invisibleInput}
        multiple={currentUploader.allowMultiple}
      />
    </FileUploaderContext.Provider>
  );
};
