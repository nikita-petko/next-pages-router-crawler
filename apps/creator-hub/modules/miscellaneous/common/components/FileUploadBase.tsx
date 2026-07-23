import React, { useRef, FunctionComponent } from 'react';
import CreateKeyboardEventHandler from '../utils/createKeyboardEventHandler';

export interface FileUploadBaseProps {
  onChange: (files: FileList | null) => void;
  onDragActiveHandler?: () => void;
  onDragLeaveHandler?: () => void;
  className?: string;
  multiple?: boolean;
  size?: number;
  children: (
    onClick: () => void,
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void,
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void,
    onDragOverOrEnter: (e: React.DragEvent<HTMLDivElement>) => void,
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void,
  ) => React.ReactElement;
  accept: string;
}

const FileUploadBase: FunctionComponent<FileUploadBaseProps> = ({
  className,
  onChange,
  onDragActiveHandler,
  onDragLeaveHandler,
  size,
  multiple,
  children,
  accept,
  ...otherProps
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const onClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const onKeyDown = CreateKeyboardEventHandler(onClick);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e;
    if (onChange) {
      onChange(target.files);
    }

    /**
     * Clear the stored files for the following reasons:
     * 1) This core component is meant to be stateless (already true for drag and drop case),
     * hence it should reset it self after handling over the files data.
     * 2) The browser's file input will re-fire the change event iff a file with a different name
     * is re-selected. Thus if we don't actually reset the input, it will cause issues for case
     * where the consumer need to allow "deletion".
     *
     * If you find that you need to expose more info (i.e. info for the event object) to the consumer,
     * please consider re-design the widget instead of approaches like pass it as an additional argument to
     * this.props.onChange.
     */

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const {
      dataTransfer: { files },
    } = e;

    if (onChange) {
      onChange(files);
    }
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (onDragLeaveHandler) {
      onDragLeaveHandler();
    }
  };

  const onDragOverOrEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (onDragActiveHandler) {
      onDragActiveHandler();
    }
  };

  const fileUploadBaseClasses = className;
  const userInterface = children
    ? children(onClick, onKeyDown, onDrop, onDragOverOrEnter, onDragLeave)
    : null;
  return (
    <div className={fileUploadBaseClasses}>
      {userInterface}
      <input
        {...otherProps}
        accept={accept}
        multiple={multiple}
        ref={inputRef}
        type='file'
        size={size}
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileUploadBase;
