import React, { useMemo } from 'react';

/**
 * A preview of an image we have not uploaded (e.g. it is not an asset yet)
 */
const ImageBeforeUploadPreview = ({ file, className }: { file: File; className?: string }) => {
  const clientOnlyAssetUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, [file]);

  return <img src={clientOnlyAssetUrl} alt='preview' className={className} />;
};

export default ImageBeforeUploadPreview;
