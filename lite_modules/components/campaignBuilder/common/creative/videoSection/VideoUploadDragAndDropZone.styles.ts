import { makeStyles } from '@rbx/ui';

const useVideoUploadDragAndDropZoneStyles = makeStyles()(() => ({
  disabledDropZone: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  dragActiveDropZone: {
    backgroundColor: 'var(--color-state-hover)',
  },
  dropZone: {
    borderStyle: 'dashed',
    cursor: 'pointer',
  },
  sectionMarginTop: {
    marginTop: '16px',
  },

  uploadIconMarginRight: {
    marginRight: 1,
  },
}));

export default useVideoUploadDragAndDropZoneStyles;
