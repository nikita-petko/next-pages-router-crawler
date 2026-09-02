import { makeStyles } from '@rbx/ui';

const useAssetUploaderStyles = makeStyles()(() => ({
  uploaderContainer: {
    columnGap: '16px',
  },

  uploadButton: {
    display: 'inline-block',
  },

  removeButton: {
    marginLeft: '4px',
  },

  fileUploadInfoContainer: {
    padding: '4px 12px',
  },
}));

export default useAssetUploaderStyles;
